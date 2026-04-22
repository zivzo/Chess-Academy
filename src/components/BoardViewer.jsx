import { useState } from 'react';
import { PIECE_UNICODE } from '../chess/constants.js';

export default function BoardViewer({ opening, onBack }) {
  const [step, setStep] = useState(0);
  const pos = opening.positions[step];

  return (
    <div className="fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="page-title" style={{ marginBottom:0 }}>{opening.name}</div>
          <div className="page-subtitle" style={{ marginBottom:0 }}>Move {step} of {opening.positions.length - 1}</div>
        </div>
      </div>

      <div className="board-wrap">
        <div className="board-outer">
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map(f => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{ display:"flex", flexDirection:"column" }}>
              {[8,7,6,5,4,3,2,1].map(r => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {pos.board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isHL = pos.highlight.some(([hr,hc]) => hr === ri && hc === ci);
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`sq ${isLight ? "light" : "dark"} ${isHL ? "highlight" : ""}`}
                    >
                      {piece ? PIECE_UNICODE[piece] : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="board-nav">
            <button className="nav-arrow" disabled={step===0} onClick={() => setStep(0)}>⟪</button>
            <button className="nav-arrow" disabled={step===0} onClick={() => setStep(s => s-1)}>‹</button>
            <button className="nav-arrow" disabled={step===opening.positions.length-1} onClick={() => setStep(s => s+1)}>›</button>
            <button className="nav-arrow" disabled={step===opening.positions.length-1} onClick={() => setStep(opening.positions.length-1)}>⟫</button>
          </div>
        </div>

        <div className="move-list-wrap">
          <div className="move-list-title">Moves</div>
          <div className="move-list">
            <div className="move-chip active" onClick={() => setStep(0)} style={step===0 ? {} : { opacity:0.5 }}>Start</div>
            {opening.moves.map((m, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                {i % 2 === 0 && <span className="move-number">{Math.floor(i/2)+1}.</span>}
                <div className={`move-chip ${step===i+1 ? "active" : ""}`} onClick={() => setStep(i+1)}>{m}</div>
              </div>
            ))}
          </div>

          <div className="annotation">{pos.annotation}</div>

          <div style={{ marginTop:"1.25rem" }}>
            <div className="card-title" style={{ fontSize:"0.88rem", marginBottom:"0.5rem" }}>💡 Key Ideas</div>
            <ul style={{ paddingLeft:"1.2rem", fontSize:"0.85rem", color:"#4A3F35", lineHeight:"1.9" }}>
              {opening.ideas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
