// ── Global CSS injected as a style tag ──────────────────────────────────────
export default function GlobalStyles() { return (
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
      --blue: #3A6FA8;
      --purple: #7B4E9E;
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
    .opening-card.color-blue::before { background: var(--blue); }
    .opening-card.color-purple::before { background: var(--purple); }
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

    /* ── Mute toggle button (in header) ── */
    .mute-btn {
      background: none; border: 1px solid rgba(255,255,255,0.18); border-radius: 6px;
      cursor: pointer; color: #C8B99A; padding: 0.35rem 0.55rem; font-size: 1rem;
      margin-left: 0.4rem; line-height: 1; transition: all 0.18s; flex-shrink: 0;
    }
    .mute-btn:hover { background: rgba(255,255,255,0.08); color: var(--cream); }

    /* ── Screen-reader-only (visually hidden, accessible) ── */
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }

    /* ── Move navigation counter ── */
    .nav-counter {
      font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--muted);
      padding: 0 0.3rem; display: flex; align-items: center;
    }
    .nav-counter.reviewing { color: var(--gold); font-weight: 600; }

    /* ── Review-mode overlay hint on the board ── */
    .board-review-hint {
      font-size: 0.72rem; color: var(--gold); font-weight: 600;
      text-align: center; margin-top: 0.3rem; letter-spacing: 0.2px;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       Lichess-style dark game interface  (.lc-*)
    ══════════════════════════════════════════════════════════════════════════ */

    /* Bleed to edges of .content (cancel the 2rem padding) */
    .lc-page {
      margin: -2rem;
      min-height: calc(100vh - 64px);
      background: #262421;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 0;
      color: #bababa;
      font-family: 'DM Sans', sans-serif;
    }

    /* ── Board section (left column) ── */
    .lc-board-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 1.5rem 1rem 1.5rem 1.5rem;
      gap: 0.5rem;
    }

    /* Player label row */
    .lc-player {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      height: 36px;
    }
    .lc-avatar {
      width: 32px; height: 32px;
      background: #3d3a37;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      color: #888;
    }
    .lc-avatar-white { color: #e8e8e8; }
    .lc-player-name  { font-size: 0.95rem; font-weight: 600; color: #e0ddd8; }
    .lc-player-eval  { font-size: 0.8rem; color: #9a9a8a; margin-left: 0.25rem; }
    .lc-thinking-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #6fba6f; animation: lc-pulse 1s ease-in-out infinite;
    }
    @keyframes lc-pulse {
      0%,100% { opacity: 1; } 50% { opacity: 0.3; }
    }

    /* Board + eval-bar row */
    .lc-board-row {
      display: flex;
      align-items: stretch;
      gap: 4px;
    }

    /* Evaluation bar */
    .lc-eval-bar {
      width: 10px;
      border-radius: 3px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      background: #1a1a1a;
      align-self: stretch;
    }
    .lc-eval-black { background: #3d3d3d; transition: height 0.6s ease; }
    .lc-eval-white { background: #e8e8e8; flex: 1; transition: height 0.6s ease; }
    .lc-eval-score {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.55rem;
      color: #888;
      white-space: nowrap;
      writing-mode: horizontal-tb;
      pointer-events: none;
    }

    /* Board coordinate wrappers */
    .lc-board-coords { display: flex; align-items: flex-start; }
    .lc-ranks {
      display: flex; flex-direction: column;
      margin-right: 3px;
    }
    .lc-rank-label {
      width: 14px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.62rem; color: #6b6860; font-weight: 500;
    }
    .lc-files { display: flex; margin-top: 3px; padding-left: 0; }
    .lc-file-label {
      width: 64px; text-align: center;
      font-size: 0.62rem; color: #6b6860; font-weight: 500;
    }

    /* Blue-toned board squares for the game page */
    .lc-board {
      display: grid;
      grid-template-columns: repeat(8, 64px);
      grid-template-rows: repeat(8, 64px);
      border: 2px solid #1a1a1a;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .lc-board .sq { width: 64px; height: 64px; font-size: 2.4rem; }
    .lc-board .sq.lc-light { background: #dee3e6; }
    .lc-board .sq.lc-dark  { background: #8ca2ad; }
    .lc-board .sq.lc-last-move-sq.lc-light { background: #cdd16f; }
    .lc-board .sq.lc-last-move-sq.lc-dark  { background: #aaa23a; }
    .lc-board .sq.selected { box-shadow: inset 0 0 0 4px rgba(20,130,255,0.85); }
    .lc-board .sq.in-check { background: rgba(220,50,30,0.6) !important; }

    /* ── Right panel ── */
    .lc-panel {
      flex: 1;
      min-width: 300px;
      max-width: 420px;
      background: #1f1e1c;
      border-left: 1px solid #333;
      min-height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .lc-panel-title {
      padding: 1rem 1.25rem 0.75rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #e0ddd8;
      border-bottom: 1px solid #2e2d2b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lc-panel-icon { font-size: 1.2rem; }

    .lc-panel-tabs {
      display: flex;
      border-bottom: 1px solid #2e2d2b;
    }
    .lc-panel-tab {
      flex: 1;
      background: none; border: none;
      color: #888; cursor: pointer;
      padding: 0.65rem 0.5rem;
      font-size: 0.82rem; font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }
    .lc-panel-tab:hover { color: #ccc; }
    .lc-panel-tab.active { color: #e0ddd8; border-bottom-color: #bababa; }

    /* Analysis body */
    .lc-analysis-body { padding: 0.75rem 1.25rem; border-bottom: 1px solid #2e2d2b; }
    .lc-analysis-bar {
      display: flex; align-items: center; gap: 0.5rem;
      margin-bottom: 0.6rem; font-size: 0.78rem; color: #aaa;
    }
    .lc-green-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #6fba6f;
      display: inline-block;
    }
    .lc-analysis-label { display: flex; align-items: center; gap: 0.4rem; }
    .lc-depth-badge {
      margin-left: auto;
      font-size: 0.7rem; color: #666;
      background: #2a2927; padding: 1px 6px; border-radius: 4px;
    }
    .lc-last-move-info {
      font-size: 0.82rem; color: #aaa;
      margin-bottom: 0.6rem;
    }
    .lc-engine-line {
      display: flex; align-items: center; gap: 0.6rem;
      background: #2a2927; border-radius: 6px; padding: 0.5rem 0.75rem;
    }
    .lc-eval-chip {
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem; font-weight: 700;
      padding: 2px 7px; border-radius: 4px;
    }
    .lc-eval-white-adv { background: #e8e8e8; color: #1a1a1a; }
    .lc-eval-black-adv { background: #3d3d3d; color: #e8e8e8; }
    .lc-engine-best { font-size: 0.82rem; color: #ccc; font-family: 'DM Mono', monospace; }
    .lc-engine-src  { font-size: 0.7rem; color: #666; margin-left: auto; }
    .lc-engine-thinking { font-size: 0.8rem; color: #666; font-style: italic; padding: 0.3rem 0; }

    /* Settings body */
    .lc-settings-body { padding: 0.75rem 1.25rem; border-bottom: 1px solid #2e2d2b; }
    .lc-setting-label {
      font-size: 0.82rem; color: #aaa; margin-bottom: 0.5rem;
    }
    .lc-setting-label strong { color: #e0ddd8; }
    .lc-range { width: 100%; accent-color: #bababa; cursor: pointer; margin: 0.25rem 0; }
    .lc-range:disabled { cursor: not-allowed; opacity: 0.5; }
    .lc-range-ends {
      display: flex; justify-content: space-between;
      font-size: 0.68rem; color: #666; margin-top: 0.2rem;
    }
    .lc-locked-hint { font-size: 0.7rem; color: #666; margin-top: 0.35rem; font-style: italic; }

    /* Status */
    .lc-status {
      padding: 0.55rem 1.25rem;
      font-size: 0.8rem; color: #999;
      border-bottom: 1px solid #2e2d2b;
    }

    /* Move list */
    .lc-move-list-header {
      padding: 0.5rem 1.25rem 0.3rem;
      font-size: 0.7rem; font-weight: 600; letter-spacing: 0.8px;
      text-transform: uppercase; color: #666;
    }
    .lc-move-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.25rem 0.75rem 0.5rem;
      min-height: 120px;
      max-height: 280px;
    }
    .lc-no-moves { font-size: 0.78rem; color: #555; padding: 0.5rem 0.5rem; font-style: italic; }
    .lc-move-row {
      display: flex; align-items: center; gap: 0.15rem;
      padding: 1px 0;
    }
    .lc-move-num {
      font-size: 0.72rem; color: #555;
      width: 26px; flex-shrink: 0; text-align: right;
      padding-right: 4px;
    }
    .lc-move-cell {
      background: none; border: none; cursor: pointer;
      font-family: 'DM Mono', monospace; font-size: 0.82rem;
      color: #bbb; padding: 3px 8px; border-radius: 4px;
      transition: background 0.12s, color 0.12s;
      min-width: 60px; text-align: left;
    }
    .lc-move-cell:hover { background: #2e2d2b; color: #e0ddd8; }
    .lc-move-cell.active { background: #4b7db3; color: #fff; font-weight: 600; }

    /* Navigation buttons */
    .lc-nav-row {
      display: flex; gap: 0;
      border-top: 1px solid #2e2d2b;
      border-bottom: 1px solid #2e2d2b;
    }
    .lc-nav-btn {
      flex: 1;
      background: #2a2927; border: none;
      color: #bbb; cursor: pointer;
      font-size: 1rem;
      height: 44px;
      transition: background 0.15s, color 0.15s;
      border-right: 1px solid #1f1e1c;
    }
    .lc-nav-btn:last-child { border-right: none; }
    .lc-nav-btn:hover:not(:disabled) { background: #3a3836; color: #fff; }
    .lc-nav-btn:disabled { color: #444; cursor: not-allowed; }

    /* Action buttons */
    .lc-action-row {
      display: flex; gap: 0.6rem;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid #2e2d2b;
      margin-top: auto;
    }
    .lc-action-btn {
      flex: 1;
      background: #2a2927; border: 1px solid #3a3836;
      color: #bbb; cursor: pointer; border-radius: 6px;
      padding: 0.5rem 0.75rem; font-size: 0.82rem;
      font-family: 'DM Sans', sans-serif; font-weight: 600;
      transition: all 0.15s;
    }
    .lc-action-btn:hover { background: #3a3836; color: #e0ddd8; border-color: #555; }
  `}</style>
); }
