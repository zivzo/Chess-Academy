// ── Games + Analyses REST API ───────────────────────────────────────────────
//
// Endpoints:
//   GET    /api/games              — list current user's games (paginated)
//   GET    /api/games/:id          — get a single game (must be a participant)
//   POST   /api/games              — create a finished game record
//   DELETE /api/games/:id          — delete a game (only if user is owner)
//   GET    /api/analyses/:gameId   — get current user's analysis for a game
//   PUT    /api/analyses/:gameId   — upsert current user's analysis

import express from "express";
import { getDb, persist, newId } from "./db.js";
import { requireAuth } from "./auth.js";

const VALID_TYPES = new Set(["local", "vs-engine", "online"]);
const VALID_RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);

function userCanSeeGame(game, user) {
  if (!user) return false;
  return game.whiteUserId === user.id || game.blackUserId === user.id;
}

export const gamesRouter = express.Router();

gamesRouter.use(requireAuth);

gamesRouter.get("/", async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const type = req.query.type;
  const result = req.query.result;
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 20));

  let list = db.data.games.filter(g =>
    g.whiteUserId === userId || g.blackUserId === userId,
  );
  if (type && VALID_TYPES.has(type)) list = list.filter(g => g.type === type);
  if (result && VALID_RESULTS.has(result)) list = list.filter(g => g.result === result);

  list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const total = list.length;
  const start = (page - 1) * perPage;
  const items = list.slice(start, start + perPage);
  res.json({ items, total, page, perPage });
});

gamesRouter.get("/:id", async (req, res) => {
  const db = await getDb();
  const game = db.data.games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: "not_found" });
  if (!userCanSeeGame(game, req.user)) return res.status(403).json({ error: "forbidden" });
  res.json({ game });
});

gamesRouter.post("/", async (req, res) => {
  const body = req.body || {};
  const type = body.type;
  if (!VALID_TYPES.has(type)) return res.status(400).json({ error: "invalid_type" });
  if (type === "online") {
    return res.status(400).json({ error: "online_games_created_via_ws" });
  }
  if (!Array.isArray(body.moves)) return res.status(400).json({ error: "invalid_moves" });
  if (body.moves.length > 1000) return res.status(400).json({ error: "too_many_moves" });
  if (!VALID_RESULTS.has(body.result)) return res.status(400).json({ error: "invalid_result" });

  // For local + vs-engine, the requester is at least one side.
  const userId = req.user.id;
  const username = req.user.username;

  let whiteUserId = null;
  let blackUserId = null;
  let whiteName = "Guest";
  let blackName = "Guest";
  let engineRating = null;

  if (type === "local") {
    // Both colors are tagged with the logged-in user — they played both sides.
    whiteUserId = userId;
    blackUserId = userId;
    whiteName = username;
    blackName = username;
  } else if (type === "vs-engine") {
    const userColor = body.userColor === "b" ? "b" : "w";
    engineRating = Number(body.engineRating) || null;
    if (userColor === "w") {
      whiteUserId = userId;
      whiteName = username;
      blackName = `Stockfish ${engineRating || ""}`.trim();
    } else {
      blackUserId = userId;
      blackName = username;
      whiteName = `Stockfish ${engineRating || ""}`.trim();
    }
  }

  const now = new Date().toISOString();
  const game = {
    id: newId(),
    type,
    whiteUserId,
    blackUserId,
    whiteName,
    blackName,
    engineRating,
    timeControl: body.timeControl || null,
    result: body.result,
    termination: typeof body.termination === "string" ? body.termination : "unknown",
    startedAt: typeof body.startedAt === "string" ? body.startedAt : now,
    endedAt: now,
    pgn: typeof body.pgn === "string" ? body.pgn.slice(0, 50_000) : "",
    moves: body.moves
      .filter(m => m && typeof m === "object")
      .slice(0, 1000)
      .map(m => ({
        san: typeof m.san === "string" ? m.san.slice(0, 16) : "",
        uci: typeof m.uci === "string" ? m.uci.slice(0, 6) : "",
        fenAfter: typeof m.fenAfter === "string" ? m.fenAfter.slice(0, 100) : "",
      })),
  };

  const db = await getDb();
  db.data.games.push(game);
  await persist();
  res.status(201).json({ game });
});

gamesRouter.delete("/:id", async (req, res) => {
  const db = await getDb();
  const idx = db.data.games.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  const game = db.data.games[idx];
  if (!userCanSeeGame(game, req.user)) return res.status(403).json({ error: "forbidden" });
  db.data.games.splice(idx, 1);
  // Also drop the user's analyses for this game.
  db.data.analyses = db.data.analyses.filter(a => !(a.gameId === game.id && a.userId === req.user.id));
  await persist();
  res.json({ ok: true });
});

// ── Analyses ────────────────────────────────────────────────────────────────

export const analysesRouter = express.Router();

analysesRouter.use(requireAuth);

analysesRouter.get("/:gameId", async (req, res) => {
  const db = await getDb();
  const game = db.data.games.find(g => g.id === req.params.gameId);
  if (!game) return res.status(404).json({ error: "game_not_found" });
  if (!userCanSeeGame(game, req.user)) return res.status(403).json({ error: "forbidden" });
  const analysis = db.data.analyses.find(
    a => a.gameId === req.params.gameId && a.userId === req.user.id,
  );
  res.json({ analysis: analysis || null });
});

analysesRouter.put("/:gameId", async (req, res) => {
  const db = await getDb();
  const game = db.data.games.find(g => g.id === req.params.gameId);
  if (!game) return res.status(404).json({ error: "game_not_found" });
  if (!userCanSeeGame(game, req.user)) return res.status(403).json({ error: "forbidden" });

  const body = req.body || {};
  const summary = typeof body.summary === "string" ? body.summary.slice(0, 4000) : "";
  const notes = Array.isArray(body.notes)
    ? body.notes
        .filter(n => n && typeof n === "object" && Number.isInteger(n.ply))
        .slice(0, 1000)
        .map(n => ({
          ply: n.ply,
          comment: typeof n.comment === "string" ? n.comment.slice(0, 2000) : "",
          evalCp: typeof n.evalCp === "number" ? n.evalCp : null,
          bestMove: typeof n.bestMove === "string" ? n.bestMove.slice(0, 16) : null,
        }))
    : [];

  const now = new Date().toISOString();
  let analysis = db.data.analyses.find(
    a => a.gameId === req.params.gameId && a.userId === req.user.id,
  );
  if (analysis) {
    analysis.summary = summary;
    analysis.notes = notes;
    analysis.updatedAt = now;
  } else {
    analysis = {
      id: newId(),
      gameId: req.params.gameId,
      userId: req.user.id,
      summary,
      notes,
      createdAt: now,
      updatedAt: now,
    };
    db.data.analyses.push(analysis);
  }
  await persist();
  res.json({ analysis });
});
