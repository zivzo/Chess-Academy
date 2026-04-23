import test from "node:test";
import assert from "node:assert/strict";

import {
  createGameState,
  isSquareAttacked,
  findKing,
  isInCheck,
  getLegalMovesWithRules,
  getAllLegalMoves,
  applyMoveWithRules,
  getGameStatus,
} from "../chess-rules.js";

import { createInitialBoard, START } from "../chess-core.js";

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

// ── isSquareAttacked ─────────────────────────────────────────────────────────
test("isSquareAttacked detects pawn attacks", () => {
  const board = emptyBoard();
  board[4][4] = "wP";
  // White pawn on e4 attacks d5 and f5
  assert.ok(isSquareAttacked(board, 3, 3, "w"));
  assert.ok(isSquareAttacked(board, 3, 5, "w"));
  assert.ok(!isSquareAttacked(board, 3, 4, "w")); // not straight ahead
});

test("isSquareAttacked detects knight attacks", () => {
  const board = emptyBoard();
  board[4][4] = "bN";
  assert.ok(isSquareAttacked(board, 2, 3, "b"));
  assert.ok(isSquareAttacked(board, 2, 5, "b"));
  assert.ok(isSquareAttacked(board, 6, 3, "b"));
  assert.ok(!isSquareAttacked(board, 4, 5, "b"));
});

test("isSquareAttacked detects sliding piece attacks", () => {
  const board = emptyBoard();
  board[0][0] = "wR";
  assert.ok(isSquareAttacked(board, 0, 7, "w")); // same rank
  assert.ok(isSquareAttacked(board, 7, 0, "w")); // same file
  assert.ok(!isSquareAttacked(board, 3, 3, "w")); // diagonal - rook can't

  board[3][3] = "wB";
  assert.ok(isSquareAttacked(board, 5, 5, "w")); // diagonal
  assert.ok(!isSquareAttacked(board, 3, 5, "w")); // straight - bishop can't
});

test("isSquareAttacked is blocked by pieces", () => {
  const board = emptyBoard();
  board[0][0] = "wR";
  board[0][3] = "wP"; // blocks rook
  assert.ok(!isSquareAttacked(board, 0, 5, "w"));
  assert.ok(isSquareAttacked(board, 0, 3, "w")); // attacks the blocking square
});

// ── findKing ─────────────────────────────────────────────────────────────────
test("findKing finds king position", () => {
  const board = createInitialBoard();
  assert.deepEqual(findKing(board, "w"), { r: 7, c: 4 });
  assert.deepEqual(findKing(board, "b"), { r: 0, c: 4 });
});

// ── isInCheck ────────────────────────────────────────────────────────────────
test("isInCheck detects check correctly", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[0][4] = "bR"; // rook attacking along e-file
  assert.ok(isInCheck(board, "w"));
  assert.ok(!isInCheck(board, "b")); // black king not on board
});

test("isInCheck returns false when not in check", () => {
  const board = createInitialBoard();
  assert.ok(!isInCheck(board, "w"));
  assert.ok(!isInCheck(board, "b"));
});

// ── En passant ───────────────────────────────────────────────────────────────
test("en passant capture is available after double pawn push", () => {
  const board = emptyBoard();
  board[3][4] = "wP"; // white pawn on e5
  board[1][3] = "bP"; // black pawn on d7

  const gs = createGameState();
  // Simulate black's double push d7->d5
  const move = { r: 1, c: 3, tr: 3, tc: 3 };
  const { board: nextBoard, gameState: nextGS } = applyMoveWithRules(board, move, gs);

  assert.deepEqual(nextGS.enPassantSquare, { r: 2, c: 3 }); // d6

  // White should be able to capture en passant
  const whiteMoves = getLegalMovesWithRules(nextBoard, 3, 4, nextGS);
  const epMove = whiteMoves.find((m) => m.tr === 2 && m.tc === 3);
  assert.ok(epMove, "en passant move should be available");
  assert.ok(epMove.enPassant);

  // Apply en passant
  const { board: afterEP } = applyMoveWithRules(nextBoard, epMove, nextGS);
  assert.equal(afterEP[2][3], "wP"); // white pawn on d6
  assert.equal(afterEP[3][3], null); // captured pawn removed
  assert.equal(afterEP[3][4], null); // original square empty
});

test("en passant square is cleared after a non-double-push move", () => {
  const board = emptyBoard();
  board[6][4] = "wP";
  board[0][4] = "bK";
  board[7][4] = "wK";
  board[1][0] = "bP";

  const gs = createGameState();
  // White double push e2->e4 sets en passant
  const { board: b2, gameState: gs2 } = applyMoveWithRules(board, { r: 6, c: 4, tr: 4, tc: 4 }, gs);
  assert.deepEqual(gs2.enPassantSquare, { r: 5, c: 4 });

  // Black makes a normal move (not a double push) — en passant should be cleared
  const { gameState: gs3 } = applyMoveWithRules(b2, { r: 0, c: 4, tr: 1, tc: 4 }, gs2);
  assert.equal(gs3.enPassantSquare, null);
});

// ── Castling ─────────────────────────────────────────────────────────────────
test("castling kingside is available from starting position with clear path", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][7] = "wR";
  board[0][4] = "bK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const castleMove = moves.find((m) => m.castling === "K");
  assert.ok(castleMove, "kingside castling should be available");
  assert.equal(castleMove.tr, 7);
  assert.equal(castleMove.tc, 6);

  // Apply castling
  const { board: afterCastle } = applyMoveWithRules(board, castleMove, gs);
  assert.equal(afterCastle[7][6], "wK");
  assert.equal(afterCastle[7][5], "wR");
  assert.equal(afterCastle[7][4], null);
  assert.equal(afterCastle[7][7], null);
});

test("castling queenside is available from starting position with clear path", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][0] = "wR";
  board[0][4] = "bK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const castleMove = moves.find((m) => m.castling === "Q");
  assert.ok(castleMove, "queenside castling should be available");
  assert.equal(castleMove.tr, 7);
  assert.equal(castleMove.tc, 2);

  // Apply castling
  const { board: afterCastle } = applyMoveWithRules(board, castleMove, gs);
  assert.equal(afterCastle[7][2], "wK");
  assert.equal(afterCastle[7][3], "wR");
  assert.equal(afterCastle[7][4], null);
  assert.equal(afterCastle[7][0], null);
});

test("castling is blocked when pieces are in the way", () => {
  const board = createInitialBoard();
  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const castleMoves = moves.filter((m) => m.castling);
  assert.equal(castleMoves.length, 0);
});

test("castling is blocked when king is in check", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][7] = "wR";
  board[0][4] = "bR"; // checking the king along e-file
  board[0][0] = "bK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const castleMoves = moves.filter((m) => m.castling);
  assert.equal(castleMoves.length, 0);
});

test("castling is blocked when passing through attacked square", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][7] = "wR";
  board[0][5] = "bR"; // attacks f1
  board[0][0] = "bK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const castleKS = moves.find((m) => m.castling === "K");
  assert.ok(!castleKS, "kingside castling should be blocked when f1 is attacked");
});

test("castling rights are revoked when king moves", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][7] = "wR";
  board[7][0] = "wR";
  board[0][4] = "bK";

  const gs = createGameState();
  const kingMove = { r: 7, c: 4, tr: 7, tc: 5 };
  const { gameState: gs2 } = applyMoveWithRules(board, kingMove, gs);
  assert.equal(gs2.castlingRights.wK, false);
  assert.equal(gs2.castlingRights.wQ, false);
});

test("castling rights are revoked when rook moves", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[7][7] = "wR";
  board[0][4] = "bK";

  const gs = createGameState();
  const rookMove = { r: 7, c: 7, tr: 7, tc: 6 };
  const { gameState: gs2 } = applyMoveWithRules(board, rookMove, gs);
  assert.equal(gs2.castlingRights.wK, false);
  assert.equal(gs2.castlingRights.wQ, true); // queenside unaffected
});

// ── Check filtering ──────────────────────────────────────────────────────────
test("legal moves do not allow moving into check", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[0][5] = "bR"; // controls f-file

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 7, 4, gs);
  const movesToF = moves.filter((m) => m.tc === 5);
  assert.equal(movesToF.length, 0, "king should not be able to move to f-file");
});

test("piece pinned to king cannot move away", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[6][4] = "wN"; // knight pinned by rook
  board[0][4] = "bR"; // pins the knight

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 6, 4, gs);
  assert.equal(moves.length, 0, "pinned knight should have no legal moves");
});

test("must block or move king when in check", () => {
  const board = emptyBoard();
  board[7][4] = "wK";
  board[0][4] = "bR"; // checking the king
  board[7][0] = "wR"; // could block

  const gs = createGameState();
  const allMoves = getAllLegalMoves(board, "w", gs);
  // All moves should either move the king or block the check
  for (const m of allMoves) {
    const piece = board[m.r][m.c];
    if (piece === "wK") continue;
    // Blocking move must be on e-file between e1 and e8
    assert.equal(m.tc, 4, "blocking piece should move to e-file");
  }
});

// ── Checkmate ────────────────────────────────────────────────────────────────
test("detects checkmate", () => {
  // Scholar's mate / back-rank mate
  const board = emptyBoard();
  board[7][7] = "wK";
  board[0][0] = "bK";
  board[0][6] = "bR"; // rook on g8
  board[1][7] = "bR"; // rook on h7

  const gs = createGameState();
  const status = getGameStatus(board, "w", gs);
  assert.equal(status, "checkmate");
});

test("not checkmate when king can escape", () => {
  const board = emptyBoard();
  board[7][7] = "wK";
  board[0][0] = "bK";
  board[0][7] = "bR"; // checks along h-file

  const gs = createGameState();
  const status = getGameStatus(board, "w", gs);
  assert.notEqual(status, "checkmate");
});

// ── Stalemate ────────────────────────────────────────────────────────────────
test("detects stalemate", () => {
  const board = emptyBoard();
  board[0][0] = "wK";
  board[1][2] = "bQ"; // blocks a1-a2 and a1-b1 escape but doesn't check
  board[2][1] = "bK"; // blocks b1

  const gs = createGameState();
  const status = getGameStatus(board, "w", gs);
  assert.equal(status, "stalemate");
});

// ── Pawn promotion ───────────────────────────────────────────────────────────
test("pawn promotes to queen on reaching last rank", () => {
  const board = emptyBoard();
  board[1][0] = "wP";
  board[7][4] = "wK";
  board[0][4] = "bK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 1, 0, gs);
  const promoMove = moves.find((m) => m.tr === 0 && m.tc === 0);
  assert.ok(promoMove, "promotion move should be available");
  assert.ok(promoMove.promotion);

  const { board: afterPromo } = applyMoveWithRules(board, promoMove, gs);
  assert.equal(afterPromo[0][0], "wQ");
});

// ── Game status in normal play ───────────────────────────────────────────────
test("starting position is 'playing'", () => {
  const board = createInitialBoard();
  const gs = createGameState();
  assert.equal(getGameStatus(board, "w", gs), "playing");
  assert.equal(getGameStatus(board, "b", gs), "playing");
});

test("getAllLegalMoves returns 20 moves for each side at start", () => {
  const board = createInitialBoard();
  const gs = createGameState();
  assert.equal(getAllLegalMoves(board, "w", gs).length, 20);
  assert.equal(getAllLegalMoves(board, "b", gs).length, 20);
});

// ── Black castling ───────────────────────────────────────────────────────────
test("black can castle kingside", () => {
  const board = emptyBoard();
  board[0][4] = "bK";
  board[0][7] = "bR";
  board[7][4] = "wK";

  const gs = createGameState();
  const moves = getLegalMovesWithRules(board, 0, 4, gs);
  const castleMove = moves.find((m) => m.castling === "K");
  assert.ok(castleMove);

  const { board: afterCastle } = applyMoveWithRules(board, castleMove, gs);
  assert.equal(afterCastle[0][6], "bK");
  assert.equal(afterCastle[0][5], "bR");
});

// ── Scholar's Mate ───────────────────────────────────────────────────────
// Reproduces the bug from the issue: after 1.e4 Na6 2.Bc4 f5 3.Qh5+,
// the queen checks the king through the open h5–f7–e8 diagonal.
// The engine must not be allowed to play an illegal move (like Na6–c5)
// that ignores the check, which previously led to the king being captured.
test("Scholar's Mate: Qh5 gives check when f7 pawn has moved, black must respond", () => {
  let board = createInitialBoard();
  let gs = createGameState();

  // 1. e4
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 6, c: 4, tr: 4, tc: 4 }, gs));
  // 1... Na6
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 1, tr: 2, tc: 0 }, gs));
  // 2. Bc4
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 5, tr: 4, tc: 2 }, gs));
  // 2... f5
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 1, c: 5, tr: 3, tc: 5 }, gs));
  // 3. Qh5
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 3, tr: 3, tc: 7 }, gs));

  // Black is now in check (queen on h5 attacks king on e8 via open diagonal)
  assert.ok(isInCheck(board, "b"), "Black king should be in check after Qh5");
  assert.equal(getGameStatus(board, "b", gs), "check");

  // The knight on a6 must NOT be able to move to c5 (doesn't address check)
  const knightMoves = getLegalMovesWithRules(board, 2, 0, gs);
  const nc5 = knightMoves.find(m => m.tr === 4 && m.tc === 2);
  assert.ok(!nc5, "Na6-c5 should be illegal because black is in check");

  // All legal moves for black must resolve the check
  const allBlackMoves = getAllLegalMoves(board, "b", gs);
  assert.ok(allBlackMoves.length > 0, "Black should have at least one legal move");
  for (const move of allBlackMoves) {
    const { board: afterMove } = applyMoveWithRules(board, move, gs);
    assert.ok(!isInCheck(afterMove, "b"),
      `Move from (${move.r},${move.c}) to (${move.tr},${move.tc}) should resolve the check`);
  }
});

test("Scholar's Mate: classic Qxf7# is checkmate", () => {
  let board = createInitialBoard();
  let gs = createGameState();

  // 1. e4
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 6, c: 4, tr: 4, tc: 4 }, gs));
  // 1... e5
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 1, c: 4, tr: 3, tc: 4 }, gs));
  // 2. Bc4
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 5, tr: 4, tc: 2 }, gs));
  // 2... Nc6
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 1, tr: 2, tc: 2 }, gs));
  // 3. Qh5
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 7, c: 3, tr: 3, tc: 7 }, gs));
  // 3... Nf6 (a blunder)
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 0, c: 6, tr: 2, tc: 5 }, gs));
  // 4. Qxf7# (queen captures f7 pawn, protected by bishop on c4)
  ({ board, gameState: gs } = applyMoveWithRules(board, { r: 3, c: 7, tr: 1, tc: 5 }, gs));

  // Black is in checkmate
  assert.equal(getGameStatus(board, "b", gs), "checkmate");
  assert.ok(isInCheck(board, "b"), "Black king should be in check");
  assert.equal(getAllLegalMoves(board, "b", gs).length, 0, "Black should have no legal moves");
});
