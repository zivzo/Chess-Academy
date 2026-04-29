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
