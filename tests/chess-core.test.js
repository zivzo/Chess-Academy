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
} from "../chess-core.js";

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
  const moved = applyLocalMove(board, { r: 1, c: 0 }, { r: 0, c: 0 });
  assert.equal(moved[0][0], "wQ");
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
