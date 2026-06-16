import { useState } from 'react';
import { QUIZZES } from '../data/quizzes.js';

export default function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZZES[current];

  function choose(i) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore(s => s + 1);
  }

  function next() {
    if (current < QUIZZES.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  }

  function restart() { setCurrent(0); setSelected(null); setScore(0); setDone(false); }

  if (done) return (
    <div className="fade-in">
      <div className="page-title">Quiz Complete! 🎉</div>
      <div className="card" style={{ textAlign:"center", padding:"2.5rem" }}>
        <div style={{ fontSize:"4rem", fontFamily:"'Playfair Display',serif", fontWeight:900, color:"var(--brown)" }}>
          {score}/{QUIZZES.length}
        </div>
        <div style={{ fontSize:"1rem", color:"var(--muted)", marginTop:"0.5rem", marginBottom:"1.5rem" }}>
          {score >= 5
            ? "Excellent! You really know your theory."
            : score >= 3
            ? "Good effort! Review the explanations and try again."
            : "Keep studying — review the openings and concepts, then come back!"}
        </div>
        <button className="btn" onClick={restart}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-title">Knowledge Quiz</div>
      <div className="page-subtitle">Question {current+1} of {QUIZZES.length} · Score: {score}</div>
      <div style={{ marginBottom:"0.5rem" }}>
        <div className="progress-wrap">
          <div className="progress-fill" style={{ width:`${(current / QUIZZES.length) * 100}%` }} />
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight:600, fontSize:"1rem", color:"var(--brown)", marginBottom:"1.25rem", lineHeight:1.6 }}>
          {q.q}
        </div>
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
          <div style={{ marginTop:"1rem", textAlign:"right" }}>
            <button className="btn" onClick={next}>
              {current < QUIZZES.length - 1 ? "Next Question →" : "See Results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
