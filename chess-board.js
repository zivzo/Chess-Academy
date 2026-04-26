// ── Chess Board Utilities ─────────────────────────────────────────────────────
// Board constants, move generation (simplified / pseudo-legal), board
// manipulation helpers, and material evaluation.

import { getAllLegalMoves, applyMoveWithRules } from "./chess-rules.js";

// ── Chess pieces unicode map ────────────────────────────────────────────────
export const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

// ── Starting position ───────────────────────────────────────────────────────
export const START = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

export function createInitialBoard() {
  return START.map((row) => [...row]);
}

function isInsideBoard(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isEnemy(piece, color) {
  return piece && piece[0] !== color;
}

// ── Local play helpers ────────────────────────────────────────────────────────
export function getLegalMoves(board, r, c) {
  if (!isInsideBoard(r, c)) return [];
  const piece = board[r][c];
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];
  const moves = [];

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const oneStep = r + dir;
    const twoStep = r + dir * 2;

    if (isInsideBoard(oneStep, c) && !board[oneStep][c]) {
      moves.push([oneStep, c]);
      if (r === startRow && isInsideBoard(twoStep, c) && !board[twoStep][c]) {
        moves.push([twoStep, c]);
      }
    }

    for (const dc of [-1, 1]) {
      const tr = r + dir;
      const tc = c + dc;
      if (isInsideBoard(tr, tc) && isEnemy(board[tr][tc], color)) {
        moves.push([tr, tc]);
      }
    }
    return moves;
  }

  if (type === "N") {
    const deltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of deltas) {
      const tr = r + dr;
      const tc = c + dc;
      if (!isInsideBoard(tr, tc)) continue;
      if (!board[tr][tc] || isEnemy(board[tr][tc], color)) {
        moves.push([tr, tc]);
      }
    }
    return moves;
  }

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const tr = r + dr;
        const tc = c + dc;
        if (!isInsideBoard(tr, tc)) continue;
        if (!board[tr][tc] || isEnemy(board[tr][tc], color)) {
          moves.push([tr, tc]);
        }
      }
    }
    return moves;
  }

  const directions = [];
  if (type === "B" || type === "Q") {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  }
  if (type === "R" || type === "Q") {
    directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
  }

  for (const [dr, dc] of directions) {
    let tr = r + dr;
    let tc = c + dc;
    while (isInsideBoard(tr, tc)) {
      if (!board[tr][tc]) {
        moves.push([tr, tc]);
      } else {
        if (isEnemy(board[tr][tc], color)) moves.push([tr, tc]);
        break;
      }
      tr += dr;
      tc += dc;
    }
  }

  return moves;
}

export function applyLocalMove(board, from, to) {
  const next = board.map((row) => [...row]);
  const moving = next[from.r][from.c];
  if (!moving) return next;

  next[to.r][to.c] = moving;
  next[from.r][from.c] = null;

  // Promote pawn when it reaches the opposite end of the board.
  const shouldPromote =
    (moving[0] === "w" && to.r === 0) ||
    (moving[0] === "b" && to.r === 7);
  if (moving[1] === "P" && shouldPromote) {
    next[to.r][to.c] = `${moving[0]}Q`;
  }

  return next;
}

// ── Apply moves helper (simplified) ────────────────────────────────────────
export function applyMoves(moves) {
  const board = createInitialBoard();
  for (const m of moves) {
    const piece = board[m.r][m.c];
    board[m.tr][m.tc] = piece;
    board[m.r][m.c] = null;
  }
  return board;
}

export function cloneBoard(board) {
  return board.map(rank => [...rank]);
}

export function applyBoardMove(board, move) {
  const next = cloneBoard(board);
  next[move.tr][move.tc] = next[move.r][move.c];
  next[move.r][move.c] = null;
  return next;
}

const PIECE_VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const KNIGHT_DELTAS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];
const FILES = "abcdefgh";

function isInside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isOpponent(piece, side) {
  return piece && piece[0] !== side;
}

export function evaluateBoard(board) {
  let score = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece[1]] ?? 0;
      score += piece[0] === "w" ? value : -value;
    }
  }
  return score;
}

export function generatePseudoLegalMoves(board, side) {
  const moves = [];

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = board[r][c];
      if (!piece || piece[0] !== side) continue;
      const kind = piece[1];

      if (kind === "P") {
        const dir = side === "w" ? -1 : 1;
        const startRank = side === "w" ? 6 : 1;
        const oneStep = r + dir;
        if (isInside(oneStep, c) && !board[oneStep][c]) {
          moves.push({ r, c, tr: oneStep, tc: c });
          const twoStep = r + (2 * dir);
          if (r === startRank && !board[twoStep][c]) {
            moves.push({ r, c, tr: twoStep, tc: c });
          }
        }
        for (const dc of [-1, 1]) {
          const tr = r + dir;
          const tc = c + dc;
          if (isInside(tr, tc) && board[tr][tc] && isOpponent(board[tr][tc], side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      if (kind === "N") {
        for (const [dr, dc] of KNIGHT_DELTAS) {
          const tr = r + dr;
          const tc = c + dc;
          if (!isInside(tr, tc)) continue;
          const target = board[tr][tc];
          if (!target || isOpponent(target, side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      if (kind === "K") {
        for (const [dr, dc] of KING_DELTAS) {
          const tr = r + dr;
          const tc = c + dc;
          if (!isInside(tr, tc)) continue;
          const target = board[tr][tc];
          if (!target || isOpponent(target, side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      const directions = [];
      if (kind === "B" || kind === "Q") directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (kind === "R" || kind === "Q") directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of directions) {
        let tr = r + dr;
        let tc = c + dc;
        while (isInside(tr, tc)) {
          const target = board[tr][tc];
          if (!target) {
            moves.push({ r, c, tr, tc });
          } else {
            if (isOpponent(target, side)) {
              moves.push({ r, c, tr, tc });
            }
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    }
  }

  return moves;
}

export function getEngineRecommendation(board, side, gameState) {
  const moves = gameState
    ? getAllLegalMoves(board, side, gameState)
    : generatePseudoLegalMoves(board, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestPerspectiveScore = -Infinity;
  let bestRawScore = 0;

  for (const move of moves) {
    const nextBoard = gameState
      ? applyMoveWithRules(board, move, gameState).board
      : applyBoardMove(board, move);
    const score = evaluateBoard(nextBoard);
    const perspectiveScore = side === "w" ? score : -score;
    if (perspectiveScore > bestPerspectiveScore) {
      bestPerspectiveScore = perspectiveScore;
      bestRawScore = score;
      bestMove = move;
    }
  }

  return { ...bestMove, evaluation: bestRawScore };
}

export function formatMove(move) {
  return `${FILES[move.c]}${8 - move.r}→${FILES[move.tc]}${8 - move.tr}`;
}
