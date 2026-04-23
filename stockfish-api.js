/**
 * Stockfish API integration module.
 *
 * Connects to the stockfish.online REST API to provide real Stockfish engine
 * analysis for arbitrary chess positions. Features include:
 *
 *  - **Rating-based strength control (200–3000 Elo):** maps the selected
 *    rating to a Stockfish search depth and injects deliberate randomness at
 *    lower strengths so the engine feels like a real opponent at any level.
 *
 *  - **Automatic fallback:** when the API is unreachable the module silently
 *    falls back to the built-in 1-ply material evaluator so the game never
 *    freezes.
 *
 * @module stockfish-api
 */

import {
  generatePseudoLegalMoves,
  getAllLegalMoves,
  applyBoardMove,
  evaluateBoard,
} from "./chess-core.js";

// ── Constants ────────────────────────────────────────────────────────────────

/** stockfish.online REST endpoint */
const STOCKFISH_API_URL = "https://stockfish.online/api/s/v2.php";

/** File labels used for algebraic / UCI notation (a–h). */
const FILES = "abcdefgh";

/** Default engine rating when none is explicitly selected. */
export const DEFAULT_ENGINE_RATING = 1500;

/** Lowest selectable engine rating. */
export const MIN_ENGINE_RATING = 200;

/** Highest selectable engine rating. */
export const MAX_ENGINE_RATING = 3000;

// ── FEN conversion ───────────────────────────────────────────────────────────

/**
 * Maps internal piece codes (e.g. "wK", "bP") to standard FEN characters.
 * @type {Record<string, string>}
 */
const PIECE_TO_FEN = {
  wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
  bK: "k", bQ: "q", bR: "r", bB: "b", bN: "n", bP: "p",
};

/**
 * Converts the internal 8×8 board array to a FEN string.
 *
 * Castling rights are inferred by checking whether the kings and rooks still
 * sit on their starting squares.  En-passant and half-move clock are not
 * tracked by the app, so they default to "-" and "0" respectively.
 *
 * @param {(string|null)[][]} board - 8×8 board (row 0 = rank 8).
 * @param {"w"|"b"} turn           - Side to move.
 * @returns {string} A standard FEN string.
 *
 * @example
 *   boardToFEN(START, "w")
 *   // "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
 */
export function boardToFEN(board, turn) {
  const ranks = [];

  for (let r = 0; r < 8; r++) {
    let rank = "";
    let empty = 0;

    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        if (empty > 0) { rank += empty; empty = 0; }
        rank += PIECE_TO_FEN[piece];
      } else {
        empty++;
      }
    }

    if (empty > 0) rank += empty;
    ranks.push(rank);
  }

  // Simplified castling: assume rights exist if king + rook are on start squares.
  let castling = "";
  if (board[7][4] === "wK") {
    if (board[7][7] === "wR") castling += "K";
    if (board[7][0] === "wR") castling += "Q";
  }
  if (board[0][4] === "bK") {
    if (board[0][7] === "bR") castling += "k";
    if (board[0][0] === "bR") castling += "q";
  }
  if (!castling) castling = "-";

  return `${ranks.join("/")} ${turn} ${castling} - 0 1`;
}

// ── UCI move parsing ─────────────────────────────────────────────────────────

/**
 * Converts a UCI move string (e.g. "e2e4") into the app's internal move
 * format `{ r, c, tr, tc }`.
 *
 * Also handles pawn-promotion suffixes (e.g. "e7e8q").
 *
 * @param {string} uci - UCI move string.
 * @returns {{ r: number, c: number, tr: number, tc: number, promotion?: string }}
 *
 * @example
 *   parseUCIMove("e2e4")  // { r: 6, c: 4, tr: 4, tc: 4 }
 *   parseUCIMove("e7e8q") // { r: 1, c: 4, tr: 0, tc: 4, promotion: "q" }
 */
export function parseUCIMove(uci) {
  const fromFile = uci.charCodeAt(0) - 97; // 'a' → 0
  const fromRank = 8 - Number(uci[1]);     // '2' → row 6
  const toFile   = uci.charCodeAt(2) - 97;
  const toRank   = 8 - Number(uci[3]);

  const move = { r: fromRank, c: fromFile, tr: toRank, tc: toFile };

  if (uci.length === 5) {
    move.promotion = uci[4];
  }

  return move;
}

/**
 * Converts an internal move `{ r, c, tr, tc }` to a UCI string (e.g. "e2e4").
 *
 * @param {{ r: number, c: number, tr: number, tc: number }} move
 * @returns {string}
 */
export function moveToUCI(move) {
  return `${FILES[move.c]}${8 - move.r}${FILES[move.tc]}${8 - move.tr}`;
}

// ── Rating → depth mapping ──────────────────────────────────────────────────

/**
 * Maps a user-facing engine rating (200–3000) to a Stockfish search depth.
 *
 * The relationship is linear:
 *   depth = clamp(1, 15, round((rating − 200) / 200) + 1)
 *
 * | Rating | Depth |
 * |--------|-------|
 * |    200 |     1 |
 * |    600 |     3 |
 * |   1000 |     5 |
 * |   1500 |     8 |
 * |   2000 |    10 |
 * |   3000 |    15 |
 *
 * @param {number} rating - Engine rating (200–3000).
 * @returns {number} Stockfish search depth (1–15).
 */
export function ratingToDepth(rating) {
  const clamped = Math.max(MIN_ENGINE_RATING, Math.min(MAX_ENGINE_RATING, rating));
  return Math.max(1, Math.min(15, Math.round((clamped - 200) / 200) + 1));
}

// ── Stockfish API call ───────────────────────────────────────────────────────

/**
 * Calls the stockfish.online API to evaluate a position and return the best
 * move.
 *
 * @param {string} fen   - FEN string of the position.
 * @param {number} depth - Stockfish search depth (1–15).
 * @returns {Promise<{ bestmove: string, evaluation: number|null, mate: number|null }>}
 * @throws {Error} On HTTP errors or if the API response cannot be parsed.
 */
export async function fetchStockfishMove(fen, depth) {
  const params = new URLSearchParams({ fen, depth: String(depth) });
  const response = await fetch(`${STOCKFISH_API_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Stockfish API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error("Stockfish API returned an unsuccessful response");
  }

  // The API returns e.g. "bestmove e2e4 ponder d7d5" — extract the move.
  const match = data.bestmove?.match(/^bestmove\s+(\S+)/);
  if (!match) {
    throw new Error("Could not parse bestmove from API response");
  }

  return {
    bestmove: match[1],
    evaluation: data.evaluation ?? null,
    mate: data.mate ?? null,
  };
}

// ── Weakness simulation ──────────────────────────────────────────────────────

/**
 * Simulates human-like mistakes for lower engine ratings by randomly
 * replacing the best move with a legal (but sub-optimal) alternative.
 *
 * At rating ≥ 1500 the engine always plays its best move.
 * Below 1500 there is an increasing probability of a random move:
 *   mistakeChance = (1500 − rating) / 1500
 *
 * @param {{ r:number, c:number, tr:number, tc:number }} bestMove
 * @param {{ r:number, c:number, tr:number, tc:number }[]} allMoves
 * @param {number} rating - Engine rating (200–3000).
 * @returns {{ r:number, c:number, tr:number, tc:number }}
 */
function applyWeakness(bestMove, allMoves, rating) {
  if (rating >= 1500 || allMoves.length <= 1) return bestMove;

  const mistakeChance = (1500 - rating) / 1500;
  if (Math.random() < mistakeChance) {
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  return bestMove;
}

// ── Local fallback engine ────────────────────────────────────────────────────

/**
 * Simple 1-ply material evaluator used as a fallback when the Stockfish API
 * is unreachable.  Picks the move that maximises material for the given side.
 *
 * @param {(string|null)[][]} board
 * @param {"w"|"b"} side
 * @param {object} [gameState] - Game state for legal move generation.
 * @returns {{ r:number, c:number, tr:number, tc:number, evaluation:number }|null}
 */
function localEngineFallback(board, side, gameState) {
  const moves = gameState
    ? getAllLegalMoves(board, side, gameState)
    : generatePseudoLegalMoves(board, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const nextBoard = applyBoardMove(board, move);
    const raw = evaluateBoard(nextBoard);
    const score = side === "w" ? raw : -raw;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    ...bestMove,
    evaluation: evaluateBoard(applyBoardMove(board, bestMove)),
  };
}

// ── Main entry points ────────────────────────────────────────────────────────

/**
 * Returns the engine's next move for the current position and strength.
 *
 * Flow:
 *  1. Convert board to FEN.
 *  2. Call the Stockfish API at a depth determined by {@link ratingToDepth}.
 *  3. For low ratings, optionally replace the best move with a random legal
 *     move (via {@link applyWeakness}).
 *  4. Fall back to the local 1-ply engine if the API is unreachable.
 *
 * @param {(string|null)[][]} board  - 8×8 board array.
 * @param {"w"|"b"} side            - Side to move.
 * @param {number}  [rating=1500]   - Engine strength (200–3000 Elo).
 * @param {object}  [gameState]     - Game state for legal move generation.
 * @returns {Promise<{ r:number, c:number, tr:number, tc:number, evaluation:number, source:string }|null>}
 */
export async function getStockfishMove(board, side, rating = DEFAULT_ENGINE_RATING, gameState) {
  const allMoves = gameState
    ? getAllLegalMoves(board, side, gameState)
    : generatePseudoLegalMoves(board, side);
  if (allMoves.length === 0) return null;

  try {
    const fen   = boardToFEN(board, side);
    const depth = ratingToDepth(rating);
    const result = await fetchStockfishMove(fen, depth);
    const bestMove = parseUCIMove(result.bestmove);

    const finalMove = applyWeakness(bestMove, allMoves, rating);

    // Use the API evaluation when playing the best move; otherwise recompute.
    const evaluation =
      finalMove === bestMove && result.evaluation !== null
        ? result.evaluation / 100   // API returns centipawns → convert to pawns
        : evaluateBoard(applyBoardMove(board, finalMove));

    return { ...finalMove, evaluation, source: "stockfish" };
  } catch {
    // API unavailable — fall back to local engine.
    const fallback = localEngineFallback(board, side, gameState);
    if (!fallback) return null;

    const finalMove = applyWeakness(fallback, allMoves, rating);
    const evaluation = evaluateBoard(applyBoardMove(board, finalMove));

    return { ...finalMove, evaluation, source: "local" };
  }
}

/**
 * Returns a full-strength Stockfish analysis for the Analysis tab.
 *
 * Always uses depth 15 (maximum) regardless of the selected engine rating,
 * because analysis should show the objectively best move.
 *
 * @param {(string|null)[][]} board - 8×8 board array.
 * @param {"w"|"b"} side           - Side to move.
 * @param {object}  [gameState]    - Game state for legal move generation.
 * @returns {Promise<{ move:{r,c,tr,tc}, evaluation:number, mate:number|null, source:string }|null>}
 */
export async function getStockfishAnalysis(board, side, gameState) {
  const allMoves = gameState
    ? getAllLegalMoves(board, side, gameState)
    : generatePseudoLegalMoves(board, side);
  if (allMoves.length === 0) return null;

  try {
    const fen    = boardToFEN(board, side);
    const result = await fetchStockfishMove(fen, 15);
    const move   = parseUCIMove(result.bestmove);

    return {
      move,
      evaluation: result.evaluation !== null ? result.evaluation / 100 : 0,
      mate: result.mate,
      source: "stockfish",
    };
  } catch {
    const fallback = localEngineFallback(board, side, gameState);
    if (!fallback) return null;

    return {
      move: { r: fallback.r, c: fallback.c, tr: fallback.tr, tc: fallback.tc },
      evaluation: fallback.evaluation,
      mate: null,
      source: "local",
    };
  }
}
