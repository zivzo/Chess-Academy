// ── Openings list page ────────────────────────────────────────────────────────
import { OPENINGS } from "../chess-core.js";

export default function OpeningsPage({ onSelect }) {
  return (
    <div className="fade-in">
      <div className="page-title">Opening Library</div>
      <div className="page-subtitle">4 core openings with interactive boards. Click any card to study move-by-move.</div>
      <div className="opening-grid">
        {OPENINGS.map(o => (
          <div key={o.id} className={`opening-card color-${o.color}`} onClick={() => onSelect(o)}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.6rem"}}>
              <span className={`tag tag-diff-${o.diff}`}>{["","Beginner","Intermediate","Advanced"][o.diff]}</span>
              <span className="tag" style={{background:"#EEE8FF",color:"#4A3080"}}>{o.side}</span>
            </div>
            <h3>{o.name}</h3>
            <p>{o.desc}</p>
            <div className="moves">{o.moves.join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
