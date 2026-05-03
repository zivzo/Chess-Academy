// ── Chess Academy backend entry point ───────────────────────────────────────
//
// Express HTTP API + WebSocket lobby/live-game server, all backed by LowDB.
//
// Endpoints:
//   GET  /api/health                — liveness check
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/logout
//   GET  /api/auth/me
//   GET  /api/games                 — current user's games
//   GET  /api/games/:id
//   POST /api/games                 — finished local / vs-engine game
//   DELETE /api/games/:id
//   GET  /api/analyses/:gameId
//   PUT  /api/analyses/:gameId
//
// WebSocket:
//   /ws  — lobby + online live games (auth via session cookie)

import express from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import { attachUser, authRouter } from "./auth.js";
import { gamesRouter, analysesRouter } from "./games.js";
import { attachWebSocketServer } from "./online.js";
import { getDb } from "./db.js";

const PORT = Number(process.env.PORT) || 3001;

const app = express();

app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(attachUser);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/analyses", analysesRouter);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

const server = http.createServer(app);
attachWebSocketServer(server);

// Touch the DB at boot so the file/backups exist.
await getDb();

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Chess Academy backend listening on http://localhost:${PORT}`);
});
