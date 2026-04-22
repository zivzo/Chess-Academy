import { useState } from 'react';
import { CONCEPTS } from '../data/concepts.js';

export default function StrategyPage() {
  const [active, setActive] = useState(null);
  return (
    <div className="fade-in">
      <div className="page-title">Middlegame Strategy</div>
      <div className="page-subtitle">12 essential concepts. Click any to read a detailed explanation.</div>
      <div className="concept-grid">
        {CONCEPTS.map((c, i) => (
          <div key={i} className="concept-card" onClick={() => setActive(active === i ? null : i)}>
            <div className="concept-icon">{c.icon}</div>
            <h4>{c.title}</h4>
            <p style={{ display: active === i ? "none" : "block" }}>{c.desc.slice(0,60)}…</p>
            {active === i && (
              <p style={{ color:"#4A3F35", fontSize:"0.85rem", lineHeight:"1.65" }}>{c.desc}</p>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop:"1.5rem" }}>
        <div className="card-title">🏆 How to Apply These Concepts</div>
        <div className="card-body">
          After each of your games, pick one concept from this list and ask yourself: <strong>"Did this concept appear in my game? Did I handle it correctly?"</strong><br/><br/>
          Over time, you'll start spotting these patterns at the board in real time — that's when your rating jumps.
        </div>
      </div>
    </div>
  );
}
