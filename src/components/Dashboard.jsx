export default function Dashboard({ onNavigate }) {
  return (
    <div className="fade-in">
      <div className="page-title">Good morning, Student ♟</div>
      <div className="page-subtitle">Your chess journey continues — pick up where you left off.</div>
      <div className="stat-grid">
        {[
          { v:"4",   l:"Openings Studied" },
          { v:"12",  l:"Concepts Learned" },
          { v:"6",   l:"Quiz Questions" },
          { v:"800", l:"Starting Rating" },
        ].map(s => (
          <div className="stat-card" key={s.l}>
            <div className="stat-value">{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem", marginBottom:"1.25rem" }}>
        <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("openings")}>
          <div className="card-title">📖 Opening Library</div>
          <div className="card-body">Study 4 core openings with interactive move-by-move boards, annotations, and key ideas.</div>
          <div style={{ marginTop:"1rem" }}><span className="btn btn-sm">Explore Openings →</span></div>
        </div>
        <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("strategy")}>
          <div className="card-title">⚔️ Middlegame Strategy</div>
          <div className="card-body">Master 12 essential middlegame concepts that decide most games at the 800–1400 level.</div>
          <div style={{ marginTop:"1rem" }}><span className="btn btn-sm">Study Strategy →</span></div>
        </div>
        <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("play")}>
          <div className="card-title">🤖 Play vs Bot</div>
          <div className="card-body">Test your skills against 10 bot levels from 200 to 2000 rating. Practice openings in a real game.</div>
          <div style={{ marginTop:"1rem" }}><span className="btn btn-sm">Play Now →</span></div>
        </div>
      </div>

      <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("quiz")}>
        <div className="card-title">🎯 Knowledge Quiz</div>
        <div className="card-body">Test your understanding of openings and strategy with 6 carefully crafted questions. Get instant explanations for each answer.</div>
        <div style={{ marginTop:"1rem" }}><span className="btn btn-sm">Take Quiz →</span></div>
      </div>

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
