// ── Analysis page — replay a saved game with engine + personal notes ────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api.js";
import { fenToBoard, formatTimeMs } from "../utils/chessFen.js";
import { getStockfishAnalysis } from "../stockfish-api.js";
import { formatEval } from "../utils/formatters.js";
import Board from "./Board.jsx";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function fenTurn(fen) {
  return (String(fen).split(" ")[1] || "w");
}

// Convert a centipawn evaluation (white-relative) to a y-coord [0..60].
function evalToY(evalCp, mate) {
  if (mate != null) return mate > 0 ? 4 : 56;
  const v = Math.max(-1000, Math.min(1000, evalCp ?? 0));
  // 0 → 30 (centre); ±1000 → 0/60.
  return 30 - (v / 1000) * 26;
}

export default function AnalysisPage({ gameId, onBack }) {
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [ply, setPly] = useState(0); // 0 = start position, k = after k half-moves
  const [evalByPly, setEvalByPly] = useState({});
  const [topLine, setTopLine] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Per-move note editor state, keyed by ply.
  const [notesByPly, setNotesByPly] = useState({});
  const [summary, setSummary] = useState("");

  // Load game + analysis.
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get(`/api/games/${gameId}`), api.get(`/api/analyses/${gameId}`)])
      .then(([g, a]) => {
        if (cancelled) return;
        setGame(g.game);
        setSummary(a.analysis?.summary || "");
        const map = {};
        for (const n of a.analysis?.notes || []) map[n.ply] = n.comment || "";
        setNotesByPly(map);
      })
      .catch(e => { if (!cancelled) setError(e?.code || "load_failed"); });
    return () => { cancelled = true; };
  }, [gameId]);

  // Lookup the FEN for the current ply.
  const fenAtPly = useCallback((p) => {
    if (!game || p === 0) return START_FEN;
    return game.moves[p - 1]?.fenAfter || START_FEN;
  }, [game]);

  // Run engine on the current ply's position whenever ply changes.
  useEffect(() => {
    if (!game) return;
    const fen = fenAtPly(ply);
    const board = fenToBoard(fen);
    const turn = fenTurn(fen);
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopLine(null);
    getStockfishAnalysis(board, turn).then(r => {
      if (cancelled) return;
      setTopLine(r);
      setEvalByPly(prev => ({ ...prev, [ply]: { evalCp: r?.evaluation ?? null, mate: r?.mate ?? null } }));
    });
    return () => { cancelled = true; };
  }, [ply, game, fenAtPly]);

  // Run engine on every ply (for the eval graph + blunder finder).
  const analyzeAll = useCallback(async () => {
    if (!game) return;
    setLoadingAll(true);
    try {
      const total = game.moves.length;
      for (let p = 0; p <= total; p++) {
        if (evalByPly[p]) continue;
        const board = fenToBoard(fenAtPly(p));
        const turn = fenTurn(fenAtPly(p));
        const r = await getStockfishAnalysis(board, turn);
        setEvalByPly(prev => ({ ...prev, [p]: { evalCp: r?.evaluation ?? null, mate: r?.mate ?? null } }));
      }
    } finally {
      setLoadingAll(false);
    }
  }, [game, fenAtPly, evalByPly]);

  // Save notes (debounced).
  const saveTimer = useRef(null);
  const scheduleSave = useCallback((nextSummary, nextNotesByPly) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const notes = Object.entries(nextNotesByPly)
          .filter(([, v]) => (v ?? "").trim() !== "")
          .map(([k, v]) => ({ ply: Number(k), comment: v }));
        const r = await api.put(`/api/analyses/${gameId}`, { summary: nextSummary, notes });
        // eslint-disable-next-line no-unused-vars
        const _saved = r.analysis;
        setSavedAt(new Date());
      } catch {
        // ignore — the user can retry by editing again
      }
    }, 700);
  }, [gameId]);

  function changeSummary(v) {
    setSummary(v);
    scheduleSave(v, notesByPly);
  }
  function changeNote(p, v) {
    setNotesByPly(prev => {
      const next = { ...prev, [p]: v };
      scheduleSave(summary, next);
      return next;
    });
  }

  // Eval graph data
  const graphPoints = useMemo(() => {
    if (!game) return [];
    const total = game.moves.length;
    const pts = [];
    for (let p = 0; p <= total; p++) {
      const e = evalByPly[p];
      if (!e) continue;
      const x = total === 0 ? 0 : (p / total) * 100;
      const y = evalToY(e.evalCp, e.mate);
      pts.push({ p, x, y });
    }
    return pts;
  }, [game, evalByPly]);

  // Blunder finder: plies where the eval swung > 1.5 between consecutive plies.
  const blunders = useMemo(() => {
    if (!game) return [];
    const out = [];
    for (let p = 1; p <= game.moves.length; p++) {
      const a = evalByPly[p - 1];
      const b = evalByPly[p];
      if (!a || !b || a.mate != null || b.mate != null) continue;
      const swing = (b.evalCp ?? 0) - (a.evalCp ?? 0);
      // Big drop after white's move (odd p means white just moved → ply p+1 turn is black).
      const sideMoved = (p - 1) % 2 === 0 ? "w" : "b";
      const bad = sideMoved === "w" ? swing < -150 : swing > 150;
      if (bad) out.push({ ply: p, sideMoved, swing });
    }
    return out;
  }, [game, evalByPly]);

  if (error) return (
    <div className="fade-in">
      <button className="btn btn-sm btn-outline" onClick={onBack}>← Back</button>
      <div className="page-title">Analysis</div>
      <div className="form-error">Could not load this game ({error}).</div>
    </div>
  );
  if (!game) return <div className="fade-in"><div className="page-subtitle">Loading…</div></div>;

  const fen = fenAtPly(ply);
  const board = fenToBoard(fen);
  const totalPlies = game.moves.length;
  const lastMoveUci = ply > 0 ? game.moves[ply - 1]?.uci : null;
  let lastMove = null;
  if (lastMoveUci && typeof lastMoveUci === "string" && lastMoveUci.length >= 4) {
    const FILES = "abcdefgh";
    const fr = 8 - Number(lastMoveUci[1]);
    const fc = FILES.indexOf(lastMoveUci[0]);
    const tr = 8 - Number(lastMoveUci[3]);
    const tc = FILES.indexOf(lastMoveUci[2]);
    if (fc >= 0 && tc >= 0 && !isNaN(fr) && !isNaN(tr)) {
      lastMove = [{ r: fr, c: fc }, { r: tr, c: tc }];
    }
  }
  const evalText = topLine ? formatEval(topLine.evaluation, topLine.mate) : "…";

  return (
    <div className="fade-in" onKeyDown={(e) => {
      if (e.key === "ArrowLeft") setPly(p => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setPly(p => Math.min(totalPlies, p + 1));
      if (e.key === "Home") setPly(0);
      if (e.key === "End") setPly(totalPlies);
    }} tabIndex={0} style={{outline:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
        <button className="btn btn-sm btn-outline" onClick={onBack}>← Back</button>
        <div style={{fontSize:"0.82rem",color:"var(--muted)"}}>
          {savedAt && `Saved ${savedAt.toLocaleTimeString()}`}
        </div>
      </div>
      <div className="page-title">{game.whiteName} vs {game.blackName}</div>
      <div className="page-subtitle">
        {new Date(game.startedAt).toLocaleString()} • {game.type} • Result {game.result} ({game.termination})
      </div>

      <div className="board-wrap">
        <div>
          <Board board={board} size={56} lastMove={lastMove} />
          <div className="board-nav" style={{display:"flex",gap:"0.4rem",marginTop:"0.5rem"}}>
            <button className="nav-arrow" onClick={() => setPly(0)} disabled={ply === 0}>⟪</button>
            <button className="nav-arrow" onClick={() => setPly(p => Math.max(0, p - 1))} disabled={ply === 0}>‹</button>
            <button className="nav-arrow" onClick={() => setPly(p => Math.min(totalPlies, p + 1))} disabled={ply >= totalPlies}>›</button>
            <button className="nav-arrow" onClick={() => setPly(totalPlies)} disabled={ply >= totalPlies}>⟫</button>
            <span className="nav-counter">{ply} / {totalPlies}</span>
          </div>
          <div style={{marginTop:"0.5rem",fontSize:"0.85rem",color:"var(--muted)"}}>
            Use ← → arrows to step through the game.
          </div>
        </div>

        <div style={{flex:1,minWidth:340}}>
          <div className="card" style={{padding:"0.9rem"}}>
            <div className="card-title" style={{fontSize:"0.95rem",marginBottom:"0.4rem"}}>🔍 Engine</div>
            <div className="card-body">
              Eval (White): <strong>{evalText}</strong>
              {topLine?.move && (
                <> • Best: <strong>{topLine.move
                  ? `${"abcdefgh"[topLine.move.c]}${8-topLine.move.r}→${"abcdefgh"[topLine.move.tc]}${8-topLine.move.tr}`
                  : "—"}</strong></>
              )}
              {topLine?.source === "fallback" && <div style={{fontSize:"0.72rem",color:"var(--muted)"}}>(local fallback)</div>}
            </div>
            <div style={{marginTop:"0.6rem",display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
              <button className="btn btn-sm btn-outline" onClick={analyzeAll} disabled={loadingAll}>
                {loadingAll ? "Analyzing all plies…" : "Analyze whole game"}
              </button>
              {blunders.length > 0 && (
                <span className="status-pill">⚠️ {blunders.length} large eval swing(s)</span>
              )}
            </div>
          </div>

          {graphPoints.length > 1 && (
            <div className="eval-graph">
              <svg viewBox="0 0 100 60" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="100" y2="30" stroke="#aaa" strokeDasharray="2,2" strokeWidth="0.3" />
                <polyline
                  fill="none"
                  stroke="var(--brown)"
                  strokeWidth="0.6"
                  points={graphPoints.map(p => `${p.x},${p.y}`).join(" ")}
                />
                {graphPoints.map(p => (
                  <circle
                    key={p.p}
                    className="ply-marker"
                    cx={p.x}
                    cy={p.y}
                    r={p.p === ply ? 1.2 : 0.6}
                    fill={p.p === ply ? "var(--gold)" : "var(--brown)"}
                    onClick={() => setPly(p.p)}
                  />
                ))}
              </svg>
            </div>
          )}

          {blunders.length > 0 && (
            <div className="card" style={{padding:"0.7rem"}}>
              <div className="card-title" style={{fontSize:"0.9rem",marginBottom:"0.3rem"}}>Blunders</div>
              <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
                {blunders.map(b => (
                  <button key={b.ply} className="btn btn-sm btn-outline" onClick={() => setPly(b.ply)}>
                    Move {Math.ceil(b.ply / 2)}{b.sideMoved === "w" ? "." : "..."} {game.moves[b.ply-1]?.san}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card notes-panel" style={{padding:"0.9rem"}}>
            <div className="card-title" style={{fontSize:"0.95rem",marginBottom:"0.4rem"}}>📝 Game summary (your private notes)</div>
            <textarea
              placeholder="Overall takeaways, what you learned, what to study next…"
              value={summary}
              onChange={(e) => changeSummary(e.target.value)}
            />
          </div>

          <div className="card notes-panel" style={{padding:"0.9rem"}}>
            <div className="card-title" style={{fontSize:"0.95rem",marginBottom:"0.4rem"}}>
              Note for current move ({ply > 0 ? game.moves[ply-1]?.san : "start position"})
            </div>
            <textarea
              placeholder="Why did you play this? What did the engine prefer?"
              value={notesByPly[ply] || ""}
              onChange={(e) => changeNote(ply, e.target.value)}
            />
          </div>

          <div className="card" style={{padding:"0.7rem"}}>
            <div className="card-title" style={{fontSize:"0.9rem",marginBottom:"0.3rem"}}>Move list</div>
            <div className="move-list">
              <div
                className={`move-chip${ply === 0 ? " active" : ""}`}
                onClick={() => setPly(0)}
              >Start</div>
              {game.moves.map((m, i) => {
                const p = i + 1;
                const number = p % 2 === 1 ? `${Math.ceil(p/2)}.` : "";
                return (
                  <div
                    key={i}
                    className={`move-chip${ply === p ? " active" : ""}`}
                    onClick={() => setPly(p)}
                    title={notesByPly[p] ? `📝 ${notesByPly[p]}` : ""}
                  >
                    {number} {m.san}{notesByPly[p] ? " 📝" : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {game.type === "online" && game.timeControl && (
            <div className="card" style={{padding:"0.7rem"}}>
              <div className="card-title" style={{fontSize:"0.9rem",marginBottom:"0.3rem"}}>Clock at this move</div>
              <div style={{fontFamily:"DM Mono, monospace",fontSize:"0.9rem"}}>
                {ply > 0 ? (
                  <>
                    White: {formatTimeMs(game.moves[ply-1]?.timeLeftWhiteMs)} •
                    Black: {formatTimeMs(game.moves[ply-1]?.timeLeftBlackMs)}
                  </>
                ) : (
                  <>White: {formatTimeMs(game.timeControl.baseMs)} • Black: {formatTimeMs(game.timeControl.baseMs)} (start)</>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
