import { OPENINGS } from '../../data/openings.js';

export default function Sidebar({ page, selectedOpening, onNavigate, onSelectOpening }) {
  const SIDEBAR_CONCEPTS = [
    { id:"weak-squares",  label:"Weak Squares",   icon:"⬛" },
    { id:"rook-7th",      label:"Rook on 7th",    icon:"🏰" },
    { id:"piece-activity",label:"Piece Activity", icon:"⚡" },
    { id:"outpost",       label:"Outpost Knight", icon:"🧲" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Openings</div>
        {OPENINGS.map(o => (
          <div
            key={o.id}
            className={`sidebar-item ${selectedOpening?.id === o.id ? "active" : ""}`}
            onClick={() => onSelectOpening(o)}
          >
            <span className="icon">♟</span>{o.name}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Middlegame</div>
        {SIDEBAR_CONCEPTS.map(c => (
          <div key={c.id} className="sidebar-item" onClick={() => onNavigate("strategy")}>
            <span className="icon">{c.icon}</span>{c.label}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Learning</div>
        <div className={`sidebar-item ${page === "quiz" ? "active" : ""}`} onClick={() => onNavigate("quiz")}>
          <span className="icon">🎯</span>Take Quiz
          <span className="sidebar-badge">6 Qs</span>
        </div>
        <div className={`sidebar-item ${page === "theory" ? "active" : ""}`} onClick={() => onNavigate("theory")}>
          <span className="icon">📚</span>Theory Notes
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Practice</div>
        <div className={`sidebar-item ${page === "play" ? "active" : ""}`} onClick={() => onNavigate("play")}>
          <span className="icon">🤖</span>Play vs Bot
        </div>
      </div>
    </aside>
  );
}
