// ── Helper: post a finished local / vs-engine game to the backend ──────────
// Used by LocalGamePage and GamePage. Silently no-ops if the user isn't
// logged in (history requires an account) so guest play still works.

import { api } from "./api.js";
import { buildPgn } from "./chessFen.js";

export async function saveFinishedGame({
  user,
  type,                 // "local" | "vs-engine"
  result,               // "1-0" | "0-1" | "1/2-1/2" | "*"
  termination,          // "checkmate" | "stalemate" | "resignation" | "timeout" | ...
  startedAt,
  whiteName,
  blackName,
  userColor,            // for "vs-engine"
  engineRating,         // for "vs-engine"
  sanMoves,             // [string] in order
  uciMoves,             // [string] in order
  fenAfterByPly,        // [string] FENs after each half-move
}) {
  if (!user) return { skipped: true, reason: "not_logged_in" };
  const moves = sanMoves.map((san, i) => ({
    san,
    uci: uciMoves[i] || "",
    fenAfter: fenAfterByPly[i] || "",
  }));
  const pgn = buildPgn({
    white: whiteName, black: blackName, result, date: startedAt,
    sanMoves,
  });
  try {
    const r = await api.post("/api/games", {
      type,
      result,
      termination,
      startedAt,
      pgn,
      moves,
      userColor,
      engineRating,
      timeControl: null,
    });
    return { ok: true, game: r.game };
  } catch (e) {
    return { ok: false, error: e?.code || "save_failed" };
  }
}
