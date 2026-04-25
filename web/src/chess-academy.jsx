import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIECES,
  START,
  OPENINGS,
  CONCEPTS,
  QUIZZES,
  createInitialBoard,
  getLegalMoves,
  applyLocalMove,
  generatePseudoLegalMoves,
  applyBoardMove,
  formatMove,
  createGameState,
  getLegalMovesWithRules,
  applyMoveWithRules,
  getGameStatus,
} from "./chess-core.js";
import {
  getStockfishMove,
  getStockfishAnalysis,
  DEFAULT_ENGINE_RATING,
  MIN_ENGINE_RATING,
  MAX_ENGINE_RATING,
} from "./stockfish-api.js";

// ── Palette & fonts injected via style tag ──────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cream: #F5F0E8;
      --ivory: #EDE8DC;
      --dark: #1A1612;
      --brown: #2E1F0F;
      --gold: #C8963E;
      --gold-light: #E5B96A;
      --green: #4A7C59;
      --green-light: #6AAB7E;
      --red: #A63D2F;
      --muted: #7A6E62;
      --border: #D4C9B0;
      --sq-light: #F0D9B5;
      --sq-dark: #B58863;
      --sq-hl: rgba(20,180,80,0.45);
      --sq-move: rgba(255,200,0,0.55);
    }

    body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--dark); }

    .app { min-height: 100vh; display: flex; flex-direction: column; }

    /* ── Header ── */
    .header {
      background: var(--brown);
      padding: 0 2rem;
      display: flex; align-items: center; gap: 1.5rem;
      border-bottom: 3px solid var(--gold);
      height: 64px;
      position: sticky; top: 0; z-index: 100;
    }
    .header-logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem; font-weight: 900;
      color: var(--gold);
      letter-spacing: -0.5px;
      white-space: nowrap;
    }
    .header-logo span { color: var(--cream); }
    .header-nav { display: flex; gap: 0.25rem; margin-left: auto; }
    .nav-btn {
      background: none; border: none; cursor: pointer;
      font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500;
      color: #C8B99A; padding: 0.45rem 0.9rem; border-radius: 6px;
      transition: all 0.18s; letter-spacing: 0.3px; white-space: nowrap;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.08); color: var(--cream); }
    .nav-btn.active { background: var(--gold); color: var(--brown); font-weight: 600; }

    /* ── Layout ── */
    .main { flex: 1; display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 64px); }

    /* ── Sidebar ── */
    .sidebar {
      background: var(--ivory);
      border-right: 1px solid var(--border);
      padding: 1.25rem 0;
      overflow-y: auto;
    }
    .sidebar-section { margin-bottom: 0.25rem; }
    .sidebar-label {
      font-size: 0.68rem; font-weight: 600; letter-spacing: 1.2px;
      text-transform: uppercase; color: var(--muted);
      padding: 0.5rem 1.25rem 0.3rem;
    }
    .sidebar-item {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.6rem 1.25rem; cursor: pointer;
      border-left: 3px solid transparent;
      transition: all 0.15s; font-size: 0.88rem; color: var(--brown);
      font-weight: 400;
    }
    .sidebar-item:hover { background: rgba(200,150,62,0.1); color: var(--dark); }
    .sidebar-item.active { border-left-color: var(--gold); background: rgba(200,150,62,0.12); font-weight: 600; color: var(--dark); }
    .sidebar-item .icon { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }
    .sidebar-badge {
      margin-left: auto; background: var(--green); color: white;
      font-size: 0.62rem; font-weight: 700; padding: 1px 6px; border-radius: 10px;
    }
    .sidebar-divider { height: 1px; background: var(--border); margin: 0.75rem 1.25rem; }

    /* ── Content area ── */
    .content { padding: 2rem; overflow-y: auto; background: var(--cream); }

    /* ── Cards ── */
    .card {
      background: white; border: 1px solid var(--border);
      border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 1.25rem;
    }
    .card-clickable {
      width: 100%;
      text-align: left;
      cursor: pointer;
      font: inherit;
    }
    .card-title {
      font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700;
      color: var(--brown); margin-bottom: 0.75rem;
    }
    .card-body { font-size: 0.9rem; color: #4A3F35; line-height: 1.7; }

    /* ── Page titles ── */
    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 2rem; font-weight: 900; color: var(--brown);
      margin-bottom: 0.35rem;
    }
    .page-subtitle { font-size: 0.92rem; color: var(--muted); margin-bottom: 1.75rem; }

    /* ── Progress bar ── */
    .progress-wrap { background: var(--border); border-radius: 99px; height: 6px; margin-top: 0.5rem; }
    .progress-fill { height: 6px; border-radius: 99px; background: var(--green); transition: width 0.4s; }

    /* ── Tags ── */
    .tag {
      display: inline-block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.4px;
      padding: 2px 8px; border-radius: 6px; margin-right: 4px; margin-bottom: 4px;
    }
    .tag-open { background: #E8F4EC; color: #2E6B42; }
    .tag-mid { background: #FFF4E0; color: #8A5A00; }
    .tag-end { background: #FDE8E8; color: #8A1F1F; }
    .tag-diff-1 { background: #E8F4EC; color: #2E6B42; }
    .tag-diff-2 { background: #FFF4E0; color: #8A5A00; }
    .tag-diff-3 { background: #FDE8E8; color: #8A1F1F; }

    /* ── Opening grid ── */
    .opening-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .opening-card {
      background: white; border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; cursor: pointer;
      transition: all 0.2s; position: relative; overflow: hidden;
    }
    .opening-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    }
    .opening-card.color-green::before { background: var(--green); }
    .opening-card.color-gold::before { background: var(--gold); }
    .opening-card.color-red::before { background: var(--red); }
    .opening-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: var(--gold); }
    .opening-card h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: var(--brown); margin-bottom: 0.4rem; }
    .opening-card p { font-size: 0.82rem; color: var(--muted); line-height: 1.55; margin-bottom: 0.75rem; }
    .opening-card .moves { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--gold); background: #FFF8EE; padding: 4px 8px; border-radius: 6px; display: inline-block; }

    /* ── Chess board ── */
    .board-wrap { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }
    .board-outer { flex-shrink: 0; }
    .board-labels-row { display: flex; align-items: center; }
    .board-files { display: flex; padding-left: 22px; }
    .board-file-label { width: 72px; text-align: center; font-size: 0.7rem; color: var(--muted); font-weight: 500; }
    .board-rank-label { width: 22px; text-align: center; font-size: 0.7rem; color: var(--muted); font-weight: 500; line-height: 72px; }
    .board {
      display: grid; grid-template-columns: repeat(8, 72px); grid-template-rows: repeat(8, 72px);
      border: 3px solid var(--brown); border-radius: 6px; overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12);
    }
    .sq {
      width: 72px; height: 72px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.6rem; cursor: default; position: relative;
      transition: filter 0.1s;
      user-select: none;
    }
    .sq.light { background: var(--sq-light); }
    .sq.dark  { background: var(--sq-dark); }
    .sq.highlight { background: var(--sq-hl) !important; }
    .sq.moved { background: var(--sq-move) !important; }
    .sq.selected { box-shadow: inset 0 0 0 4px rgba(56, 100, 210, 0.85); }
    .sq.in-check { background: rgba(200, 30, 30, 0.55) !important; }
    .sq.legal-empty::after {
      content: "";
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.18);
      position: absolute;
      pointer-events: none;
    }
    .sq.legal-capture::after {
      content: "";
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      border: 6px solid rgba(0, 0, 0, 0.2);
      background: transparent;
      pointer-events: none;
    }
    .sq.dragging { opacity: 0.35; }
    .sq.piece-grabbable { cursor: grab; }
    .sq.piece-grabbable:active { cursor: grabbing; }
    .sq.selectable { cursor: pointer; }
    .sq:hover { filter: brightness(1.06); }

    /* ── Move list ── */
    .move-list-wrap { flex: 1; min-width: 200px; }
    .move-list-title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: var(--muted); margin-bottom: 0.6rem; }
    .move-list { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 1rem; }
    .move-chip {
      font-family: 'DM Mono', monospace; font-size: 0.78rem;
      padding: 3px 8px; border-radius: 5px; cursor: pointer;
      border: 1px solid var(--border); background: var(--ivory); color: var(--brown);
      transition: all 0.15s;
    }
    .move-chip.active { background: var(--brown); color: var(--gold); border-color: var(--brown); }
    .move-chip:hover { border-color: var(--gold); }
    .move-number { font-size: 0.72rem; color: var(--muted); align-self: center; font-family: 'DM Mono', monospace; }

    /* ── Nav arrows ── */
    .board-nav { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .nav-arrow {
      background: var(--brown); color: var(--cream); border: none; cursor: pointer;
      width: 36px; height: 36px; border-radius: 8px; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .nav-arrow:hover { background: var(--gold); color: var(--brown); }
    .nav-arrow:disabled { background: var(--border); color: var(--muted); cursor: not-allowed; }

    /* ── Annotation box ── */
    .annotation {
      background: #FFFBF2; border-left: 3px solid var(--gold);
      border-radius: 0 8px 8px 0; padding: 0.85rem 1rem;
      font-size: 0.88rem; color: #4A3F35; line-height: 1.65;
      margin-top: 0.75rem;
    }
    .annotation strong { color: var(--brown); }

    .game-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }
    .turn-pill {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.35rem 0.8rem; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.3px;
      background: #EEE8FF; color: #4A3080;
    }
    .tab-row { display: flex; gap: 0.4rem; margin-bottom: 1rem; }
    .mini-tab {
      border: 1px solid var(--border); background: white; color: var(--brown);
      border-radius: 999px; font-size: 0.78rem; font-weight: 600;
      padding: 0.35rem 0.8rem; cursor: pointer; transition: all 0.15s;
    }
    .mini-tab.active { background: var(--brown); color: var(--gold); border-color: var(--brown); }
    .engine-rec {
      background: #FFFBF2; border: 1px solid #EAD9BB; border-radius: 10px;
      padding: 0.9rem 1rem; margin-bottom: 0.85rem;
    }
    .engine-rec h4 { font-size: 0.85rem; color: var(--brown); margin-bottom: 0.35rem; }
    .engine-rec p { font-size: 0.82rem; color: #4A3F35; line-height: 1.6; }
    .engine-source { font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem; }

    /* ── Engine strength selector ── */
    .strength-selector {
      background: white; border: 1px solid var(--border); border-radius: 10px;
      padding: 0.9rem 1rem; margin-bottom: 0.85rem;
    }
    .strength-selector label {
      display: block; font-size: 0.82rem; font-weight: 500;
      color: var(--brown); margin-bottom: 0.5rem;
    }
    .strength-selector input[type="range"] {
      width: 100%; accent-color: var(--gold); cursor: pointer;
    }
    .strength-selector input[type="range"]:disabled {
      cursor: not-allowed; opacity: 0.55;
    }
    .strength-locked-hint {
      font-size: 0.7rem; color: var(--muted); margin-top: 0.4rem; font-style: italic;
    }
    .strength-labels {
      display: flex; justify-content: space-between;
      font-size: 0.7rem; color: var(--muted); margin-top: 0.25rem;
    }
    .strength-badge {
      display: inline-block; font-size: 0.72rem; font-weight: 600;
      padding: 0.15rem 0.5rem; border-radius: 999px;
      margin-left: 0.4rem;
    }
    .strength-badge.beginner   { background: #E8F5E9; color: #2E7D32; }
    .strength-badge.casual     { background: #E3F2FD; color: #1565C0; }
    .strength-badge.club       { background: #FFF3E0; color: #E65100; }
    .strength-badge.advanced   { background: #F3E5F5; color: #6A1B9A; }
    .strength-badge.master     { background: #FCE4EC; color: #AD1457; }

    /* ── Concept pills ── */
    .concept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.85rem; }
    .concept-card {
      background: white; border: 1px solid var(--border); border-radius: 10px;
      padding: 1.1rem; cursor: pointer; transition: all 0.18s;
    }
    .concept-card:hover { border-color: var(--gold); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .concept-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .concept-card h4 { font-size: 0.92rem; font-weight: 600; color: var(--brown); margin-bottom: 0.3rem; }
    .concept-card p { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }

    /* ── Quiz ── */
    .quiz-option {
      display: block; width: 100%; text-align: left;
      background: white; border: 1.5px solid var(--border); border-radius: 8px;
      padding: 0.75rem 1rem; margin-bottom: 0.6rem; cursor: pointer;
      font-size: 0.88rem; font-family: 'DM Sans', sans-serif; color: var(--brown);
      transition: all 0.15s;
    }
    .quiz-option:hover { border-color: var(--gold); background: #FFFBF2; }
    .quiz-option.correct { border-color: var(--green); background: #F0F9F4; color: var(--green); font-weight: 600; }
    .quiz-option.wrong { border-color: var(--red); background: #FDF2F1; color: var(--red); }
    .quiz-feedback { margin-top: 1rem; padding: 0.85rem; border-radius: 8px; font-size: 0.87rem; line-height: 1.6; }
    .quiz-feedback.correct { background: #F0F9F4; color: #1E5A35; border: 1px solid #A8D5B8; }
    .quiz-feedback.wrong { background: #FDF2F1; color: #7A1F1F; border: 1px solid #F0B0A8; }

    /* ── Quiz board (smaller) ── */
    .quiz-board-wrap { display: flex; justify-content: center; margin-bottom: 1.25rem; }
    .quiz-board-outer { flex-shrink: 0; }
    .quiz-board-files { display: flex; padding-left: 18px; }
    .quiz-board-file-label { width: 40px; text-align: center; font-size: 0.6rem; color: var(--muted); font-weight: 500; }
    .quiz-board-rank-label { width: 18px; text-align: center; font-size: 0.6rem; color: var(--muted); font-weight: 500; line-height: 40px; }
    .quiz-board {
      display: grid; grid-template-columns: repeat(8, 40px); grid-template-rows: repeat(8, 40px);
      border: 2px solid var(--brown); border-radius: 4px; overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .quiz-board .sq {
      width: 40px; height: 40px; font-size: 1.5rem; cursor: default;
    }

    /* ── Dashboard stats ── */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.25rem; }
    .stat-value { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--brown); }
    .stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }

    /* ── Btn ── */
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: var(--brown); color: var(--cream);
      border: none; border-radius: 8px; cursor: pointer;
      padding: 0.6rem 1.2rem; font-size: 0.88rem; font-weight: 600;
      font-family: 'DM Sans', sans-serif; transition: all 0.18s;
    }
    .btn:hover { background: var(--gold); color: var(--brown); }
    .btn-outline { background: transparent; border: 1.5px solid var(--brown); color: var(--brown); }
    .btn-outline:hover { background: var(--brown); color: var(--cream); }
    .btn-sm { padding: 0.4rem 0.9rem; font-size: 0.8rem; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #FFF8EE;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.25rem 0.7rem;
      font-size: 0.78rem;
      color: var(--brown);
      font-weight: 600;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);
// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  return (
    <div className="fade-in">
      <div className="page-title">Good morning, Student ♟</div>
      <div className="page-subtitle">Your chess journey continues — pick up where you left off.</div>
      <div className="stat-grid">
        {[
          { v:"4", l:"Openings Studied" },
          { v:"12", l:"Concepts Learned" },
          { v:"6", l:"Quiz Questions" },
          { v:"800", l:"Starting Rating" },
        ].map(s => (
          <div className="stat-card" key={s.l}>
            <div className="stat-value">{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.25rem"}}>
        <div className="card" style={{cursor:"pointer"}} onClick={() => onNavigate("openings")}>
          <div className="card-title">📖 Opening Library</div>
          <div className="card-body">Study 4 core openings with interactive move-by-move boards, annotations, and key ideas.</div>
          <div style={{marginTop:"1rem"}}><span className="btn btn-sm">Explore Openings →</span></div>
        </div>
        <div className="card" style={{cursor:"pointer"}} onClick={() => onNavigate("strategy")}>
          <div className="card-title">⚔️ Middlegame Strategy</div>
          <div className="card-body">Master 12 essential middlegame concepts that decide most games at the 800–1400 level.</div>
          <div style={{marginTop:"1rem"}}><span className="btn btn-sm">Study Strategy →</span></div>
        </div>
      </div>

      <div className="card" style={{cursor:"pointer"}} onClick={() => onNavigate("quiz")}>
        <div className="card-title">🎯 Knowledge Quiz</div>
        <div className="card-body">Test your understanding of openings and strategy with 6 carefully crafted questions. Get instant explanations for each answer.</div>
        <div style={{marginTop:"1rem"}}><span className="btn btn-sm">Take Quiz →</span></div>
      </div>

      <button className="card card-clickable" onClick={() => onNavigate("play")}>
        <div className="card-title">♜ Local 2-Player Game</div>
        <div className="card-body">Play a local over-the-board style game on the same machine. Alternate turns, make legal moves, and reset anytime.</div>
        <div style={{marginTop:"1rem"}}><span className="tag" style={{background:"#2E1F0F",color:"#F5F0E8"}}>Start Local Game →</span></div>
      </button>

      <div className="card">
        <div className="card-title">📚 Study Roadmap for 800–1400</div>
        <div className="card-body">
          <strong>Phase 1 (Week 1–2):</strong> Learn 1 opening for White (London or Italian) and 1 for Black (Caro-Kann). Focus on understanding the ideas, not memorizing moves.<br/><br/>
          <strong>Phase 2 (Week 3–4):</strong> Study 6 middlegame concepts. After each game, ask: "which concept did I miss?"<br/><br/>
          <strong>Phase 3 (Ongoing):</strong> 15 min tactics daily on Lichess + analyze your own games with an engine. This alone will push you toward 1400.
        </div>
      </div>
    </div>
  );
}

// ── Openings list ────────────────────────────────────────────────────────────
function OpeningsPage({ onSelect }) {
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

// ── Interactive board viewer ─────────────────────────────────────────────────
function BoardViewer({ opening, onBack }) {
  const [step, setStep] = useState(0);
  const [variantId, setVariantId] = useState(null);
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

  return (
    <div className="fade-in">
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
        <div className="board-outer">
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
            <button className="nav-arrow" disabled={step===0} onClick={() => setStep(0)}>⟪</button>
            <button className="nav-arrow" disabled={step===0} onClick={() => setStep(s => s-1)}>‹</button>
            <button className="nav-arrow" disabled={step===line.positions.length-1} onClick={() => setStep(s => s+1)}>›</button>
            <button className="nav-arrow" disabled={step===line.positions.length-1} onClick={() => setStep(line.positions.length-1)}>⟫</button>
          </div>
        </div>

        <div className="move-list-wrap">
          <div className="move-list-title">Moves</div>
          <div className="move-list">
            <div className="move-chip active" onClick={() => setStep(0)} style={step===0?{}:{opacity:0.5}}>Start</div>
            {line.moves.map((m, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:"3px"}}>
                {i % 2 === 0 && <span className="move-number">{Math.floor(i/2)+1}.</span>}
                <div className={`move-chip ${step===i+1?"active":""}`} onClick={() => setStep(i+1)}>{m}</div>
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

function LocalGamePage() {
  const [board, setBoard] = useState(() => createInitialBoard());
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [status, setStatus] = useState("playing"); // "playing" | "check" | "checkmate" | "stalemate"
  const [lastMove, setLastMove] = useState(null);
  const [gameState, setGameState] = useState(() => createGameState());
  const [historyStack, setHistoryStack] = useState([]);
  const [draggingSquare, setDraggingSquare] = useState(null);
  const dragValidDrop = useRef(false);

  function colorName(color) {
    return color === "w" ? "White" : "Black";
  }

  function reset() {
    setBoard(createInitialBoard());
    setTurn("w");
    setSelected(null);
    setLegalMoves([]);
    setStatus("playing");
    setLastMove(null);
    setGameState(createGameState());
    setHistoryStack([]);
    setDraggingSquare(null);
  }

  function undoMove() {
    setHistoryStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const prev = prevStack[prevStack.length - 1];
      setBoard(prev.board);
      setTurn(prev.turn);
      setGameState(prev.gameState);
      setStatus(prev.status);
      setLastMove(prev.lastMove);
      setSelected(null);
      setLegalMoves([]);
      return prevStack.slice(0, -1);
    });
  }

  function onSquareClick(r, c) {
    if (status === "checkmate" || status === "stalemate") return;

    const piece = board[r][c];
    const isTurnPiece = piece && piece[0] === turn;
    const selectedMove = legalMoves.find((m) => m.tr === r && m.tc === c);

    if (selected && selectedMove) {
      const snapshot = { board, turn, gameState, status, lastMove };
      const { board: nextBoard, gameState: nextGameState } =
        applyMoveWithRules(board, selectedMove, gameState);
      const nextTurn = turn === "w" ? "b" : "w";
      const nextStatus = getGameStatus(nextBoard, nextTurn, nextGameState);

      setHistoryStack((prev) => [...prev, snapshot]);
      setBoard(nextBoard);
      setGameState(nextGameState);
      setLastMove([{ r: selectedMove.r, c: selectedMove.c }, { r: selectedMove.tr, c: selectedMove.tc }]);
      setSelected(null);
      setLegalMoves([]);
      setTurn(nextTurn);
      setStatus(nextStatus);
      return;
    }

    if (isTurnPiece) {
      setSelected({ r, c });
      setLegalMoves(getLegalMovesWithRules(board, r, c, gameState));
      return;
    }

    setSelected(null);
    setLegalMoves([]);
  }

  function onDragStart(e, r, c) {
    if (status === "checkmate" || status === "stalemate") { e.preventDefault(); return; }
    const piece = board[r][c];
    if (!piece || piece[0] !== turn) { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText = "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 36, 36);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ghost.remove(), 0);
    setDraggingSquare({ r, c });
    setSelected({ r, c });
    setLegalMoves(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragOver(e, r, c) {
    const isLegalTarget = legalMoves.some((m) => m.tr === r && m.tc === c);
    if (isLegalTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDrop(e, r, c) {
    e.preventDefault();
    dragValidDrop.current = true;
    onSquareClick(r, c);
    setDraggingSquare(null);
  }

  function onDragEnd() {
    if (!dragValidDrop.current) {
      setSelected(null);
      setLegalMoves([]);
    }
    dragValidDrop.current = false;
    setDraggingSquare(null);
  }

  const isGameOver = status === "checkmate" || status === "stalemate";
  const winner = status === "checkmate" ? (turn === "w" ? "b" : "w") : null;
  let turnLabel;
  if (status === "checkmate") {
    turnLabel = `Checkmate! ${colorName(winner)} wins`;
  } else if (status === "stalemate") {
    turnLabel = "Stalemate — Draw";
  } else if (status === "check") {
    turnLabel = `${colorName(turn)} is in check`;
  } else {
    turnLabel = `${colorName(turn)} to move`;
  }

  const kingInCheckPos = (() => {
    if (status !== "check" && status !== "checkmate") return null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === `${turn}K`) return [r, c];
    return null;
  })();

  return (
    <div className="fade-in">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <div>
          <div className="page-title" style={{marginBottom:0}}>Local Game</div>
          <div className="page-subtitle" style={{marginBottom:0}}>Two humans on one machine.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span className="status-pill">{isGameOver ? "🏁" : status === "check" ? "⚠️" : "⏱"} {turnLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={undoMove} disabled={historyStack.length === 0}>↶ Undo</button>
          <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="board-wrap">
        <div className="board-outer">
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map((f) => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map((r) => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected?.r === ri && selected?.c === ci;
                  const legalMove = legalMoves.find((m) => m.tr === ri && m.tc === ci);
                  const isLegalEmpty = Boolean(legalMove && !board[ri][ci]);
                  const isLegalCapture = Boolean(legalMove && board[ri][ci]);
                  const isMoved = Boolean(lastMove?.some((sq) => sq.r === ri && sq.c === ci));
                  const isPieceOfCurrentTurn = Boolean(piece && piece[0] === turn && !isGameOver);
                  const isSelectable = !isGameOver && (isPieceOfCurrentTurn || Boolean(legalMove) || isSelected);
                  const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
                  const isInCheck = kingInCheckPos && kingInCheckPos[0] === ri && kingInCheckPos[1] === ci;
                  const className = [
                    "sq",
                    isLight ? "light" : "dark",
                    isMoved && "moved",
                    isSelected && "selected",
                    isLegalEmpty && "legal-empty",
                    isLegalCapture && "legal-capture",
                    isSelectable && "selectable",
                    isPieceOfCurrentTurn && "piece-grabbable",
                    isDragging && "dragging",
                    isInCheck && "in-check",
                  ].filter(Boolean).join(" ");
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={className}
                      draggable={isPieceOfCurrentTurn}
                      onClick={() => onSquareClick(ri, ci)}
                      onDragStart={(e) => onDragStart(e, ri, ci)}
                      onDragOver={(e) => onDragOver(e, ri, ci)}
                      onDrop={(e) => onDrop(e, ri, ci)}
                      onDragEnd={onDragEnd}
                    >
                      {piece ? PIECES[piece] : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="move-list-wrap">
          <div className="card">
            <div className="card-title" style={{fontSize:"1rem"}}>How to play</div>
            <div className="card-body">
              Click a piece to select it, then click a highlighted square to move — or simply drag a piece directly to its destination.
              <br /><br />
              Includes all standard rules: castling, en passant, pawn promotion, check, checkmate, and stalemate detection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable label for a given engine rating.
 * @param {number} rating - Elo rating (200–3000).
 * @returns {{ label: string, css: string }}
 */
function strengthLabel(rating) {
  if (rating < 600)  return { label: "Beginner",   css: "beginner" };
  if (rating < 1000) return { label: "Casual",     css: "casual" };
  if (rating < 1600) return { label: "Club",       css: "club" };
  if (rating < 2200) return { label: "Advanced",   css: "advanced" };
  return                     { label: "Master",     css: "master" };
}

/**
 * Formats a numeric evaluation into a display string like "+1.5" or "M3".
 * @param {number|null} evaluation - Evaluation in pawns.
 * @param {number|null} mate       - Mate-in-N (null when no forced mate).
 * @returns {string}
 */
function formatEval(evaluation, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  }
  if (evaluation === null || evaluation === undefined) return "0.0";
  const sign = evaluation > 0 ? "+" : evaluation < 0 ? "" : "±";
  return `${sign}${evaluation.toFixed(1)}`;
}

// ── Play vs Stockfish + analysis ─────────────────────────────────────────────
function GamePage() {
  // Board & game state
  const [board, setBoard]               = useState(() => START.map(r => [...r]));
  const [turn, setTurn]                 = useState("w");
  const [selected, setSelected]         = useState(null);
  const [movesFromSquare, setMovesFromSquare] = useState([]);
  const [history, setHistory]           = useState([]);

  // UI state
  const [activeTab, setActiveTab]       = useState("play");
  const [engineRating, setEngineRating] = useState(DEFAULT_ENGINE_RATING);

  // Rules engine state
  const [gameState, setGameState] = useState(() => createGameState());
  const [status, setStatus] = useState("playing"); // "playing" | "check" | "checkmate" | "stalemate"

  // Snapshots for undo (each snapshot is the state *before* a move).
  const [historyStack, setHistoryStack] = useState([]);

  // Analysis state (async — null means "loading or not yet fetched")
  const [analysis, setAnalysis]         = useState(null);

  // Drag state
  const [draggingSquare, setDraggingSquare] = useState(null);
  const dragValidDrop = useRef(false);

  // Engine is thinking whenever it is Black's turn.
  const engineThinking = turn === "b";

  // Ref to track the latest request and avoid stale async responses.
  const moveRequestId = useRef(0);

  // ── Engine plays as Black (async) ──────────────────────────────────────────
  useEffect(() => {
    if (turn !== "b") return;
    if (status === "checkmate" || status === "stalemate") return;

    let cancelled = false;
    const requestId = ++moveRequestId.current;

    getStockfishMove(board, "b", engineRating).then((move) => {
      // Ignore if a newer request was started or the effect was cleaned up.
      if (cancelled || requestId !== moveRequestId.current) return;

      if (move) {
        const { board: nextBoard, gameState: nextGS } =
          applyMoveWithRules(board, move, gameState);
        const nextStatus = getGameStatus(nextBoard, "w", nextGS);
        setBoard(nextBoard);
        setGameState(nextGS);
        setHistory(prev => [...prev, `Black: ${formatMove(move)}`]);
        setStatus(nextStatus);
      }
      setTurn("w");
    });

    return () => { cancelled = true; };
  }, [turn, board, engineRating, gameState, status]);

  // ── Fetch analysis whenever the position changes ───────────────────────────
  useEffect(() => {
    if (activeTab !== "analysis") return;

    let cancelled = false;

    getStockfishAnalysis(board, turn).then((result) => {
      if (!cancelled) {
        setAnalysis(result);
      }
    });

    return () => { cancelled = true; };
  }, [board, turn, activeTab]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    moveRequestId.current++;          // Cancel any in-flight API call.
    setBoard(START.map(r => [...r]));
    setTurn("w");
    setSelected(null);
    setMovesFromSquare([]);
    setHistory([]);
    setAnalysis(null);
    setGameState(createGameState());
    setStatus("playing");
    setHistoryStack([]);
  }, []);

  // ── Undo ───────────────────────────────────────────────────────────────────
  // Step back to the most recent White-to-move position so the human can
  // replay. Snapshots are only pushed before the human's move (never before
  // the engine's reply), so popping one always lands on a White-to-move state
  // — automatically rolling back the engine's reply along with it.
  const undoMove = useCallback(() => {
    setHistoryStack(prevStack => {
      if (prevStack.length === 0) return prevStack;
      const stack = prevStack.slice();
      const snap = stack.pop();
      moveRequestId.current++;        // Cancel any in-flight engine API call.

      setBoard(snap.board);
      setTurn(snap.turn);
      setGameState(snap.gameState);
      setStatus(snap.status);
      setHistory(snap.history);
      setSelected(null);
      setMovesFromSquare([]);
      setAnalysis(null);
      return stack;
    });
  }, []);

  function colorName(color) {
    return color === "w" ? "White" : "Black";
  }

  // ── Square click handler ───────────────────────────────────────────────────
  function onSquareClick(r, c) {
    if (turn !== "w" || engineThinking) return;
    if (status === "checkmate" || status === "stalemate") return;

    const chosenMove = movesFromSquare.find(m => m.tr === r && m.tc === c);
    if (selected && chosenMove) {
      const snapshot = { board, turn, gameState, status, history };
      const { board: nextBoard, gameState: nextGameState } =
        applyMoveWithRules(board, chosenMove, gameState);
      const nextStatus = getGameStatus(nextBoard, "b", nextGameState);

      setHistoryStack(prev => [...prev, snapshot]);
      setBoard(nextBoard);
      setGameState(nextGameState);
      setHistory(prev => [...prev, `White: ${formatMove(chosenMove)}`]);
      setTurn("b");
      setStatus(nextStatus);
      setSelected(null);
      setMovesFromSquare([]);
      return;
    }

    const piece = board[r][c];
    if (!piece || piece[0] !== "w") {
      setSelected(null);
      setMovesFromSquare([]);
      return;
    }

    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragStart(e, r, c) {
    if (turn !== "w" || engineThinking || status === "checkmate" || status === "stalemate") {
      e.preventDefault(); return;
    }
    const piece = board[r][c];
    if (!piece || piece[0] !== "w") { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText = "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 36, 36);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ghost.remove(), 0);
    setDraggingSquare([r, c]);
    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragOver(e, r, c) {
    const isLegalTarget = movesFromSquare.some((m) => m.tr === r && m.tc === c);
    if (isLegalTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDrop(e, r, c) {
    e.preventDefault();
    dragValidDrop.current = true;
    onSquareClick(r, c);
    setDraggingSquare(null);
  }

  function onDragEnd() {
    if (!dragValidDrop.current) {
      setSelected(null);
      setMovesFromSquare([]);
    }
    dragValidDrop.current = false;
    setDraggingSquare(null);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isGameOver = status === "checkmate" || status === "stalemate";
  // Lock the engine strength as soon as a move has been played so changing it
  // mid-game can't interfere with the engine's in-flight calculation. It
  // becomes editable again after `resetGame` clears the history.
  const isStrengthLocked = history.length > 0 && !isGameOver;
  const moveDests = new Set(movesFromSquare.map(m => `${m.tr}-${m.tc}`));
  const { label: ratingLabel, css: ratingCss } = strengthLabel(engineRating);
  const evalText = analysis ? formatEval(analysis.evaluation, analysis.mate) : "0.0";

  const canInteract = turn === "w" && !engineThinking && !isGameOver;

  const kingInCheckPos = (() => {
    if (status !== "check" && status !== "checkmate") return null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === `${turn}K`) return [r, c];
    return null;
  })();

  let turnLabel;
  if (status === "checkmate") {
    const winner = turn === "w" ? "b" : "w";
    turnLabel = `Checkmate! ${colorName(winner)} wins`;
  } else if (status === "stalemate") {
    turnLabel = "Stalemate — Draw";
  } else if (engineThinking) {
    turnLabel = "Stockfish thinking…";
  } else if (status === "check") {
    turnLabel = `${colorName(turn)} is in check`;
  } else {
    turnLabel = `${colorName(turn)} to move`;
  }

  return (
    <div className="fade-in">
      <div className="page-title">Play vs Stockfish</div>
      <div className="page-subtitle">
        Play as White against the Stockfish engine. Adjust strength and switch to Analysis for recommendations.
      </div>

      <div className="tab-row">
        <button className={`mini-tab ${activeTab === "play" ? "active" : ""}`} onClick={() => setActiveTab("play")}>♟ Game</button>
        <button className={`mini-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>🔍 Analysis</button>
      </div>

      {/* ── Engine strength selector ── */}
      {/* Strength is locked once the game has started so changing it mid-game
          cannot disturb the engine's in-flight move calculation. It unlocks on Reset. */}
      <div className="strength-selector">
        <label>
          Engine Strength: <strong>{engineRating}</strong> Elo
          <span className={`strength-badge ${ratingCss}`}>{ratingLabel}</span>
        </label>
        <input
          type="range"
          min={MIN_ENGINE_RATING}
          max={MAX_ENGINE_RATING}
          step={100}
          value={engineRating}
          disabled={isStrengthLocked}
          onChange={(e) => setEngineRating(Number(e.target.value))}
        />
        <div className="strength-labels">
          <span>Beginner ({MIN_ENGINE_RATING})</span>
          <span>Master ({MAX_ENGINE_RATING})</span>
        </div>
        {isStrengthLocked && (
          <div className="strength-locked-hint">
            🔒 Engine strength is locked during the game. Reset to change it.
          </div>
        )}
      </div>

      <div className="game-controls">
        <span className="turn-pill">{isGameOver ? "🏁" : status === "check" ? "⚠️" : "⏱"} {turnLabel}</span>
        <button
          className="btn btn-sm btn-outline"
          onClick={undoMove}
          disabled={historyStack.length === 0}
        >↶ Undo</button>
        <button className="btn btn-sm btn-outline" onClick={resetGame}>Reset Game</button>
      </div>

      <div className="board-wrap">
        <div className="board-outer">
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map(f => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map(r => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected && selected[0] === ri && selected[1] === ci;
                  const isLegalEmpty = moveDests.has(`${ri}-${ci}`) && !board[ri][ci];
                  const isLegalCapture = moveDests.has(`${ri}-${ci}`) && Boolean(board[ri][ci]);
                  const isWhitePiece = Boolean(piece && piece[0] === "w");
                  const isDragging = draggingSquare && draggingSquare[0] === ri && draggingSquare[1] === ci;
                  const isInCheck = kingInCheckPos && kingInCheckPos[0] === ri && kingInCheckPos[1] === ci;
                  const className = [
                    "sq",
                    isLight ? "light" : "dark",
                    isSelected && "selected",
                    isLegalEmpty && "legal-empty",
                    isLegalCapture && "legal-capture",
                    canInteract && isWhitePiece && "piece-grabbable",
                    isDragging && "dragging",
                    isInCheck && "in-check",
                  ].filter(Boolean).join(" ");
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={className}
                      draggable={canInteract && isWhitePiece}
                      onClick={() => onSquareClick(ri, ci)}
                      onDragStart={(e) => onDragStart(e, ri, ci)}
                      onDragOver={(e) => onDragOver(e, ri, ci)}
                      onDrop={(e) => onDrop(e, ri, ci)}
                      onDragEnd={onDragEnd}
                    >
                      {piece ? PIECES[piece] : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="move-list-wrap">
          {activeTab === "analysis" && (
            <>
              <div className="engine-rec">
                <h4>Stockfish Recommendation</h4>
                {!analysis ? (
                  <p>Analyzing position…</p>
                ) : (
                  <p>
                    {analysis?.move
                      ? `${turn === "w" ? "White" : "Black"} best move: ${formatMove(analysis.move)}`
                      : "No legal moves available from this position."}
                    <br />
                    Evaluation (White perspective): <strong>{evalText}</strong>
                  </p>
                )}
                {analysis?.source && (
                  <div className="engine-source">
                    Source: {analysis.source === "stockfish" ? "Stockfish API" : "Local engine (API unavailable)"}
                  </div>
                )}
              </div>
              <div className="card" style={{padding:"1rem"}}>
                <div className="card-title" style={{fontSize:"0.92rem"}}>How to use this tab</div>
                <div className="card-body">
                  After each move, check the suggested move and compare it to what you played.
                  If they differ, ask what tactical or positional idea the engine saw first.
                </div>
              </div>
            </>
          )}

          <div className="move-list-title">Game Moves</div>
          <div className="move-list">
            {history.length === 0 && <span className="move-number">No moves yet</span>}
            {history.map((entry, i) => (
              <div key={i} className="move-chip">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Strategy page ────────────────────────────────────────────────────────────
function StrategyPage() {
  const [active, setActive] = useState(null);
  return (
    <div className="fade-in">
      <div className="page-title">Middlegame Strategy</div>
      <div className="page-subtitle">12 essential concepts. Click any to read a detailed explanation.</div>
      <div className="concept-grid">
        {CONCEPTS.map((c,i) => (
          <div key={i} className="concept-card" onClick={() => setActive(active===i?null:i)}>
            <div className="concept-icon">{c.icon}</div>
            <h4>{c.title}</h4>
            <p style={{display:active===i?"none":"block"}}>{c.desc.slice(0,60)}…</p>
            {active===i && (
              <p style={{color:"#4A3F35",fontSize:"0.85rem",lineHeight:"1.65"}}>{c.desc}</p>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:"1.5rem"}}>
        <div className="card-title">🏆 How to Apply These Concepts</div>
        <div className="card-body">
          After each of your games, pick one concept from this list and ask yourself: <strong>"Did this concept appear in my game? Did I handle it correctly?"</strong><br/><br/>
          Over time, you'll start spotting these patterns at the board in real time — that's when your rating jumps.
        </div>
      </div>
    </div>
  );
}

// ── Quiz page ────────────────────────────────────────────────────────────────
function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZZES[current];

  function choose(i) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore(s => s+1);
  }

  function next() {
    if (current < QUIZZES.length - 1) {
      setCurrent(c => c+1);
      setSelected(null);
    } else {
      setDone(true);
    }
  }

  function restart() { setCurrent(0); setSelected(null); setScore(0); setDone(false); }

  if (done) return (
    <div className="fade-in">
      <div className="page-title">Quiz Complete! 🎉</div>
      <div className="card" style={{textAlign:"center",padding:"2.5rem"}}>
        <div style={{fontSize:"4rem",fontFamily:"'Playfair Display',serif",fontWeight:900,color:"var(--brown)"}}>{score}/{QUIZZES.length}</div>
        <div style={{fontSize:"1rem",color:"var(--muted)",marginTop:"0.5rem",marginBottom:"1.5rem"}}>
          {score >= 5 ? "Excellent! You really know your theory." : score >= 3 ? "Good effort! Review the explanations and try again." : "Keep studying — review the openings and concepts, then come back!"}
        </div>
        <button className="btn" onClick={restart}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-title">Knowledge Quiz</div>
      <div className="page-subtitle">Question {current+1} of {QUIZZES.length} · Score: {score}</div>
      <div style={{marginBottom:"0.5rem"}}>
        <div className="progress-wrap"><div className="progress-fill" style={{width:`${((current)/QUIZZES.length)*100}%`}}/></div>
      </div>
      <div className="card">
        {q.board && (
          <div className="quiz-board-wrap">
            <div className="quiz-board-outer">
              <div className="quiz-board-files">
                {["a","b","c","d","e","f","g","h"].map(f => <div key={f} className="quiz-board-file-label">{f}</div>)}
              </div>
              <div style={{display:"flex",alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column"}}>
                  {[8,7,6,5,4,3,2,1].map(r => <div key={r} className="quiz-board-rank-label">{r}</div>)}
                </div>
                <div className="quiz-board">
                  {q.board.map((row, ri) =>
                    row.map((piece, ci) => {
                      const isLight = (ri + ci) % 2 === 0;
                      const isHL = q.highlight && q.highlight.some(([hr,hc]) => hr === ri && hc === ci);
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
            </div>
          </div>
        )}
        <div style={{fontWeight:600,fontSize:"1rem",color:"var(--brown)",marginBottom:"1.25rem",lineHeight:1.6}}>{q.q}</div>
        {q.opts.map((opt, i) => {
          let cls = "quiz-option";
          if (selected !== null) {
            if (i === q.correct) cls += " correct";
            else if (i === selected) cls += " wrong";
          }
          return <button key={i} className={cls} onClick={() => choose(i)}>{opt}</button>;
        })}
        {selected !== null && (
          <div className={`quiz-feedback ${selected === q.correct ? "correct" : "wrong"}`}>
            {selected === q.correct ? "✅ Correct! " : "❌ Not quite. "}
            {q.explanation}
          </div>
        )}
        {selected !== null && (
          <div style={{marginTop:"1rem",textAlign:"right"}}>
            <button className="btn" onClick={next}>{current < QUIZZES.length-1 ? "Next Question →" : "See Results"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Theory page ──────────────────────────────────────────────────────────────
function TheoryPage() {
  return (
    <div className="fade-in">
      <div className="page-title">Chess Theory Deep Dives</div>
      <div className="page-subtitle">Core principles that underpin everything — from move 1 to the endgame.</div>

      {[
        { title:"The 3 Principles of the Opening", body: `Every good opening follows three principles: (1) Control the center — with pawns on e4/d4 or by attacking those squares. (2) Develop your pieces — get knights before bishops, bishops before rooks. (3) Ensure king safety — castle early, usually kingside.\n\nViolating these principles is the #1 cause of losses at the 800–1200 level. Before any tactical calculation in the opening, ask: "Am I following all three principles?"` },
        { title:"Understanding Pawn Structure", body: `Pawn structure determines the middlegame plan. Isolated pawns (no pawn neighbors) are a weakness — target them with rooks and knights. Passed pawns (no enemy pawns blocking them) are a strength — advance them to promote.\n\nDoubled pawns can be weak but also open files for rooks. Backward pawns can't be defended by other pawns. Learn to identify these patterns and they'll tell you your plan automatically.` },
        { title:"The Concept of Imbalances (Silman)", body: `Jeremy Silman's system: every position has imbalances — differences between the two sides. These include: minor piece imbalance (bishop vs knight), pawn structure differences, space, piece activity, king safety, and initiative.\n\nYour job is to identify the imbalances in your position and make a plan that exploits yours while targeting your opponent's weaknesses. This single concept can replace memorizing 1,000 specific positions.` },
        { title:"Tempo and Initiative", body: `A tempo is a move. If you gain a tempo, you're a move ahead in development. If you lose one, you fall behind. The initiative means your opponent must respond to your threats instead of executing their own plans.\n\nDon't make unnecessary pawn moves in the opening — each one wastes a tempo. Every move should develop a piece, control center, or improve king safety. When you have the initiative, keep making threats. When you don't, find the most challenging move to seize it back.` },
      ].map((item, i) => (
        <div className="card" key={i}>
          <div className="card-title">{item.title}</div>
          <div className="card-body" style={{whiteSpace:"pre-line"}}>{item.body}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function ChessAcademy() {
  const [page, setPage] = useState("home");
  const [selectedOpening, setSelectedOpening] = useState(null);

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
