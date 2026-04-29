// ── Chess Academy — root application component ────────────────────────────────
import { useState } from "react";
import { OPENINGS } from "./chess-core.js";
import { isMuted, toggleMute } from "./utils/chessSound.js";
import GlobalStyles from "./styles/GlobalStyles.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import OpeningsPage from "./pages/OpeningsPage.jsx";
import BoardViewer from "./pages/BoardViewer.jsx";
import LocalGamePage from "./pages/LocalGamePage.jsx";
import GamePage from "./pages/GamePage.jsx";
import StrategyPage from "./pages/StrategyPage.jsx";
import TheoryPage from "./pages/TheoryPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

export default function ChessAcademy() {
  const [page, setPage] = useState("home");
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [soundMuted, setSoundMuted] = useState(isMuted);

  function handleToggleSound() {
    const next = toggleMute();
    setSoundMuted(next);
  }

  const NAV = [
    { id:"home", label:"🏠 Home" },
    { id:"games", label:"♟ Games" },
    { id:"openings", label:"📖 Openings" },
    { id:"play", label:"♜ Local Game" },
    { id:"strategy", label:"⚔️ Strategy" },
    { id:"theory", label:"📚 Theory" },
    { id:"quiz", label:"🎯 Quiz" },
  ];

  const SIDEBAR_OPENINGS = OPENINGS.map(o => ({ id:o.id, label:o.name, icon:"♟" }));
  const SIDEBAR_CONCEPTS = [
    { id:"weak-squares", label:"Weak Squares", icon:"⬛" },
    { id:"rook-7th", label:"Rook on 7th", icon:"🏰" },
    { id:"piece-activity", label:"Piece Activity", icon:"⚡" },
    { id:"outpost", label:"Outpost Knight", icon:"🧲" },
  ];

  return (
    <>
      <GlobalStyles />
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-logo">Chess<span>Academy</span></div>
          <nav className="header-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${page===n.id?"active":""}`}
                onClick={() => { setPage(n.id); setSelectedOpening(null); }}>
                {n.label}
              </button>
            ))}
            <button
              className="mute-btn"
              onClick={handleToggleSound}
              aria-label="Toggle sound"
              title={soundMuted ? "Sound off — click to enable" : "Sound on — click to mute"}
            >
              {soundMuted ? "🔇" : "🔊"}
            </button>
          </nav>
        </header>

        <div className="main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Openings</div>
              {SIDEBAR_OPENINGS.map(o => (
                <div key={o.id}
                  className={`sidebar-item ${selectedOpening?.id===o.id?"active":""}`}
                  onClick={() => { setPage("openings"); setSelectedOpening(OPENINGS.find(x=>x.id===o.id)); }}>
                  <span className="icon">{o.icon}</span>{o.label}
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-label">Middlegame</div>
              {SIDEBAR_CONCEPTS.map(c => (
                <div key={c.id} className="sidebar-item"
                  onClick={() => { setPage("strategy"); setSelectedOpening(null); }}>
                  <span className="icon">{c.icon}</span>{c.label}
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-label">Games</div>
              <div className={`sidebar-item ${page==="games"?"active":""}`}
                onClick={() => { setPage("games"); setSelectedOpening(null); }}>
                <span className="icon">♟</span>Play vs Stockfish
              </div>
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-label">Learning</div>
              <div className={`sidebar-item ${page==="quiz"?"active":""}`}
                onClick={() => { setPage("quiz"); setSelectedOpening(null); }}>
                <span className="icon">🎯</span>Take Quiz
                <span className="sidebar-badge">6 Qs</span>
              </div>
              <div className={`sidebar-item ${page==="play"?"active":""}`}
                onClick={() => { setPage("play"); setSelectedOpening(null); }}>
                <span className="icon">♜</span>Local Game
              </div>
              <div className={`sidebar-item ${page==="theory"?"active":""}`}
                onClick={() => { setPage("theory"); setSelectedOpening(null); }}>
                <span className="icon">📚</span>Theory Notes
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="content">
            {page==="home" && <Dashboard onNavigate={p => { setPage(p); setSelectedOpening(null); }} />}
            {page==="games" && <GamePage />}
            {page==="openings" && !selectedOpening && <OpeningsPage onSelect={o => setSelectedOpening(o)} />}
            {page==="openings" && selectedOpening && <BoardViewer opening={selectedOpening} onBack={() => setSelectedOpening(null)} />}
            {page==="play" && <LocalGamePage />}
            {page==="strategy" && <StrategyPage />}
            {page==="theory" && <TheoryPage />}
            {page==="quiz" && <QuizPage />}
          </main>
        </div>
      </div>
    </>
  );
}
