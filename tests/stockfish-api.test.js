import test from "node:test";
import assert from "node:assert/strict";

import {
  createGameState,
  applyMoveWithRules,
  getAllLegalMoves,
  isInCheck,
} from "../chess-rules.js";
import { createInitialBoard } from "../chess-core.js";
import { getStockfishMove } from "../stockfish-api.js";

// Force the API path to fail so we exercise the local fallback engine, where
// move legality is fully under our control.
function withFailingFetch(fn) {
  return async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error("network disabled for test"); };
    try {
      await fn();
    } finally {
      globalThis.fetch = originalFetch;
    }
  };
}

// ── Regression: engine must never play moves that ignore check ──────────────
// Reproduces the Scholar's Mate scenario reported by users: at very low Elo
// the engine used to pick a random pseudo-legal move which could ignore an
// existing check, corrupting the game state and letting play continue past
// what should be checkmate.
test("getStockfishMove never returns an illegal move at very low Elo (scholar's mate path)", withFailingFetch(async () => {
  let board = createInitialBoard();
  let gs = createGameState();

  // 1. e4 Na6  2. Bc4 f5  3. Qh5+
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 6, c: 4, tr: 4, tc: 4 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 1, tr: 2, tc: 0 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 5, tr: 4, tc: 2 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 1, c: 5, tr: 3, tc: 5 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 3, tr: 3, tc: 7 }, gs));

  // Black is in check. Run many low-Elo move requests; every move must be legal.
  const legal = getAllLegalMoves(board, "b", gs);
  const legalKey = (m) => `${m.r},${m.c}->${m.tr},${m.tc}`;
  const legalSet = new Set(legal.map(legalKey));

  for (let i = 0; i < 50; i++) {
    const move = await getStockfishMove(board, "b", 200, gs);
    assert.ok(move, "engine should return a move when legal moves exist");
    assert.ok(legalSet.has(legalKey(move)),
      `engine returned non-legal move at 200 Elo: ${legalKey(move)}`);

    const { board: afterMove } = applyMoveWithRules(board, move, gs);
    assert.ok(!isInCheck(afterMove, "b"),
      "engine move must resolve the check on the black king");
  }
}));

test("getStockfishMove returns null when the side to move has no legal moves (checkmate)", withFailingFetch(async () => {
  let board = createInitialBoard();
  let gs = createGameState();

  // Classic Scholar's Mate: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 6, c: 4, tr: 4, tc: 4 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 1, c: 4, tr: 3, tc: 4 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 5, tr: 4, tc: 2 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 1, tr: 2, tc: 2 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 3, tr: 3, tc: 7 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 6, tr: 2, tc: 5 }, gs));
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 3, c: 7, tr: 1, tc: 5 }, gs));

  // Black is checkmated — engine must report no move so the UI can end the game
  // rather than fabricating an (illegal) reply.
  const move = await getStockfishMove(board, "b", 200, gs);
  assert.equal(move, null, "engine must return null when the side to move is checkmated");
}));

// Sets up the user-reported pin scenario: a black pawn on e7 is pinned to the
// black king on e8 by a white rook on e1, with the white queen sitting on d6
// as a tempting capture target.  Returns { board, gameState }.
function pinnedPawnPosition() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][4] = "bK";   // e8 — black king
  board[1][4] = "bP";   // e7 — pinned pawn
  board[2][3] = "wQ";   // d6 — white queen, pretend target
  board[7][4] = "wR";   // e1 — pinning rook
  board[7][0] = "wK";   // a1 — white king
  board[0][0] = "bR";   // a8 — black rook (give black non-zero legal moves)

  const gs = createGameState();
  gs.castlingRights = { wK: false, wQ: false, bK: false, bQ: false };
  return { board, gs };
}

// ── Regression: applyMoveWithRules must reject pin-violating moves ──────────
// User-reported scenario: a pinned pawn (e7 pinned to e8 king by white rook
// on the e-file) must not be applicable as a diagonal capture (exd6) because
// that exposes the king.  Even if some external code path tries to apply the
// move, applyMoveWithRules must refuse and return the original state.
test("applyMoveWithRules refuses to apply a pin-violating pawn capture", () => {
  const { board, gs } = pinnedPawnPosition();

  // Pre-conditions: black is not in check.
  assert.ok(!isInCheck(board, "b"), "Black not in check before move");

  // Pin-violating attempt: e7 pawn captures on d6.
  const exd6 = { r: 1, c: 4, tr: 2, tc: 3 };
  const result = applyMoveWithRules(board, exd6, gs);

  // Must be flagged illegal and leave the position unchanged.
  assert.equal(result.illegal, true, "applyMoveWithRules must mark pin-violating move as illegal");
  assert.equal(result.board, board, "board reference must be the original on illegal");
  assert.equal(result.gameState, gs, "gameState reference must be the original on illegal");
  assert.equal(result.board[1][4], "bP", "e7 pawn must still be on its square");
  assert.equal(result.board[2][3], "wQ", "white queen on d6 must be untouched");

  // The legal-moves list must also exclude this move.
  const legal = getAllLegalMoves(board, "b", gs);
  const hasIllegal = legal.some(m => m.r === 1 && m.c === 4 && m.tr === 2 && m.tc === 3);
  assert.ok(!hasIllegal, "exd6 must not appear in getAllLegalMoves");
});

// ── Regression: engine never returns a pin-violating move ────────────────────
// Defense-in-depth: even if the local fallback or Stockfish API somehow tried
// to play exd6 in the position above, getStockfishMove must filter it out.
// This is independent of Elo — it must hold at every rating.
test("getStockfishMove never returns a pin-violating move (any Elo)", withFailingFetch(async () => {
  const { board, gs } = pinnedPawnPosition();

  const legal = getAllLegalMoves(board, "b", gs);
  const legalKey = (m) => `${m.r},${m.c}->${m.tr},${m.tc}`;
  const legalSet = new Set(legal.map(legalKey));

  // Cover every Elo level the UI can pick — the guarantee is rating-independent.
  for (const rating of [200, 400, 600, 800, 1000, 1200, 1500, 2000, 3000]) {
    for (let i = 0; i < 25; i++) {
      const move = await getStockfishMove(board, "b", rating, gs);
      assert.ok(move, `engine must return a move at rating ${rating}`);
      assert.ok(legalSet.has(legalKey(move)),
        `engine returned non-legal move at rating ${rating}: ${legalKey(move)}`);

      const after = applyMoveWithRules(board, move, gs);
      assert.ok(!after.illegal, `applyMoveWithRules accepted engine move at rating ${rating}`);
      assert.ok(!isInCheck(after.board, "b"),
        `engine move at rating ${rating} must not leave black king in check`);
    }
  }
}));
