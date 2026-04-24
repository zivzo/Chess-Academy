import test from "node:test";
import assert from "node:assert/strict";

import {
  START,
  createInitialBoard,
  getLegalMoves,
  applyLocalMove,
  applyMoves,
  OPENINGS,
  CONCEPTS,
  QUIZZES,
  generatePseudoLegalMoves,
  evaluateBoard,
  getEngineRecommendation,
  applyBoardMove,
  formatMove,
} from "../chess-core.js";

import {
  boardToFEN,
  parseUCIMove,
  moveToUCI,
  ratingToDepth,
  MIN_ENGINE_RATING,
  MAX_ENGINE_RATING,
} from "../stockfish-api.js";

test("applyMoves returns an untouched copy of the initial board for empty input", () => {
  const board = applyMoves([]);
  assert.deepEqual(board, START);
  assert.notStrictEqual(board, START);
  for (let i = 0; i < START.length; i += 1) {
    assert.notStrictEqual(board[i], START[i]);
  }
});

test("createInitialBoard returns a deep-cloned starting board", () => {
  const board = createInitialBoard();
  assert.deepEqual(board, START);
  assert.notStrictEqual(board, START);
  for (let i = 0; i < START.length; i += 1) {
    assert.notStrictEqual(board[i], START[i]);
  }
});

test("applyMoves applies sequential moves to expected destination squares", () => {
  const board = applyMoves([
    { r: 6, c: 4, tr: 4, tc: 4 }, // e2 -> e4
    { r: 1, c: 3, tr: 3, tc: 3 }, // d7 -> d5
    { r: 4, c: 4, tr: 3, tc: 3 }, // e4 x d5
  ]);

  assert.equal(board[3][3], "wP");
  assert.equal(board[6][4], null);
  assert.equal(board[1][3], null);
});

test("applyMoves does not mutate START after moves are applied", () => {
  void applyMoves([{ r: 6, c: 0, tr: 4, tc: 0 }]);
  assert.equal(START[6][0], "wP");
  assert.equal(START[4][0], null);
});

test("getLegalMoves returns expected movement for pawns and knights", () => {
  const board = createInitialBoard();
  assert.deepEqual(getLegalMoves(board, 6, 4), [[5, 4], [4, 4]]);
  assert.deepEqual(getLegalMoves(board, 7, 6), [[5, 5], [5, 7]]);
});

test("getLegalMoves blocks sliding pieces behind friendly pawns", () => {
  const board = createInitialBoard();
  assert.deepEqual(getLegalMoves(board, 7, 2), []);
  assert.deepEqual(getLegalMoves(board, 7, 0), []);
});

test("applyLocalMove moves pieces without mutating input board", () => {
  const board = createInitialBoard();
  const moved = applyLocalMove(board, { r: 6, c: 4 }, { r: 4, c: 4 });

  assert.equal(moved[4][4], "wP");
  assert.equal(moved[6][4], null);
  assert.equal(board[6][4], "wP");
  assert.equal(board[4][4], null);
});

test("applyLocalMove promotes pawns to queens", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[1][0] = "wP";
  board[6][1] = "bP";
  const movedWhite = applyLocalMove(board, { r: 1, c: 0 }, { r: 0, c: 0 });
  const movedBlack = applyLocalMove(board, { r: 6, c: 1 }, { r: 7, c: 1 });
  assert.equal(movedWhite[0][0], "wQ");
  assert.equal(movedBlack[7][1], "bQ");
});

test("OPENINGS have consistent move/position progression and valid board shapes", () => {
  assert.equal(OPENINGS.length, 4);
  for (const opening of OPENINGS) {
    assert.equal(opening.positions.length, opening.moves.length + 1);
    for (const position of opening.positions) {
      assert.equal(position.board.length, 8);
      for (const rank of position.board) {
        assert.equal(rank.length, 8);
      }
      for (const [r, c] of position.highlight) {
        assert.ok(r >= 0 && r < 8);
        assert.ok(c >= 0 && c < 8);
      }
    }
  }
});

test("CONCEPTS and QUIZZES contain complete instructional content", () => {
  assert.equal(CONCEPTS.length, 12);
  for (const concept of CONCEPTS) {
    assert.ok(concept.title.length > 0);
    assert.ok(concept.desc.length > 0);
    assert.equal(concept.tag, "mid");
  }

  assert.equal(QUIZZES.length, 6);
  for (const quiz of QUIZZES) {
    assert.ok(quiz.q.length > 0);
    assert.ok(quiz.explanation.length > 0);
    assert.ok(Array.isArray(quiz.opts));
    assert.ok(quiz.opts.length >= 2);
    assert.ok(quiz.correct >= 0 && quiz.correct < quiz.opts.length);
  }
});


test("generatePseudoLegalMoves provides standard opening mobility", () => {
  const whiteMoves = generatePseudoLegalMoves(START, "w");
  const blackMoves = generatePseudoLegalMoves(START, "b");
  assert.equal(whiteMoves.length, 20);
  assert.equal(blackMoves.length, 20);
});

test("getEngineRecommendation prioritizes winning material", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[7][4] = "wK";
  board[0][4] = "bK";
  board[4][3] = "wQ";
  board[3][3] = "bR";
  board[4][7] = "bQ";

  const rec = getEngineRecommendation(board, "w");
  assert.ok(rec);
  assert.deepEqual({ r: rec.r, c: rec.c, tr: rec.tr, tc: rec.tc }, { r: 4, c: 3, tr: 4, tc: 7 });
  assert.equal(formatMove(rec), "d4→h4");
  const next = applyBoardMove(board, rec);
  assert.ok(evaluateBoard(next) > evaluateBoard(board));
});

// ── Stockfish API module tests ───────────────────────────────────────────────

test("boardToFEN produces correct FEN for the starting position", () => {
  const fen = boardToFEN(START, "w");
  assert.equal(fen, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
});

test("boardToFEN handles a position after 1.e4", () => {
  const board = applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }]);
  const fen = boardToFEN(board, "b");
  assert.equal(fen, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
});

test("boardToFEN shows no castling rights when kings are not on starting squares", () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[6][4] = "wK"; // King moved off e1
  board[0][4] = "bK";
  const fen = boardToFEN(board, "w");
  assert.ok(fen.includes(" - "), "Should contain '-' for no castling");
  // Only black should have partial rights
  assert.match(fen, /\s[kq-]+\s/);
});

test("parseUCIMove converts standard UCI moves correctly", () => {
  assert.deepEqual(parseUCIMove("e2e4"), { r: 6, c: 4, tr: 4, tc: 4 });
  assert.deepEqual(parseUCIMove("a7a8"), { r: 1, c: 0, tr: 0, tc: 0 });
  assert.deepEqual(parseUCIMove("h1h8"), { r: 7, c: 7, tr: 0, tc: 7 });
});

test("parseUCIMove handles promotion suffix", () => {
  const move = parseUCIMove("e7e8q");
  assert.deepEqual(move, { r: 1, c: 4, tr: 0, tc: 4, promotion: "q" });
});

test("moveToUCI converts internal moves to UCI strings", () => {
  assert.equal(moveToUCI({ r: 6, c: 4, tr: 4, tc: 4 }), "e2e4");
  assert.equal(moveToUCI({ r: 0, c: 4, tr: 0, tc: 6 }), "e8g8");
});

test("parseUCIMove and moveToUCI are inverse operations", () => {
  const uciMoves = ["e2e4", "d7d5", "g1f3", "b8c6", "a1a8"];
  for (const uci of uciMoves) {
    const parsed = parseUCIMove(uci);
    assert.equal(moveToUCI(parsed), uci);
  }
});

test("ratingToDepth maps boundary values correctly", () => {
  assert.equal(ratingToDepth(MIN_ENGINE_RATING), 1);   // 200 → depth 1
  assert.equal(ratingToDepth(MAX_ENGINE_RATING), 15);   // 3000 → depth 15
});

test("ratingToDepth produces increasing depths for increasing ratings", () => {
  let prevDepth = 0;
  for (let rating = 200; rating <= 3000; rating += 200) {
    const depth = ratingToDepth(rating);
    assert.ok(depth >= prevDepth, `Depth should not decrease: rating ${rating} → depth ${depth}`);
    prevDepth = depth;
  }
});

test("ratingToDepth clamps values outside the valid range", () => {
  assert.equal(ratingToDepth(0), 1);      // Below minimum
  assert.equal(ratingToDepth(5000), 15);   // Above maximum
});

