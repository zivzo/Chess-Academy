// ── Interactive board viewer ──────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { PIECES } from "../chess-core.js";
import { playNavStep } from "../utils/chessSound.js";

export default function BoardViewer({ opening, onBack }) {
  const [step, setStep] = useState(0);
  const [variantId, setVariantId] = useState(null);
  const [ariaMsg, setAriaMsg] = useState("");
  const boardRef = useRef(null);

  const variations = opening.variations ?? [];
  const activeVariation = variantId
    ? variations.find((v) => v.id === variantId)
    : null;
  const line = activeVariation ?? opening;
  const lineLabel = activeVariation ? activeVariation.name : "Main Line";
  // Reset the move pointer when the user picks a different opening or
  // variation. Adjusting state during render (the React-recommended pattern)
  // avoids the "set-state-in-effect" anti-pattern.
  const lineKey = `${opening.id}|${variantId ?? ""}`;
  const [prevLineKey, setPrevLineKey] = useState(lineKey);
  if (prevLineKey !== lineKey) {
    setPrevLineKey(lineKey);
    setStep(0);
  }
  const pos = line.positions[step] ?? line.positions[0];
  const maxStep = line.positions.length - 1;

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    setStep(s => {
      if (s === 0) return s;
      playNavStep();
      const next = s - 1;
      const moveName = next === 0 ? "Start" : line.moves[next - 1];
      setAriaMsg(`Move ${next} of ${maxStep}: ${moveName}`);
      return next;
    });
  }, [line.moves, maxStep]);

  const goForward = useCallback(() => {
    setStep(s => {
      if (s >= maxStep) return s;
      playNavStep();
      const next = s + 1;
      const moveName = line.moves[next - 1];
      setAriaMsg(`Move ${next} of ${maxStep}: ${moveName}`);
      return next;
    });
  }, [line.moves, maxStep]);

  const goToStart = useCallback(() => {
    setStep(0);
    playNavStep();
    setAriaMsg("Start position");
  }, []);

  const goToEnd = useCallback(() => {
    setStep(maxStep);
    playNavStep();
    setAriaMsg(`Move ${maxStep} of ${maxStep}: ${line.moves[maxStep - 1] ?? ""}`);
  }, [line.moves, maxStep]);

  // ── Keyboard handler ─────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "ArrowLeft")  { e.preventDefault(); goBack(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goForward(); }
    if (e.key === "Home")       { e.preventDefault(); goToStart(); }
    if (e.key === "End")        { e.preventDefault(); goToEnd(); }
  }

  // Keep aria message in sync when step is changed via click
  useEffect(() => {
    if (step === 0) {
      setAriaMsg("Start position");
    } else {
      const moveName = line.moves[step - 1] ?? "";
      const side = step % 2 === 1 ? "White" : "Black";
      setAriaMsg(`Move ${step} of ${maxStep}: ${side} plays ${moveName}`);
    }
  }, [step, line.moves, maxStep]);

  return (
    <div className="fade-in">
      {/* Screen-reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaMsg}</div>

      <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.25rem"}}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="page-title" style={{marginBottom:0}}>{opening.name}</div>
          <div className="page-subtitle" style={{marginBottom:0}}>
            <strong>{lineLabel}</strong> — Move {step} of {line.positions.length - 1}
          </div>
        </div>
      </div>

      <div className="board-wrap">
        <div
          className="board-outer"
          ref={boardRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`Chess board — ${lineLabel}. Move ${step} of ${maxStep}. Use arrow keys to navigate moves.`}
          style={{outline:"none"}}
        >
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map(f => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map(r => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {pos.board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isHL = pos.highlight.some(([hr,hc]) => hr === ri && hc === ci);
                  return (
                    <div key={`${ri}-${ci}`}
                      className={`sq ${isLight?"light":"dark"} ${isHL?"highlight":""}`}>
                      {piece ? PIECES[piece] : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="board-nav">
            <button
              className="nav-arrow" disabled={step===0}
              onClick={goToStart}
              aria-label="Go to start"
            >⟪</button>
            <button
              className="nav-arrow" disabled={step===0}
              onClick={goBack}
              aria-label="Previous move"
            >‹</button>
            <button
              className="nav-arrow" disabled={step===maxStep}
              onClick={goForward}
              aria-label="Next move"
            >›</button>
            <button
              className="nav-arrow" disabled={step===maxStep}
              onClick={goToEnd}
              aria-label="Go to end"
            >⟫</button>
            <span className="nav-counter">
              {step} / {maxStep}
            </span>
          </div>
        </div>

        <div className="move-list-wrap">
          <div className="move-list-title">Moves</div>
          <div className="move-list">
            <div
              className="move-chip active"
              onClick={() => { setStep(0); setAriaMsg("Start position"); }}
              style={step===0?{}:{opacity:0.5}}
            >Start</div>
            {line.moves.map((m, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:"3px"}}>
                {i % 2 === 0 && <span className="move-number">{Math.floor(i/2)+1}.</span>}
                <div
                  className={`move-chip ${step===i+1?"active":""}`}
                  onClick={() => { setStep(i+1); }}
                >{m}</div>
              </div>
            ))}
          </div>

          <div className="annotation">{pos.annotation}</div>

          {variations.length > 0 && (
            <div style={{marginTop:"1.25rem"}}>
              <div className="card-title" style={{fontSize:"0.88rem",marginBottom:"0.5rem"}}>
                🌿 Variations <span style={{fontWeight:400,color:"var(--muted)",fontSize:"0.78rem"}}>(theory through move 10)</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.6rem"}}>
                <button
                  type="button"
                  className={`btn btn-sm ${variantId===null?"":"btn-outline"}`}
                  onClick={() => setVariantId(null)}>
                  Main Line
                </button>
                {variations.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    className={`btn btn-sm ${variantId===v.id?"":"btn-outline"}`}
                    onClick={() => setVariantId(v.id)}>
                    {v.name}
                  </button>
                ))}
              </div>
              {activeVariation && (
                <div style={{fontSize:"0.82rem",color:"#4A3F35",lineHeight:"1.55",background:"#FFF8EE",border:"1px solid #F0E2C4",borderRadius:"8px",padding:"0.55rem 0.75rem"}}>
                  {activeVariation.desc}
                </div>
              )}
            </div>
          )}

          <div style={{marginTop:"1.25rem"}}>
            <div className="card-title" style={{fontSize:"0.88rem",marginBottom:"0.5rem"}}>💡 Key Ideas</div>
            <ul style={{paddingLeft:"1.2rem",fontSize:"0.85rem",color:"#4A3F35",lineHeight:"1.9"}}>
              {opening.ideas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
