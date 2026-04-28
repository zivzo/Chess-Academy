// ── Play vs Stockfish — Lichess-style dark analysis interface ─────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIECES,
  START,
  createGameState,
  getLegalMovesWithRules,
  applyMoveWithRules,
  getGameStatus,
} from "../chess-core.js";
import {
  getStockfishMove,
  getStockfishAnalysis,
  DEFAULT_ENGINE_RATING,
  MIN_ENGINE_RATING,
  MAX_ENGINE_RATING,
} from "../stockfish-api.js";
import { strengthLabel, formatEval } from "../utils/formatters.js";

const FILES = "abcdefgh";

/** Produce a short algebraic label for a move (no disambiguation). */
function moveLabel(board, move) {
  const piece = board[move.r]?.[move.c];
  if (!piece) return `${FILES[move.tc]}${8 - move.tr}`;
  const type = piece[1];
  const dest = `${FILES[move.tc]}${8 - move.tr}`;
  const isCapture = Boolean(board[move.tr]?.[move.tc]);
  if (type === "P") return isCapture ? `${FILES[move.c]}x${dest}` : dest;
  return `${type}${isCapture ? "x" : ""}${dest}`;
}

function buildInitialState() {
  return {
    board: START.map(r => [...r]),
    gameState: createGameState(),
    turn: "w",
    status: "playing",
    lastFrom: null,
    lastTo: null,
  };
}

export default function GamePage() {
  // boardHistory[0] = start, boardHistory[n] = state after n half-moves
  const [boardHistory, setBoardHistory] = useState(() => [buildInitialState()]);
  // Short algebraic notation for each half-move
  const [moveNotations, setMoveNotations] = useState([]);
  // Index into boardHistory that is currently displayed
  const [viewIdx, setViewIdx] = useState(0);

  // Interaction state
  const [selected, setSelected]               = useState(null);
  const [movesFromSquare, setMovesFromSquare] = useState([]);
  const [draggingSquare, setDraggingSquare]   = useState(null);
  const dragValidDrop = useRef(false);

  // Engine
  const [engineRating, setEngineRating] = useState(DEFAULT_ENGINE_RATING);
  const moveRequestId = useRef(0);

  // Right-panel tab
  const [activeTab, setActiveTab] = useState("analysis");

  // Analysis result for the currently viewed position
  const [analysis, setAnalysis] = useState(null);

  // ── Derived live state ─────────────────────────────────────────────────────
  const liveState  = boardHistory[boardHistory.length - 1];
  const viewedState = boardHistory[viewIdx];
  const { board: liveBoard, gameState: liveGS, turn, status } = liveState;
  const { board: displayBoard } = viewedState;

  const isGameOver    = status === "checkmate" || status === "stalemate";
  const engineThinking = turn === "b" && !isGameOver;
  const isAtLatest    = viewIdx === boardHistory.length - 1;
  const canInteract   = isAtLatest && turn === "w" && !engineThinking && !isGameOver;

  // ── Engine plays as Black ──────────────────────────────────────────────────
  useEffect(() => {
    if (turn !== "b" || isGameOver) return;
    let cancelled = false;
    const requestId = ++moveRequestId.current;

    getStockfishMove(liveBoard, "b", engineRating).then((move) => {
      if (cancelled || requestId !== moveRequestId.current || !move) return;

      const notation = moveLabel(liveBoard, move);
      const { board: nextBoard, gameState: nextGS } = applyMoveWithRules(liveBoard, move, liveGS);
      const nextStatus = getGameStatus(nextBoard, "w", nextGS);
      const nextState = {
        board: nextBoard, gameState: nextGS, turn: "w", status: nextStatus,
        lastFrom: { r: move.r, c: move.c }, lastTo: { r: move.tr, c: move.tc },
      };

      setBoardHistory(prev => {
        const updated = [...prev, nextState];
        setViewIdx(updated.length - 1);
        return updated;
      });
      setMoveNotations(prev => [...prev, notation]);
    });

    return () => { cancelled = true; };
  }, [turn, liveBoard, engineRating, liveGS, isGameOver]);

  // ── Fetch analysis for the viewed position ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setAnalysis(null);
    const { board: vBoard, turn: vTurn } = viewedState;
    getStockfishAnalysis(vBoard, vTurn).then((result) => {
      if (!cancelled) setAnalysis(result);
    });
    return () => { cancelled = true; };
  }, [viewedState]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    moveRequestId.current++;
    setBoardHistory([buildInitialState()]);
    setMoveNotations([]);
    setViewIdx(0);
    setSelected(null);
    setMovesFromSquare([]);
    setAnalysis(null);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToMove = useCallback((idx, histLen) => {
    const len = histLen ?? boardHistory.length;
    const clamped = Math.max(0, Math.min(len - 1, idx));
    setViewIdx(clamped);
    setSelected(null);
    setMovesFromSquare([]);
  }, [boardHistory.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft")  setViewIdx(v => Math.max(0, v - 1));
      if (e.key === "ArrowRight") setViewIdx(v => Math.min(boardHistory.length - 1, v + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boardHistory.length]);

  // ── Square click ───────────────────────────────────────────────────────────
  function onSquareClick(r, c) {
    if (!isAtLatest) { setViewIdx(boardHistory.length - 1); return; }
    if (!canInteract) return;

    const chosenMove = movesFromSquare.find(m => m.tr === r && m.tc === c);
    if (selected && chosenMove) {
      const notation = moveLabel(liveBoard, chosenMove);
      const { board: nextBoard, gameState: nextGS } = applyMoveWithRules(liveBoard, chosenMove, liveGS);
      const nextStatus = getGameStatus(nextBoard, "b", nextGS);
      const nextState = {
        board: nextBoard, gameState: nextGS, turn: "b", status: nextStatus,
        lastFrom: { r: chosenMove.r, c: chosenMove.c }, lastTo: { r: chosenMove.tr, c: chosenMove.tc },
      };
      setBoardHistory(prev => {
        const updated = [...prev, nextState];
        setViewIdx(updated.length - 1);
        return updated;
      });
      setMoveNotations(prev => [...prev, notation]);
      setSelected(null);
      setMovesFromSquare([]);
      return;
    }

    const piece = liveBoard[r][c];
    if (!piece || piece[0] !== "w") { setSelected(null); setMovesFromSquare([]); return; }
    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(liveBoard, r, c, liveGS));
  }

  function onDragStart(e, r, c) {
    if (!canInteract) { e.preventDefault(); return; }
    const piece = liveBoard[r][c];
    if (!piece || piece[0] !== "w") { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText = "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 36, 36);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ghost.remove(), 0);
    setDraggingSquare({ r, c });
    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(liveBoard, r, c, liveGS));
  }

  function onDragOver(e, r, c) {
    if (movesFromSquare.some(m => m.tr === r && m.tc === c)) {
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
    }
  }

  function onDrop(e, r, c) {
    e.preventDefault(); dragValidDrop.current = true;
    onSquareClick(r, c); setDraggingSquare(null);
  }

  function onDragEnd() {
    if (!dragValidDrop.current) { setSelected(null); setMovesFromSquare([]); }
    dragValidDrop.current = false; setDraggingSquare(null);
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const moveDests    = new Set(movesFromSquare.map(m => `${m.tr}-${m.tc}`));
  const evalText     = analysis ? formatEval(analysis.evaluation, analysis.mate) : "…";
  const evalNum      = analysis?.mate != null
    ? (analysis.mate > 0 ? 10 : -10)
    : (analysis?.evaluation ?? 0);
  const whitePercent = Math.max(4, Math.min(96, 50 + evalNum * 4.6));

  // Build move pairs for the move list
  const movePairs = [];
  for (let i = 0; i < moveNotations.length; i += 2) {
    movePairs.push({ white: moveNotations[i], black: moveNotations[i + 1] ?? null });
  }
  // Index of the "current" notation = the move that got us to viewIdx
  const currentMoveIdx = viewIdx > 0 ? viewIdx - 1 : null;

  const { label: ratingLabel, css: ratingCss } = strengthLabel(engineRating);
  const isStrengthLocked = moveNotations.length > 0 && !isGameOver;

  const kingInCheckPos = (() => {
    if (viewedState.status !== "check" && viewedState.status !== "checkmate") return null;
    const b = displayBoard; const t = viewedState.turn;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === `${t}K`) return [r, c];
    return null;
  })();

  let statusMsg;
  if (status === "checkmate")      statusMsg = `Checkmate! ${turn === "w" ? "Black" : "White"} wins`;
  else if (status === "stalemate") statusMsg = "Stalemate — Draw";
  else if (engineThinking)         statusMsg = "Stockfish is thinking…";
  else if (status === "check")     statusMsg = `${turn === "w" ? "White" : "Black"} is in check`;
  else                             statusMsg = `${turn === "w" ? "White" : "Black"} to move`;

  const lastMove = viewedState.lastFrom ? viewedState : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lc-page">
      {/* ── Board section ── */}
      <div className="lc-board-section">
        {/* Black player label */}
        <div className="lc-player">
          <div className="lc-avatar">♟</div>
          <span className="lc-player-name">Black</span>
          {engineThinking && <span className="lc-thinking-dot" />}
        </div>

        <div className="lc-board-row">
          {/* Evaluation bar */}
          <div className="lc-eval-bar" title={evalText}>
            <div className="lc-eval-black" style={{ height: `${100 - whitePercent}%` }} />
            <div className="lc-eval-white" style={{ height: `${whitePercent}%` }} />
            <div className="lc-eval-score">{evalText}</div>
          </div>

          {/* Board with coordinate labels */}
          <div className="lc-board-coords">
            <div className="lc-ranks">
              {[8,7,6,5,4,3,2,1].map(r => (
                <div key={r} className="lc-rank-label">{r}</div>
              ))}
            </div>
            <div>
              <div className="lc-board">
                {displayBoard.map((row, ri) =>
                  row.map((piece, ci) => {
                    const isLight    = (ri + ci) % 2 === 0;
                    const isSel      = selected && selected[0] === ri && selected[1] === ci;
                    const isLegalEmp = moveDests.has(`${ri}-${ci}`) && !displayBoard[ri][ci];
                    const isLegalCap = moveDests.has(`${ri}-${ci}`) && Boolean(displayBoard[ri][ci]);
                    const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
                    const isCheck    = kingInCheckPos && kingInCheckPos[0] === ri && kingInCheckPos[1] === ci;
                    const isLastFrom = lastMove?.lastFrom?.r === ri && lastMove?.lastFrom?.c === ci;
                    const isLastTo   = lastMove?.lastTo?.r === ri && lastMove?.lastTo?.c === ci;
                    const cn = [
                      "sq",
                      isLight ? "lc-light" : "lc-dark",
                      isSel        && "selected",
                      isLegalEmp   && "legal-empty",
                      isLegalCap   && "legal-capture",
                      (isLastFrom || isLastTo) && "lc-last-move-sq",
                      canInteract && piece && piece[0] === "w" && "piece-grabbable",
                      isDragging   && "dragging",
                      isCheck      && "in-check",
                    ].filter(Boolean).join(" ");
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className={cn}
                        draggable={canInteract && Boolean(piece && piece[0] === "w")}
                        onClick={() => onSquareClick(ri, ci)}
                        onDragStart={(e) => onDragStart(e, ri, ci)}
                        onDragOver={(e)  => onDragOver(e, ri, ci)}
                        onDrop={(e)      => onDrop(e, ri, ci)}
                        onDragEnd={onDragEnd}
                      >
                        {piece ? PIECES[piece] : ""}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="lc-files">
                {["a","b","c","d","e","f","g","h"].map(f => (
                  <div key={f} className="lc-file-label">{f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* White player label */}
        <div className="lc-player">
          <div className="lc-avatar lc-avatar-white">♔</div>
          <span className="lc-player-name">White</span>
          {isAtLatest && analysis && !engineThinking && (
            <span className="lc-player-eval">{evalNum > 0 ? `+${evalNum.toFixed(1)}` : ""}</span>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="lc-panel">
        <div className="lc-panel-title">
          <span className="lc-panel-icon">⊕</span> Analysis
        </div>

        <div className="lc-panel-tabs">
          <button
            className={`lc-panel-tab ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >Analysis</button>
          <button
            className={`lc-panel-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >Settings</button>
        </div>

        {activeTab === "analysis" && (
          <div className="lc-analysis-body">
            <div className="lc-analysis-bar">
              <span className="lc-analysis-label">
                <span className="lc-green-dot" /> Analysis
              </span>
              <span className="lc-depth-badge">depth=15</span>
            </div>

            {moveNotations.length > 0 && (
              <div className="lc-last-move-info">
                ⚫ <strong>{moveNotations[moveNotations.length - 1]}</strong> was played
              </div>
            )}

            {analysis ? (
              <div className="lc-engine-line">
                <span className={`lc-eval-chip ${evalNum >= 0 ? "lc-eval-white-adv" : "lc-eval-black-adv"}`}>
                  {evalText}
                </span>
                <span className="lc-engine-best">
                  Best: {moveLabel(viewedState.board, analysis.move)}
                </span>
                {analysis.source === "local" && (
                  <span className="lc-engine-src">(local)</span>
                )}
              </div>
            ) : (
              <div className="lc-engine-thinking">Analyzing…</div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="lc-settings-body">
            <div className="lc-setting-label">
              Engine Strength: <strong>{engineRating}</strong> Elo
              <span className={`strength-badge ${ratingCss}`}>{ratingLabel}</span>
            </div>
            <input
              type="range"
              min={MIN_ENGINE_RATING} max={MAX_ENGINE_RATING} step={100}
              value={engineRating}
              disabled={isStrengthLocked}
              onChange={(e) => setEngineRating(Number(e.target.value))}
              className="lc-range"
            />
            <div className="lc-range-ends">
              <span>Beginner</span><span>Master</span>
            </div>
            {isStrengthLocked && (
              <div className="lc-locked-hint">🔒 Locked during game. Reset to change.</div>
            )}
          </div>
        )}

        {/* Status pill */}
        <div className="lc-status">
          {isGameOver ? "🏁" : status === "check" ? "⚠️" : "●"} {statusMsg}
        </div>

        {/* Move list */}
        <div className="lc-move-list-header">White — Black</div>
        <div className="lc-move-list" ref={el => {
          if (el && currentMoveIdx !== null) {
            const active = el.querySelector(".lc-move-cell.active");
            active?.scrollIntoView({ block: "nearest" });
          }
        }}>
          {moveNotations.length === 0 && (
            <div className="lc-no-moves">No moves yet — play as White</div>
          )}
          {movePairs.map((pair, i) => (
            <div key={i} className="lc-move-row">
              <span className="lc-move-num">{i + 1}.</span>
              <button
                className={`lc-move-cell ${currentMoveIdx === i * 2 ? "active" : ""}`}
                onClick={() => goToMove(i * 2 + 1)}
              >{pair.white}</button>
              {pair.black != null && (
                <button
                  className={`lc-move-cell ${currentMoveIdx === i * 2 + 1 ? "active" : ""}`}
                  onClick={() => goToMove(i * 2 + 2)}
                >{pair.black}</button>
              )}
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="lc-nav-row">
          <button className="lc-nav-btn" onClick={() => goToMove(0)}          disabled={viewIdx === 0}>|◀</button>
          <button className="lc-nav-btn" onClick={() => goToMove(viewIdx - 1)} disabled={viewIdx === 0}>◀</button>
          <button className="lc-nav-btn" onClick={() => goToMove(viewIdx + 1)} disabled={isAtLatest}>▶</button>
          <button className="lc-nav-btn" onClick={() => goToMove(boardHistory.length - 1)} disabled={isAtLatest}>▶|</button>
        </div>

        {/* Action buttons */}
        <div className="lc-action-row">
          <button className="lc-action-btn" onClick={resetGame}>⊕ New Game</button>
          {!isAtLatest && (
            <button className="lc-action-btn" onClick={() => goToMove(boardHistory.length - 1)}>
              ▶ Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
