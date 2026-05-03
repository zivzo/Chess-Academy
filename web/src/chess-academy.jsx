// ── Chess Academy — root application component ────────────────────────────────
import { useState } from "react";
import { OPENINGS } from "./chess-core.js";
import { isMuted, toggleMute } from "./utils/chessSound.js";
import { AuthProvider } from "./utils/auth.jsx";
import { useAuth } from "./utils/useAuth.js";
import GlobalStyles from "./styles/GlobalStyles.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import OpeningsPage from "./pages/OpeningsPage.jsx";
import BoardViewer from "./pages/BoardViewer.jsx";
import LocalGamePage from "./pages/LocalGamePage.jsx";
import GamePage from "./pages/GamePage.jsx";
import StrategyPage from "./pages/StrategyPage.jsx";
import TheoryPage from "./pages/TheoryPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MyGamesPage from "./pages/MyGamesPage.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import OnlineGamePage from "./pages/OnlineGamePage.jsx";

export default function ChessAcademy() {
  return (
    <AuthProvider>
      <ChessAcademyShell />
    </AuthProvider>
  );
}

function ChessAcademyShell() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [soundMuted, setSoundMuted] = useState(isMuted);
  const [analysisGameId, setAnalysisGameId] = useState(null);
  const [onlineGame, setOnlineGame] = useState(null);

  function handleToggleSound() {
    const next = toggleMute();
    setSoundMuted(next);
  }

  function navigate(p) {
    setPage(p);
    setSelectedOpening(null);
    if (p !== "analysis") setAnalysisGameId(null);
    if (p !== "online-game") setOnlineGame(null);
  }

  // Pages that require a logged-in user.
  const AUTH_REQUIRED = new Set(["my-games", "online", "online-game", "analysis"]);
  if (AUTH_REQUIRED.has(page) && !user && !loading) {
    // Show login when guarded route is requested without auth.
    return (
      <>
        <GlobalStyles />
        <div className="app">
          <Header
            page="login"
            navigate={navigate}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            user={user}
            onLogout={logout}
          />
          <div className="main" style={{gridTemplateColumns: "1fr"}}>
            <main className="content">
              <LoginPage onSuccess={() => navigate(page)} onSwitch={() => navigate("register")} />
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="app">
        <Header
          page={page}
          navigate={navigate}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          user={user}
          onLogout={logout}
        />

        <div className="main">
          {/* Sidebar */}
          <aside className="sidebar">
            <Sidebar
              page={page}
              navigate={navigate}
              selectedOpening={selectedOpening}
              setSelectedOpening={setSelectedOpening}
              user={user}
            />
          </aside>

          {/* Content */}
          <main className="content">
            {page==="home" && <Dashboard onNavigate={navigate} />}
            {page==="games" && <GamePage />}
            {page==="openings" && !selectedOpening && <OpeningsPage onSelect={o => setSelectedOpening(o)} />}
            {page==="openings" && selectedOpening && <BoardViewer opening={selectedOpening} onBack={() => setSelectedOpening(null)} />}
            {page==="play" && <LocalGamePage />}
            {page==="strategy" && <StrategyPage />}
            {page==="theory" && <TheoryPage />}
            {page==="quiz" && <QuizPage />}
            {page==="login" && <LoginPage onSuccess={() => navigate("home")} onSwitch={() => navigate("register")} />}
            {page==="register" && <RegisterPage onSuccess={() => navigate("home")} onSwitch={() => navigate("login")} />}
            {page==="my-games" && (
              <MyGamesPage onOpenGame={(id) => { setAnalysisGameId(id); setPage("analysis"); }} />
            )}
            {page==="analysis" && analysisGameId && (
              <AnalysisPage gameId={analysisGameId} onBack={() => navigate("my-games")} />
            )}
            {page==="online" && (
              <LobbyPage onGameStart={(g) => { setOnlineGame(g); setPage("online-game"); }} />
            )}
            {page==="online-game" && onlineGame && (
              <OnlineGamePage
                initialGame={onlineGame}
                onAnalyze={(id) => { setAnalysisGameId(id); setPage("analysis"); }}
                onLeave={() => navigate("online")}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function Header({ page, navigate, soundMuted, onToggleSound, user, onLogout }) {
  const NAV = [
    { id: "home", label: "🏠 Home" },
    { id: "games", label: "♟ Games" },
    { id: "openings", label: "📖 Openings" },
    { id: "play", label: "♜ Local Game" },
    { id: "online", label: "🌐 Online", auth: true },
    { id: "my-games", label: "📜 My Games", auth: true },
    { id: "strategy", label: "⚔️ Strategy" },
    { id: "theory", label: "📚 Theory" },
    { id: "quiz", label: "🎯 Quiz" },
  ];
  return (
    <header className="header">
      <div className="header-logo">Chess<span>Academy</span></div>
      <nav className="header-nav">
        {NAV.filter(n => !n.auth || user).map(n => (
          <button key={n.id} className={`nav-btn ${page===n.id?"active":""}`}
            onClick={() => navigate(n.id)}>
            {n.label}
          </button>
        ))}
        <button
          className="mute-btn"
          onClick={onToggleSound}
          aria-label="Toggle sound"
          title={soundMuted ? "Sound off — click to enable" : "Sound on — click to mute"}
        >
          {soundMuted ? "🔇" : "🔊"}
        </button>
        <div className="header-user">
          {user ? (
            <>
              <span className="header-user-name" title={user.email}>👤 {user.username}</span>
              <button className="header-user-btn" onClick={() => onLogout()}>Log out</button>
            </>
          ) : (
            <>
              <button className="header-user-btn" onClick={() => navigate("login")}>Log in</button>
              <button className="header-user-btn primary" onClick={() => navigate("register")}>Sign up</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function Sidebar({ page, navigate, selectedOpening, setSelectedOpening, user }) {
  const SIDEBAR_OPENINGS = OPENINGS.map(o => ({ id:o.id, label:o.name, icon:"♟" }));
  const SIDEBAR_CONCEPTS = [
    { id:"weak-squares", label:"Weak Squares", icon:"⬛" },
    { id:"rook-7th", label:"Rook on 7th", icon:"🏰" },
    { id:"piece-activity", label:"Piece Activity", icon:"⚡" },
    { id:"outpost", label:"Outpost Knight", icon:"🧲" },
  ];
  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-label">Openings</div>
        {SIDEBAR_OPENINGS.map(o => (
          <div key={o.id}
            className={`sidebar-item ${selectedOpening?.id===o.id?"active":""}`}
            onClick={() => { navigate("openings"); setSelectedOpening(OPENINGS.find(x=>x.id===o.id)); }}>
            <span className="icon">{o.icon}</span>{o.label}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Middlegame</div>
        {SIDEBAR_CONCEPTS.map(c => (
          <div key={c.id} className="sidebar-item"
            onClick={() => navigate("strategy")}>
            <span className="icon">{c.icon}</span>{c.label}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Games</div>
        <div className={`sidebar-item ${page==="games"?"active":""}`}
          onClick={() => navigate("games")}>
          <span className="icon">♟</span>Play vs Stockfish
        </div>
        <div className={`sidebar-item ${page==="play"?"active":""}`}
          onClick={() => navigate("play")}>
          <span className="icon">♜</span>Local 2-player
        </div>
        {user && (
          <>
            <div className={`sidebar-item ${page==="online" || page==="online-game" ? "active" : ""}`}
              onClick={() => navigate("online")}>
              <span className="icon">🌐</span>Online Lobby
            </div>
            <div className={`sidebar-item ${page==="my-games" || page==="analysis" ? "active" : ""}`}
              onClick={() => navigate("my-games")}>
              <span className="icon">📜</span>My Games
            </div>
          </>
        )}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-label">Learning</div>
        <div className={`sidebar-item ${page==="quiz"?"active":""}`}
          onClick={() => navigate("quiz")}>
          <span className="icon">🎯</span>Take Quiz
          <span className="sidebar-badge">6 Qs</span>
        </div>
        <div className={`sidebar-item ${page==="theory"?"active":""}`}
          onClick={() => navigate("theory")}>
          <span className="icon">📚</span>Theory Notes
        </div>
      </div>
    </>
  );
}
