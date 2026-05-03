// ── Online live game — clocks, drag/click moves, resign/draw, chat ─────────
import { useEffect, useMemo, useRef, useState } from "react";
import { sendWs, useWsMessages, useWsConnection } from "../utils/wsClient.js";
import { fenToBoard, formatTimeMs, moveToUci } from "../utils/chessFen.js";
import { getLegalMovesWithRules, applyMoveWithRules, createGameState, START } from "../chess-core.js";
import {
  playMove, playCapture, playCheck, playCheckmate, playGameStart, playIllegal,
} from "../utils/chessSound.js";
import Board from "./Board.jsx";

// Reconstruct the rules-engine `gameState` (castling, en passant) by replaying
// the sequence of UCI moves from the start. The server sends FEN strings, but
// re-running the existing rules engine keeps logic centralized and gives us
// the exact same `gameState` shape used elsewhere.
function replayState(uciMoves) {
  let board = START.map(r => [...r]);
  let gs = createGameState();
  let turn = "w";
  for (const uci of uciMoves) {
    const move = uciToLegalMove(board, gs, turn, uci);
    if (!move) break;
    const r = applyMoveWithRules(board, move, gs);
    board = r.board; gs = r.gameState;
    turn = turn === "w" ? "b" : "w";
  }
  return { board, gs, turn };
}

function uciToLegalMove(board, gs, turn, uci) {
  if (typeof uci !== "string" || uci.length < 4) return null;
  const FILES = "abcdefgh";
  const fc = FILES.indexOf(uci[0]);
  const fr = 8 - Number(uci[1]);
  const tc = FILES.indexOf(uci[2]);
  const tr = 8 - Number(uci[3]);
  if (fc < 0 || tc < 0 || isNaN(fr) || isNaN(tr)) return null;
  const piece = board[fr][fc];
  if (!piece || piece[0] !== turn) return null;
  const moves = getLegalMovesWithRules(board, fr, fc, gs);
  return moves.find(m => m.tr === tr && m.tc === tc) || null;
}

export default function OnlineGamePage({ initialGame, onAnalyze, onLeave }) {
  const connState = useWsConnection();
  const [game, setGame] = useState(initialGame);
  const [chat, setChat] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [drawOffer, setDrawOffer] = useState(null); // side that offered ("w"/"b") or null
  const [over, setOver] = useState(null); // {result, termination}
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [draggingSquare, setDraggingSquare] = useState(null);
  const dragValid = useRef(false);

  // Smooth-ticking local clock — based on the last server snapshot.
  const [now, setNow] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  useWsMessages((msg) => {
    if (msg.type === "game:state" || msg.type === "game:start") {
      setGame(msg.game);
      if (msg.type === "game:start") playGameStart();
      // Heuristic sound on opponent move: detect lastMove in newest state.
      if (msg.game?.lastMove?.san) {
        const san = msg.game.lastMove.san;
        if (/[#]/.test(san)) playCheckmate();
        else if (/[+]/.test(san)) playCheck();
        else if (/x/.test(san)) playCapture();
        else playMove();
      }
    }
    if (msg.type === "game:over") {
      setOver({ result: msg.result, termination: msg.termination });
      if (msg.termination === "checkmate") playCheckmate();
    }
    if (msg.type === "game:draw-offered") {
      setDrawOffer(msg.by);
    }
    if (msg.type === "game:chat") {
      setChat((prev) => [...prev, msg].slice(-100));
    }
  });

  // Re-derive board + gameState whenever a new game state arrives.
  const replay = useMemo(() => {
    if (!game) return null;
    const uciMoves = game.moves.map(m => m.uci);
    return replayState(uciMoves);
  }, [game]);

  if (!game) return <div className="page-subtitle">Loading game…</div>;

  const yourColor = game.yourColor;
  const flipped = yourColor === "b";
  const board = replay?.board || fenToBoard(game.fen);
  const gameState = replay?.gs || createGameState();
  const turn = replay?.turn || game.turn;

  // Project the live clocks from the server snapshot.
  const c = game.clocks;
  const elapsed = c.turnStartedAt && !over ? Math.max(0, now - c.turnStartedAt) : 0;
  let liveWhite = c.whiteMs, liveBlack = c.blackMs;
  if (!over && c.turnStartedAt) {
    if (game.turn === "w") liveWhite = Math.max(0, c.whiteMs - elapsed);
    else liveBlack = Math.max(0, c.blackMs - elapsed);
  }

  const myTurn = !over && turn === yourColor;

  function tryMove(uci) {
    sendWs({ type: "game:move", uci });
  }

  function lastMoveCoords() {
    if (!game.lastMove?.uci) return null;
    const FILES = "abcdefgh";
    const u = game.lastMove.uci;
    const fr = 8 - Number(u[1]);
    const fc = FILES.indexOf(u[0]);
    const tr = 8 - Number(u[3]);
    const tc = FILES.indexOf(u[2]);
    if (fc < 0 || tc < 0 || isNaN(fr) || isNaN(tr)) return null;
    return [{ r: fr, c: fc }, { r: tr, c: tc }];
  }

  function onSquareClick(r, ci) {
    if (!myTurn) return;
    const piece = board[r][ci];
    const matched = legalMoves.find(m => m.tr === r && m.tc === ci);
    if (selected && matched) {
      const move = matched;
      const uci = moveToUci(move);
      tryMove(uci);
      setSelected(null);
      setLegalMoves([]);
      return;
    }
    if (piece && piece[0] === yourColor) {
      setSelected({ r, c: ci });
      setLegalMoves(getLegalMovesWithRules(board, r, ci, gameState));
      return;
    }
    if (selected) playIllegal();
    setSelected(null);
    setLegalMoves([]);
  }

  function onDragStart(e, r, ci) {
    if (!myTurn) { e.preventDefault(); return; }
    const piece = board[r][ci];
    if (!piece || piece[0] !== yourColor) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = "move";
    setDraggingSquare({ r, c: ci });
    setSelected({ r, c: ci });
    setLegalMoves(getLegalMovesWithRules(board, r, ci, gameState));
  }
  function onDragOver(e, r, ci) {
    if (legalMoves.some(m => m.tr === r && m.tc === ci)) {
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
    }
  }
  function onDrop(e, r, ci) {
    e.preventDefault();
    dragValid.current = true;
    onSquareClick(r, ci);
    setDraggingSquare(null);
  }
  function onDragEnd() {
    if (!dragValid.current) { setSelected(null); setLegalMoves([]); }
    dragValid.current = false;
    setDraggingSquare(null);
  }

  function sendChat() {
    const text = chatDraft.trim();
    if (!text) return;
    sendWs({ type: "game:chat", text });
    setChatDraft("");
  }

  function offerDraw() {
    sendWs({ type: "game:offer-draw" });
  }
  function acceptDraw() {
    sendWs({ type: "game:accept-draw" });
    setDrawOffer(null);
  }
  function declineDraw() {
    sendWs({ type: "game:decline-draw" });
    setDrawOffer(null);
  }
  function resign() {
    if (!confirm("Resign this game?")) return;
    sendWs({ type: "game:resign" });
  }

  const opponent = yourColor === "w"
    ? { username: game.black.username, userId: game.black.userId, ms: liveBlack }
    : { username: game.white.username, userId: game.white.userId, ms: liveWhite };
  const me = yourColor === "w"
    ? { username: game.white.username, ms: liveWhite }
    : { username: game.black.username, ms: liveBlack };

  function clockClass(side) {
    const isActive = !over && turn === side;
    const ms = side === "w" ? liveWhite : liveBlack;
    const low = ms < 30_000;
    return `clock ${isActive ? "active" : ""} ${low ? "low" : ""}`.trim();
  }

  return (
    <div className="fade-in">
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.75rem",flexWrap:"wrap"}}>
        <button className="btn btn-sm btn-outline" onClick={onLeave}>← Leave</button>
        <div className="status-pill">
          {connState === "open" ? "🟢 Connected" : connState === "closed" ? "🔴 Reconnecting…" : "🟡 Connecting…"}
        </div>
        {over && <div className="status-pill">🏁 {over.result} — {over.termination}</div>}
      </div>

      <div className="board-wrap" style={{alignItems:"flex-start"}}>
        <div>
          <div className="player-strip">
            <div className="player-name">{opponent.username}</div>
            <div className={clockClass(yourColor === "w" ? "b" : "w")}>{formatTimeMs(opponent.ms)}</div>
          </div>
          <Board
            board={board}
            flipped={flipped}
            size={64}
            selected={selected}
            legalMoves={legalMoves}
            lastMove={lastMoveCoords()}
            draggable={myTurn}
            draggingSquare={draggingSquare}
            onSquareClick={onSquareClick}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
          <div className="player-strip" style={{marginTop:"0.4rem"}}>
            <div className="player-name">{me.username} (you)</div>
            <div className={clockClass(yourColor)}>{formatTimeMs(me.ms)}</div>
          </div>
        </div>

        <div style={{flex:1, minWidth: 280}}>
          <div className="card" style={{padding:"0.8rem"}}>
            <div className="card-title" style={{fontSize:"0.95rem",marginBottom:"0.5rem"}}>
              Game controls
            </div>
            {over ? (
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                <button className="btn btn-sm" onClick={() => onAnalyze?.(game.id)}>🔍 Analyze game</button>
                <button className="btn btn-sm btn-outline" onClick={onLeave}>Back to lobby</button>
              </div>
            ) : (
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                <button className="btn btn-sm btn-outline" onClick={offerDraw}>½ Offer draw</button>
                <button className="btn btn-sm btn-outline" onClick={resign}>🏳 Resign</button>
              </div>
            )}
            {drawOffer && drawOffer !== yourColor && !over && (
              <div style={{marginTop:"0.6rem",padding:"0.5rem",background:"#FFF8EE",borderRadius:6}}>
                Opponent offered a draw.
                <div style={{display:"flex",gap:"0.4rem",marginTop:"0.4rem"}}>
                  <button className="btn btn-sm" onClick={acceptDraw}>Accept</button>
                  <button className="btn btn-sm btn-outline" onClick={declineDraw}>Decline</button>
                </div>
              </div>
            )}
            {drawOffer === yourColor && !over && (
              <div style={{marginTop:"0.6rem",fontSize:"0.8rem",color:"var(--muted)"}}>
                Draw offer sent — waiting for response.
              </div>
            )}
          </div>

          <div className="card" style={{padding:"0.6rem"}}>
            <div className="card-title" style={{fontSize:"0.9rem",marginBottom:"0.3rem"}}>Move list</div>
            <div className="move-list">
              {game.moves.length === 0 && <span className="move-number">Game just started.</span>}
              {game.moves.map((m, i) => {
                const ply = i + 1;
                const num = ply % 2 === 1 ? `${Math.ceil(ply/2)}.` : "";
                return <span key={i} className="move-chip">{num} {m.san}</span>;
              })}
            </div>
          </div>

          <div className="chat-box">
            <div className="chat-log">
              {chat.length === 0 && <div style={{color:"var(--muted)",fontSize:"0.78rem"}}>Be nice in chat 🙂</div>}
              {chat.map((m, i) => (
                <div key={i} className="chat-msg">
                  <span className="who">{m.fromUsername}:</span>{m.text}
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
              <input
                type="text"
                placeholder="Type a message…"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                maxLength={500}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      </div>

      {over && (
        <div className="modal-overlay" onClick={onLeave}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Game over</h3>
            <p>
              <strong>{over.result}</strong> — {over.termination}
            </p>
            <div className="actions">
              <button className="btn btn-outline" onClick={onLeave}>Back to lobby</button>
              <button className="btn" onClick={() => onAnalyze?.(game.id)}>🔍 Analyze</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
