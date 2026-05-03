// ── Online play: WebSocket lobby + server-authoritative live games ──────────
//
// Transport: ws over the same HTTP server. The cookie-based session is read
// during the upgrade handshake to authenticate the user.
//
// Lobby state (in-memory):
//   - users connected to /ws/lobby
//   - open challenges they have created
//   - quick-match queues keyed by time control
//
// LiveGame (in-memory, also persisted to db.json):
//   { id, white:{userId,username,ws}, black:{...}, board, gameState, turn,
//     moves[], pgn, clocks:{ whiteMs, blackMs, increment, turnStartedAt },
//     status, flagTimer, drawOfferBy, lastActivity }
//
// Clocks: server is the source of truth.
//   - When player X's turn begins, `turnStartedAt = Date.now()`.
//   - When X submits a move, `elapsed = now - turnStartedAt`,
//     `X.remainingMs -= elapsed; X.remainingMs += increment`.
//   - A `setTimeout` armed for X.remainingMs flags X if it fires.
//   - On reconnect within RECONNECT_GRACE_MS, the live game's WS is rebound;
//     after the grace period without reconnect, the disconnected side is
//     flagged as abandoned.
//
// Move validation: every move runs through the same chess-rules.js the
// frontend uses. The client cannot inject illegal moves.

import { WebSocketServer } from "ws";
import cookie from "cookie";
import {
  startingPosition,
  applyMoveWithRules,
  getGameStatus,
  findLegalMove,
  moveToSan,
  moveToUci,
  boardToFen,
} from "./chess-engine.js";
import { findUserBySessionCookie, SESSION_COOKIE } from "./auth.js";
import { getDb, persist, newId } from "./db.js";

const RECONNECT_GRACE_MS = 30_000;
const MIN_BASE_MS = 30_000;          // 30 s minimum on the clock
const MAX_BASE_MS = 60 * 60_000;     // 60 min maximum
const MAX_INCREMENT_MS = 60_000;     // 60 s max increment
const MAX_CHAT_LEN = 500;
const CHAT_RATE_PER_MIN = 30;

const MESSAGE_RATE_PER_SEC = 20;

// ── State ────────────────────────────────────────────────────────────────────
const lobbyClients = new Map();      // userId -> { ws, user }
const challenges = new Map();         // challengeId -> { id, byUserId, byUsername, timeControl }
const quickMatchQueue = new Map();    // tcKey -> [{ userId, username, addedAt }]
const liveGames = new Map();          // gameId -> LiveGame
const userToGame = new Map();         // userId -> gameId (their current online game)

// ── Helpers ─────────────────────────────────────────────────────────────────
function tcKey(tc) {
  return `${tc.baseMs}/${tc.incrementMs}`;
}

function isValidTimeControl(tc) {
  if (!tc || typeof tc !== "object") return false;
  if (!Number.isInteger(tc.baseMs) || !Number.isInteger(tc.incrementMs)) return false;
  if (tc.baseMs < MIN_BASE_MS || tc.baseMs > MAX_BASE_MS) return false;
  if (tc.incrementMs < 0 || tc.incrementMs > MAX_INCREMENT_MS) return false;
  return true;
}

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== ws.OPEN) return;
  try { ws.send(JSON.stringify(payload)); } catch { /* ignore */ }
}

function lobbySnapshot() {
  return {
    type: "lobby:state",
    onlineUsers: Array.from(lobbyClients.values()).map(c => ({
      userId: c.user.id, username: c.user.username,
    })),
    challenges: Array.from(challenges.values()),
  };
}

function broadcastLobby() {
  const snap = lobbySnapshot();
  for (const { ws } of lobbyClients.values()) safeSend(ws, snap);
}

function publicGameView(g, viewerId) {
  return {
    id: g.id,
    white: { userId: g.white.userId, username: g.white.username },
    black: { userId: g.black.userId, username: g.black.username },
    yourColor: viewerId === g.white.userId ? "w" : viewerId === g.black.userId ? "b" : null,
    fen: boardToFen(g.board, g.turn, g.gameState, 0, Math.floor(g.moves.length / 2) + 1),
    turn: g.turn,
    moves: g.moves.map(m => ({ san: m.san, uci: m.uci, fenAfter: m.fenAfter })),
    clocks: liveClocks(g),
    timeControl: g.timeControl,
    status: g.status,
    drawOfferBy: g.drawOfferBy || null,
    lastMove: g.lastMove || null,
  };
}

function liveClocks(g) {
  // Project remaining time at "now" if the clock is currently running.
  const now = Date.now();
  let whiteMs = g.clocks.whiteMs;
  let blackMs = g.clocks.blackMs;
  if (g.status === "playing" && g.clocks.turnStartedAt) {
    const elapsed = now - g.clocks.turnStartedAt;
    if (g.turn === "w") whiteMs = Math.max(0, whiteMs - elapsed);
    else blackMs = Math.max(0, blackMs - elapsed);
  }
  return { whiteMs, blackMs, increment: g.clocks.increment, turnStartedAt: g.clocks.turnStartedAt };
}

function clearFlagTimer(g) {
  if (g.flagTimer) { clearTimeout(g.flagTimer); g.flagTimer = null; }
}

function armFlagTimer(g) {
  clearFlagTimer(g);
  if (g.status !== "playing") return;
  const remaining = g.turn === "w" ? g.clocks.whiteMs : g.clocks.blackMs;
  g.flagTimer = setTimeout(() => onFlagFall(g), Math.max(0, remaining));
}

async function onFlagFall(g) {
  if (g.status !== "playing") return;
  // Time-out: side to move loses.
  const loser = g.turn;
  const result = loser === "w" ? "0-1" : "1-0";
  await endGame(g, { result, termination: "timeout" });
}

function broadcastGame(g) {
  const stateForWhite = { type: "game:state", game: publicGameView(g, g.white.userId) };
  const stateForBlack = { type: "game:state", game: publicGameView(g, g.black.userId) };
  safeSend(g.white.ws, stateForWhite);
  safeSend(g.black.ws, stateForBlack);
}

// Persist current LiveGame state to the games collection (upsert).
async function persistGame(g) {
  const db = await getDb();
  let row = db.data.games.find(x => x.id === g.id);
  const moves = g.moves.map(m => ({
    san: m.san, uci: m.uci, fenAfter: m.fenAfter,
    timeLeftWhiteMs: m.timeLeftWhiteMs, timeLeftBlackMs: m.timeLeftBlackMs,
  }));
  const base = {
    id: g.id,
    type: "online",
    whiteUserId: g.white.userId,
    blackUserId: g.black.userId,
    whiteName: g.white.username,
    blackName: g.black.username,
    engineRating: null,
    timeControl: g.timeControl,
    result: g.result || "*",
    termination: g.termination || "in_progress",
    startedAt: g.startedAt,
    endedAt: g.endedAt || null,
    pgn: g.pgn || "",
    moves,
  };
  if (row) {
    Object.assign(row, base);
  } else {
    db.data.games.push(base);
  }
  await persist();
}

async function endGame(g, { result, termination }) {
  if (g.status !== "playing") return;
  clearFlagTimer(g);
  // Settle clocks at end of game.
  if (g.clocks.turnStartedAt) {
    const elapsed = Date.now() - g.clocks.turnStartedAt;
    if (g.turn === "w") g.clocks.whiteMs = Math.max(0, g.clocks.whiteMs - elapsed);
    else g.clocks.blackMs = Math.max(0, g.clocks.blackMs - elapsed);
    g.clocks.turnStartedAt = null;
  }
  g.status = "ended";
  g.result = result;
  g.termination = termination;
  g.endedAt = new Date().toISOString();
  // PGN tags
  g.pgn = buildPgn(g);
  await persistGame(g);
  const payload = {
    type: "game:over",
    gameId: g.id,
    result,
    termination,
    clocks: liveClocks(g),
  };
  safeSend(g.white.ws, payload);
  safeSend(g.black.ws, payload);
  // Free up the user → game mapping after a short delay to allow
  // the clients to read the final state.
  setTimeout(() => {
    if (userToGame.get(g.white.userId) === g.id) userToGame.delete(g.white.userId);
    if (userToGame.get(g.black.userId) === g.id) userToGame.delete(g.black.userId);
    liveGames.delete(g.id);
  }, 60_000);
}

function buildPgn(g) {
  const tags = [
    `[Event "Chess Academy Online"]`,
    `[Site "Chess Academy"]`,
    `[Date "${(g.startedAt || new Date().toISOString()).slice(0,10).replaceAll("-",".")}"]`,
    `[White "${g.white.username}"]`,
    `[Black "${g.black.username}"]`,
    `[Result "${g.result || "*"}"]`,
    `[TimeControl "${g.timeControl.baseMs/1000}+${g.timeControl.incrementMs/1000}"]`,
  ].join("\n");
  let body = "";
  for (let i = 0; i < g.moves.length; i++) {
    if (i % 2 === 0) body += `${(i / 2) + 1}. `;
    body += `${g.moves[i].san} `;
  }
  body += g.result || "*";
  return `${tags}\n\n${body.trim()}\n`;
}

// ── Create a live game ──────────────────────────────────────────────────────
async function createLiveGame(playerA, playerB, timeControl) {
  // Random color assignment.
  const whiteFirst = Math.random() < 0.5;
  const white = whiteFirst ? playerA : playerB;
  const black = whiteFirst ? playerB : playerA;
  const start = startingPosition();
  const g = {
    id: newId(),
    white: { userId: white.userId, username: white.username, ws: white.ws },
    black: { userId: black.userId, username: black.username, ws: black.ws },
    board: start.board,
    gameState: start.gameState,
    turn: "w",
    moves: [],
    pgn: "",
    timeControl,
    clocks: {
      whiteMs: timeControl.baseMs,
      blackMs: timeControl.baseMs,
      increment: timeControl.incrementMs,
      turnStartedAt: Date.now(),
    },
    status: "playing",
    flagTimer: null,
    drawOfferBy: null,
    lastMove: null,
    startedAt: new Date().toISOString(),
    chatBudget: { white: { count: 0, since: Date.now() }, black: { count: 0, since: Date.now() } },
    disconnects: { white: null, black: null },   // setTimeout handles
  };
  liveGames.set(g.id, g);
  userToGame.set(g.white.userId, g.id);
  userToGame.set(g.black.userId, g.id);
  armFlagTimer(g);
  await persistGame(g);

  const startPayload = (viewerId) => ({
    type: "game:start",
    game: publicGameView(g, viewerId),
  });
  safeSend(g.white.ws, startPayload(g.white.userId));
  safeSend(g.black.ws, startPayload(g.black.userId));
  return g;
}

// ── Handle a move from a player ─────────────────────────────────────────────
async function handleMove(g, side, uci) {
  if (g.status !== "playing") return { error: "game_not_playing" };
  if (g.turn !== side) return { error: "not_your_turn" };

  const player = side === "w" ? g.white : g.black;
  const move = findLegalMove(g.board, g.gameState, side, uci);
  if (!move) return { error: "illegal_move" };

  // Compute clock change for the side that just moved.
  const now = Date.now();
  const elapsed = g.clocks.turnStartedAt ? now - g.clocks.turnStartedAt : 0;
  if (side === "w") {
    g.clocks.whiteMs = Math.max(0, g.clocks.whiteMs - elapsed);
    if (g.clocks.whiteMs <= 0) {
      // Flag fell exactly at submission — opponent wins on time.
      await endGame(g, { result: "0-1", termination: "timeout" });
      return { ok: true };
    }
    g.clocks.whiteMs += g.clocks.increment;
  } else {
    g.clocks.blackMs = Math.max(0, g.clocks.blackMs - elapsed);
    if (g.clocks.blackMs <= 0) {
      await endGame(g, { result: "1-0", termination: "timeout" });
      return { ok: true };
    }
    g.clocks.blackMs += g.clocks.increment;
  }

  const san = moveToSan(g.board, move, g.gameState);
  const { board: nextBoard, gameState: nextGS } =
    applyMoveWithRules(g.board, move, g.gameState);
  g.board = nextBoard;
  g.gameState = nextGS;
  g.turn = side === "w" ? "b" : "w";
  g.lastMove = { uci: moveToUci(move), san };
  const fenAfter = boardToFen(g.board, g.turn, g.gameState, 0, Math.floor((g.moves.length + 1) / 2) + 1);
  g.moves.push({
    san, uci: moveToUci(move), fenAfter,
    timeLeftWhiteMs: g.clocks.whiteMs,
    timeLeftBlackMs: g.clocks.blackMs,
  });
  // Drawn by 50/threefold not implemented; basic status only.
  const status = getGameStatus(g.board, g.turn, g.gameState);
  // Any move clears any pending draw offer from the moving side.
  if (g.drawOfferBy === side) g.drawOfferBy = null;

  if (status === "checkmate") {
    const result = side === "w" ? "1-0" : "0-1";
    g.clocks.turnStartedAt = null;
    await endGame(g, { result, termination: "checkmate" });
    broadcastGame(g);
    return { ok: true };
  }
  if (status === "stalemate") {
    g.clocks.turnStartedAt = null;
    await endGame(g, { result: "1/2-1/2", termination: "stalemate" });
    broadcastGame(g);
    return { ok: true };
  }

  g.clocks.turnStartedAt = Date.now();
  armFlagTimer(g);
  void persistGame(g);
  broadcastGame(g);
  return { ok: true };
}

function sideOf(g, userId) {
  if (g.white.userId === userId) return "w";
  if (g.black.userId === userId) return "b";
  return null;
}

// ── Per-connection rate limiting (token bucket) ─────────────────────────────
function rateLimited(ws) {
  const now = Date.now();
  if (!ws._rl) { ws._rl = { count: 0, since: now }; }
  if (now - ws._rl.since > 1000) { ws._rl.count = 0; ws._rl.since = now; }
  ws._rl.count++;
  return ws._rl.count > MESSAGE_RATE_PER_SEC;
}

// ── WebSocket attach ────────────────────────────────────────────────────────
export function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req, socket, head) => {
    const url = req.url || "";
    if (!url.startsWith("/ws")) {
      socket.destroy();
      return;
    }
    let user = null;
    try {
      const cookies = cookie.parse(req.headers.cookie || "");
      user = await findUserBySessionCookie(cookies[SESSION_COOKIE]);
    } catch { user = null; }
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = user;
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    const user = ws.user;

    // Reattach to a live game if the user has one.
    const liveId = userToGame.get(user.id);
    const live = liveId ? liveGames.get(liveId) : null;
    if (live) {
      const side = sideOf(live, user.id);
      if (side === "w") live.white.ws = ws;
      else if (side === "b") live.black.ws = ws;
      // Cancel pending disconnect timer.
      const dcKey = side === "w" ? "white" : "black";
      if (live.disconnects[dcKey]) {
        clearTimeout(live.disconnects[dcKey]);
        live.disconnects[dcKey] = null;
      }
      safeSend(ws, { type: "game:state", game: publicGameView(live, user.id) });
    } else {
      // Otherwise treat as a lobby connection.
      lobbyClients.set(user.id, { ws, user });
      safeSend(ws, lobbySnapshot());
      broadcastLobby();
    }

    ws.on("message", (raw) => {
      if (rateLimited(ws)) {
        safeSend(ws, { type: "error", error: "rate_limited" });
        return;
      }
      let msg;
      try { msg = JSON.parse(String(raw)); } catch { return; }
      if (!msg || typeof msg !== "object") return;
      handleClientMessage(ws, user, msg).catch(() => {});
    });

    ws.on("close", () => {
      lobbyClients.delete(user.id);
      // Drop their open challenges + queue spots.
      for (const [cid, ch] of challenges) {
        if (ch.byUserId === user.id) challenges.delete(cid);
      }
      for (const [k, q] of quickMatchQueue) {
        const filtered = q.filter(p => p.userId !== user.id);
        if (filtered.length) quickMatchQueue.set(k, filtered);
        else quickMatchQueue.delete(k);
      }
      broadcastLobby();

      // If they're in a live game, start a reconnect grace period.
      const lid = userToGame.get(user.id);
      const lg = lid ? liveGames.get(lid) : null;
      if (lg && lg.status === "playing") {
        const side = sideOf(lg, user.id);
        if (side) {
          const dcKey = side === "w" ? "white" : "black";
          if (lg.disconnects[dcKey]) clearTimeout(lg.disconnects[dcKey]);
          lg.disconnects[dcKey] = setTimeout(async () => {
            // Still disconnected after grace period → opponent wins.
            const result = side === "w" ? "0-1" : "1-0";
            await endGame(lg, { result, termination: "abandoned" });
          }, RECONNECT_GRACE_MS);
        }
      }
    });
  });
}

async function handleClientMessage(ws, user, msg) {
  switch (msg.type) {
    case "lobby:create-challenge": {
      if (!isValidTimeControl(msg.timeControl)) {
        return safeSend(ws, { type: "error", error: "invalid_time_control" });
      }
      // Drop any existing challenge from this user.
      for (const [cid, ch] of challenges) {
        if (ch.byUserId === user.id) challenges.delete(cid);
      }
      const ch = {
        id: newId(),
        byUserId: user.id,
        byUsername: user.username,
        timeControl: msg.timeControl,
      };
      challenges.set(ch.id, ch);
      broadcastLobby();
      return;
    }
    case "lobby:cancel-challenge": {
      const ch = challenges.get(msg.challengeId);
      if (ch && ch.byUserId === user.id) {
        challenges.delete(msg.challengeId);
        broadcastLobby();
      }
      return;
    }
    case "lobby:accept-challenge": {
      const ch = challenges.get(msg.challengeId);
      if (!ch) return safeSend(ws, { type: "error", error: "challenge_gone" });
      if (ch.byUserId === user.id) return safeSend(ws, { type: "error", error: "cannot_accept_own" });
      const challenger = lobbyClients.get(ch.byUserId);
      if (!challenger) return safeSend(ws, { type: "error", error: "challenger_offline" });
      challenges.delete(ch.id);
      // Remove both from lobby/queue.
      lobbyClients.delete(challenger.user.id);
      lobbyClients.delete(user.id);
      for (const [k, q] of quickMatchQueue) {
        const filtered = q.filter(p => p.userId !== user.id && p.userId !== challenger.user.id);
        if (filtered.length) quickMatchQueue.set(k, filtered);
        else quickMatchQueue.delete(k);
      }
      await createLiveGame(
        { userId: challenger.user.id, username: challenger.user.username, ws: challenger.ws },
        { userId: user.id, username: user.username, ws },
        ch.timeControl,
      );
      broadcastLobby();
      return;
    }
    case "lobby:quick-match": {
      if (!isValidTimeControl(msg.timeControl)) {
        return safeSend(ws, { type: "error", error: "invalid_time_control" });
      }
      const key = tcKey(msg.timeControl);
      const queue = quickMatchQueue.get(key) || [];
      // Try to pair with first different user in the queue.
      const partnerIdx = queue.findIndex(p => p.userId !== user.id);
      if (partnerIdx >= 0) {
        const partner = queue[partnerIdx];
        queue.splice(partnerIdx, 1);
        if (queue.length) quickMatchQueue.set(key, queue);
        else quickMatchQueue.delete(key);
        const partnerClient = lobbyClients.get(partner.userId);
        if (!partnerClient) return; // they disconnected
        lobbyClients.delete(partnerClient.user.id);
        lobbyClients.delete(user.id);
        await createLiveGame(
          { userId: partnerClient.user.id, username: partnerClient.user.username, ws: partnerClient.ws },
          { userId: user.id, username: user.username, ws },
          msg.timeControl,
        );
        broadcastLobby();
      } else {
        // Add this user to the queue (deduped).
        const filtered = queue.filter(p => p.userId !== user.id);
        filtered.push({ userId: user.id, username: user.username, addedAt: Date.now() });
        quickMatchQueue.set(key, filtered);
        safeSend(ws, { type: "lobby:queued", timeControl: msg.timeControl });
      }
      return;
    }
    case "lobby:cancel-quick-match": {
      for (const [k, q] of quickMatchQueue) {
        const filtered = q.filter(p => p.userId !== user.id);
        if (filtered.length) quickMatchQueue.set(k, filtered);
        else quickMatchQueue.delete(k);
      }
      safeSend(ws, { type: "lobby:unqueued" });
      return;
    }
    case "game:move": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g) return safeSend(ws, { type: "error", error: "no_active_game" });
      const side = sideOf(g, user.id);
      if (!side) return safeSend(ws, { type: "error", error: "not_a_player" });
      const result = await handleMove(g, side, msg.uci);
      if (result?.error) safeSend(ws, { type: "error", error: result.error });
      return;
    }
    case "game:resign": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g) return;
      const side = sideOf(g, user.id);
      if (!side) return;
      const result = side === "w" ? "0-1" : "1-0";
      await endGame(g, { result, termination: "resignation" });
      broadcastGame(g);
      return;
    }
    case "game:offer-draw": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g || g.status !== "playing") return;
      const side = sideOf(g, user.id);
      if (!side) return;
      g.drawOfferBy = side;
      const opp = side === "w" ? g.black : g.white;
      safeSend(opp.ws, { type: "game:draw-offered", by: side });
      broadcastGame(g);
      return;
    }
    case "game:accept-draw": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g || g.status !== "playing") return;
      const side = sideOf(g, user.id);
      if (!side || !g.drawOfferBy || g.drawOfferBy === side) return;
      await endGame(g, { result: "1/2-1/2", termination: "agreement" });
      broadcastGame(g);
      return;
    }
    case "game:decline-draw": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g || g.status !== "playing") return;
      const side = sideOf(g, user.id);
      if (!side) return;
      g.drawOfferBy = null;
      broadcastGame(g);
      return;
    }
    case "game:chat": {
      const lid = userToGame.get(user.id);
      const g = lid ? liveGames.get(lid) : null;
      if (!g) return;
      const side = sideOf(g, user.id);
      if (!side) return;
      const text = typeof msg.text === "string" ? msg.text.slice(0, MAX_CHAT_LEN).trim() : "";
      if (!text) return;
      // Per-side chat throttling.
      const bucket = side === "w" ? g.chatBudget.white : g.chatBudget.black;
      const now = Date.now();
      if (now - bucket.since > 60_000) { bucket.since = now; bucket.count = 0; }
      bucket.count++;
      if (bucket.count > CHAT_RATE_PER_MIN) {
        return safeSend(ws, { type: "error", error: "chat_rate_limited" });
      }
      const payload = {
        type: "game:chat",
        from: side, fromUsername: user.username, text, ts: now,
      };
      safeSend(g.white.ws, payload);
      safeSend(g.black.ws, payload);
      return;
    }
    default:
      safeSend(ws, { type: "error", error: "unknown_message" });
  }
}
