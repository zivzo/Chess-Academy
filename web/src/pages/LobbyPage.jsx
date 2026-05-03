// ── Lobby page — quick match + open challenges ─────────────────────────────
import { useEffect, useState } from "react";
import { useAuth } from "../utils/useAuth.js";
import { sendWs, useWsMessages, useWsConnection } from "../utils/wsClient.js";

const TIME_CONTROLS = [
  { label: "Bullet 1+0", baseMs: 60_000, incrementMs: 0 },
  { label: "Blitz 3+0", baseMs: 3 * 60_000, incrementMs: 0 },
  { label: "Blitz 3+2", baseMs: 3 * 60_000, incrementMs: 2_000 },
  { label: "Blitz 5+0", baseMs: 5 * 60_000, incrementMs: 0 },
  { label: "Rapid 10+0", baseMs: 10 * 60_000, incrementMs: 0 },
];

function fmtTc(tc) {
  return `${Math.round(tc.baseMs / 60_000)}+${Math.round(tc.incrementMs / 1000)}`;
}

export default function LobbyPage({ onGameStart }) {
  const { user } = useAuth();
  const connState = useWsConnection();
  const [snapshot, setSnapshot] = useState({ onlineUsers: [], challenges: [] });
  const [queued, setQueued] = useState(null); // current quick-match TC, if queued
  const [tcChoice, setTcChoice] = useState(0);

  useWsMessages((msg) => {
    if (msg.type === "lobby:state") setSnapshot(msg);
    if (msg.type === "lobby:queued") setQueued(msg.timeControl);
    if (msg.type === "lobby:unqueued") setQueued(null);
    if (msg.type === "game:start") onGameStart?.(msg.game);
  });

  useEffect(() => {
    // When the lobby unmounts, leave any quick-match queue.
    return () => { sendWs({ type: "lobby:cancel-quick-match" }); };
  }, []);

  const tc = TIME_CONTROLS[tcChoice];

  function quickMatch() {
    sendWs({ type: "lobby:quick-match", timeControl: { baseMs: tc.baseMs, incrementMs: tc.incrementMs } });
  }
  function cancelQueue() {
    sendWs({ type: "lobby:cancel-quick-match" });
  }
  function createChallenge() {
    sendWs({ type: "lobby:create-challenge", timeControl: { baseMs: tc.baseMs, incrementMs: tc.incrementMs } });
  }
  function cancelChallenge(id) {
    sendWs({ type: "lobby:cancel-challenge", challengeId: id });
  }
  function accept(id) {
    sendWs({ type: "lobby:accept-challenge", challengeId: id });
  }

  const myChallenge = snapshot.challenges.find(c => c.byUserId === user.id);
  const otherChallenges = snapshot.challenges.filter(c => c.byUserId !== user.id);

  return (
    <div className="fade-in">
      <div className="page-title">Online Lobby</div>
      <div className="page-subtitle">
        Play live games against other logged-in users with a chess clock.
      </div>

      {connState !== "open" && (
        <div className="form-error">
          {connState === "closed" ? "Disconnected from server. Trying to reconnect…" : "Connecting…"}
        </div>
      )}

      <div className="card" style={{padding:"1rem",marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
          <label style={{fontSize:"0.82rem",fontWeight:600}}>Time control:</label>
          <select value={tcChoice} onChange={(e) => setTcChoice(Number(e.target.value))}>
            {TIME_CONTROLS.map((t, i) => (
              <option key={i} value={i}>{t.label}</option>
            ))}
          </select>
          {queued ? (
            <>
              <span className="status-pill">⏳ Queued for {fmtTc(queued)} — waiting for an opponent…</span>
              <button className="btn btn-sm btn-outline" onClick={cancelQueue}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-sm" onClick={quickMatch} disabled={connState !== "open"}>
              ⚡ Quick match
            </button>
          )}
          {!myChallenge ? (
            <button className="btn btn-sm btn-outline" onClick={createChallenge} disabled={connState !== "open"}>
              📣 Create open challenge
            </button>
          ) : (
            <>
              <span className="status-pill">📣 Your open challenge: {fmtTc(myChallenge.timeControl)}</span>
              <button className="btn btn-sm btn-outline" onClick={() => cancelChallenge(myChallenge.id)}>
                Withdraw
              </button>
            </>
          )}
        </div>
      </div>

      <div className="lobby-grid">
        <div>
          <div className="card-title" style={{fontSize:"1rem",marginBottom:"0.5rem"}}>
            Open challenges ({otherChallenges.length})
          </div>
          <div className="lobby-list">
            {otherChallenges.length === 0 && <div className="lobby-empty">No open challenges. Create one above!</div>}
            {otherChallenges.map(c => (
              <div key={c.id} className="lobby-row">
                <div>
                  <strong>{c.byUsername}</strong> — {fmtTc(c.timeControl)}
                </div>
                <button className="btn btn-sm" onClick={() => accept(c.id)}>Accept</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="card-title" style={{fontSize:"1rem",marginBottom:"0.5rem"}}>
            Online players ({snapshot.onlineUsers.length})
          </div>
          <div className="lobby-list">
            {snapshot.onlineUsers.length === 0 && <div className="lobby-empty">Nobody else is online right now.</div>}
            {snapshot.onlineUsers.map(u => (
              <div key={u.userId} className="lobby-row">
                <div>{u.username}{u.userId === user.id ? " (you)" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
