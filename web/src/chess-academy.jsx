// ── Chess Academy — root application component ────────────────────────────────
import { useEffect, useRef, useState } from "react";
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
import { CONSENT_KEY, googleConfig, readConsent, requestAd, trackPage } from "./utils/googleServices.js";

const GOOGLE = googleConfig(import.meta.env);
const PAGE_TITLES = {
  home: "Learn Chess: Openings, Strategy & Practice",
  games: "Play Chess vs Stockfish",
  openings: "Chess Opening Library",
  play: "Local Two-Player Chess",
  strategy: "Middlegame Strategy",
  theory: "Chess Theory",
  quiz: "Chess Knowledge Quiz",
};

const AD_SLOTS = {
  left: { slot: GOOGLE.leftSlot, className: "ad-rail ad-left", style: { display: "block", width: 160, height: 600 } },
  right: { slot: GOOGLE.rightSlot, className: "ad-rail ad-right", style: { display: "block", width: 160, height: 600 } },
  inline: { slot: GOOGLE.inlineSlot, className: "ad-inline", style: { display: "block" }, responsive: true },
};

function AdSlot({ position, allowed }) {
  const ref = useRef(null);
  const { slot, className, style, responsive } = AD_SLOTS[position];
  const enabled = import.meta.env.PROD && allowed && GOOGLE.adsClient && slot;
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || !window.IntersectionObserver) return;
    let active = true;
    let cleanup;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        cleanup = requestAd(GOOGLE, element, () => active);
      }
    });
    observer.observe(element);
    return () => { active = false; observer.disconnect(); cleanup?.(); };
  }, [enabled]);
  return (
    <aside className={className} aria-label={`${position} advertisement`}>
      <div className="ad-label">Advertisement</div>
      {enabled ? <ins ref={ref} className="adsbygoogle" style={style}
        data-ad-client={GOOGLE.adsClient} data-ad-slot={slot}
        data-ad-format={responsive ? "auto" : undefined}
        data-full-width-responsive={responsive ? "true" : undefined} /> :
        <div className="ad-placeholder">Advertising space</div>}
    </aside>
  );
}

export default function ChessAcademy() {
  const [page, setPage] = useState("home");
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [soundMuted, setSoundMuted] = useState(isMuted);
  const [consent, setConsent] = useState(readConsent);
  const [privacyOpen, setPrivacyOpen] = useState(() => !readConsent());
  const lastPage = useRef("");

  useEffect(() => {
    const title = `${selectedOpening?.name || PAGE_TITLES[page]} | Chess Academy`;
    document.title = title;
    const key = `${page}${selectedOpening ? `/${selectedOpening.id}` : ""}`;
    if (import.meta.env.PROD && consent?.analytics && lastPage.current !== key) {
      trackPage(GOOGLE, key, title);
      lastPage.current = key;
    }
  }, [page, selectedOpening, consent]);

  useEffect(() => {
    function syncConsent(event) {
      if (event.key !== CONSENT_KEY && event.key !== null) return;
      const next = readConsent() || { analytics: false, ads: false };
      if ((consent?.analytics && !next.analytics) || (consent?.ads && !next.ads)) {
        window.location.reload();
        return;
      }
      setConsent(next);
    }
    window.addEventListener("storage", syncConsent);
    return () => window.removeEventListener("storage", syncConsent);
  }, [consent]);

  function saveConsent(next) {
    let persisted = false;
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
      persisted = true;
    } catch { /* Keep the choice for this visit. */ }
    setPrivacyOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("privacy");
    if ((consent?.analytics && !next.analytics) || (consent?.ads && !next.ads)) {
      // A denied URL override prevents stale stored permission from being restored.
      if (!persisted) url.searchParams.set("privacy", "denied");
      // Reload to stop already-loaded third-party scripts after withdrawal.
      window.location.replace(url.href);
      return;
    }
    window.history.replaceState(null, "", url);
    setConsent(next);
  }

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
        <a className="skip-link" href="#main-content">Skip to content</a>
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

        <div className="site-layout">
          <AdSlot position="left" allowed={consent?.ads} />
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
          <main className="content" id="main-content" tabIndex={-1}>
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
          <AdSlot position="right" allowed={consent?.ads} />
        </div>
        <AdSlot position="inline" allowed={consent?.ads} />
        <footer className="site-footer">
          <span>Chess Academy — learn, practice, improve.</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPrivacyOpen(v => !v)}
            aria-expanded={privacyOpen} aria-controls="privacy-settings">Privacy &amp; cookie settings</button>
        </footer>
        {privacyOpen && <section className="privacy-panel" id="privacy-settings" aria-labelledby="privacy-title">
          <h2 id="privacy-title">Your privacy choices</h2>
          <p>Chess works without analytics or ads. With your permission, Google Analytics measures visited
            sections and Google AdSense displays advertising. These services may use cookies, device
            information and IP addresses. Your choice is saved on this device; change it here anytime.
            Withdrawing consent stops future requests but does not delete data already collected.</p>
          <p>Fonts are served by Google Fonts. Engine requests are sent to the external chess engine service.
            See <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google’s privacy policy</a>.</p>
          <div className="privacy-actions">
            <button className="btn btn-outline" onClick={() => saveConsent({ analytics: false, ads: false })}>Reject optional services</button>
            <button className="btn btn-outline" onClick={() => saveConsent({ analytics: true, ads: false })}>Allow analytics only</button>
            <button className="btn" onClick={() => saveConsent({ analytics: true, ads: true })}>Allow analytics &amp; ads</button>
          </div>
        </section>}
      </div>
    </>
  );
}
