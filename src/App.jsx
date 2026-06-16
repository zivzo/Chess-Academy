import { useState } from 'react';
import Header from './components/Layout/Header.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import OpeningsPage from './components/OpeningsPage.jsx';
import BoardViewer from './components/BoardViewer.jsx';
import StrategyPage from './components/StrategyPage.jsx';
import TheoryPage from './components/TheoryPage.jsx';
import QuizPage from './components/QuizPage.jsx';
import BotSelector from './components/PlayBot/BotSelector.jsx';
import GamePage from './components/PlayBot/GamePage.jsx';

const NAV = [
  { id:"home",     label:"🏠 Home" },
  { id:"openings", label:"📖 Openings" },
  { id:"strategy", label:"⚔️ Strategy" },
  { id:"theory",   label:"📚 Theory" },
  { id:"quiz",     label:"🎯 Quiz" },
  { id:"play",     label:"🤖 Play vs Bot" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [botGame, setBotGame] = useState(null); // { botLevel, playerColor }

  function navigate(p) {
    setPage(p);
    setSelectedOpening(null);
    if (p !== 'play') setBotGame(null);
  }

  function selectOpening(o) {
    setPage('openings');
    setSelectedOpening(o);
  }

  return (
    <div className="app">
      <Header page={page} onNavigate={navigate} NAV={NAV} />
      <div className="main">
        <Sidebar
          page={page}
          selectedOpening={selectedOpening}
          onNavigate={navigate}
          onSelectOpening={selectOpening}
        />
        <main className="content">
          {page === "home" && <Dashboard onNavigate={navigate} />}
          {page === "openings" && !selectedOpening && <OpeningsPage onSelect={setSelectedOpening} />}
          {page === "openings" && selectedOpening && (
            <BoardViewer opening={selectedOpening} onBack={() => setSelectedOpening(null)} />
          )}
          {page === "strategy" && <StrategyPage />}
          {page === "theory" && <TheoryPage />}
          {page === "quiz" && <QuizPage />}
          {page === "play" && !botGame && (
            <BotSelector onSelect={(bot, color) => setBotGame({ botLevel: bot, playerColor: color })} />
          )}
          {page === "play" && botGame && (
            <GamePage
              botLevel={botGame.botLevel}
              playerColor={botGame.playerColor}
              onBack={() => setBotGame(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
