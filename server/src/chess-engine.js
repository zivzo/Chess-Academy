// ── Chess engine wrapper for the server ─────────────────────────────────────
// Imports the same chess-rules.js used by the test suite so the server can
// independently validate every move submitted in an online game.
//
// Adds two helpers the persistence layer needs:
//   - `boardToFen(board, turn, gameState, halfmove, fullmove)` → FEN string
//   - `moveToSan(board, move, gameState)` → SAN-ish string ("Nf3", "exd5", "O-O")
//   - `moveToUci(move)` → UCI string ("e2e4", "e7e8q")

import {
  createGameState,
  applyMoveWithRules,
  getLegalMovesWithRules,
  getAllLegalMoves,
  getGameStatus,
  isInCheck,
} from "../../chess-rules.js";
import { createInitialBoard, START } from "../../chess-board.js";

export {
  createGameState,
  applyMoveWithRules,
  getLegalMovesWithRules,
  getAllLegalMoves,
  getGameStatus,
  isInCheck,
  createInitialBoard,
  START,
};

const FILES = "abcdefgh";

const PIECE_TO_FEN = {
  wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
  bK: "k", bQ: "q", bR: "r", bB: "b", bN: "n", bP: "p",
};

export function squareName(r, c) {
  return `${FILES[c]}${8 - r}`;
}

export function moveToUci(move) {
  const from = squareName(move.r, move.c);
  const to = squareName(move.tr, move.tc);
  // Promotion encoded as a trailing piece char; default to queen for the
  // existing UI which only auto-queens, but preserve any explicit choice.
  let promo = "";
  if (move.promotion) {
    const p = typeof move.promotion === "string" ? move.promotion.toLowerCase() : "q";
    promo = "qrbn".includes(p) ? p : "q";
  }
  return `${from}${to}${promo}`;
}

export function uciToMoveCoords(uci) {
  if (typeof uci !== "string" || uci.length < 4) return null;
  const fc = FILES.indexOf(uci[0]);
  const fr = 8 - Number(uci[1]);
  const tc = FILES.indexOf(uci[2]);
  const tr = 8 - Number(uci[3]);
  if (fc < 0 || tc < 0 || isNaN(fr) || isNaN(tr)) return null;
  return { r: fr, c: fc, tr, tc };
}

// Find the legal move object that matches a UCI string, given the current
// board + game state. Returns null if no legal move matches.
export function findLegalMove(board, gameState, color, uci) {
  const coords = uciToMoveCoords(uci);
  if (!coords) return null;
  const piece = board[coords.r][coords.c];
  if (!piece || piece[0] !== color) return null;
  const moves = getLegalMovesWithRules(board, coords.r, coords.c, gameState);
  return moves.find(m => m.tr === coords.tr && m.tc === coords.tc) || null;
}

export function boardToFen(board, turn, gameState, halfmove = 0, fullmove = 1) {
  const ranks = [];
  for (let r = 0; r < 8; r++) {
    let rank = "";
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) { empty++; continue; }
      if (empty > 0) { rank += String(empty); empty = 0; }
      rank += PIECE_TO_FEN[p] || "?";
    }
    if (empty > 0) rank += String(empty);
    ranks.push(rank);
  }
  const placement = ranks.join("/");

  let castling = "";
  if (gameState?.castlingRights?.wK) castling += "K";
  if (gameState?.castlingRights?.wQ) castling += "Q";
  if (gameState?.castlingRights?.bK) castling += "k";
  if (gameState?.castlingRights?.bQ) castling += "q";
  if (!castling) castling = "-";

  const ep = gameState?.enPassantSquare
    ? squareName(gameState.enPassantSquare.r, gameState.enPassantSquare.c)
    : "-";

  return `${placement} ${turn} ${castling} ${ep} ${halfmove} ${fullmove}`;
}

// Produce a SAN-ish description for a move. Doesn't fully implement
// disambiguation in every edge case — sufficient for game-history display.
export function moveToSan(board, move, gameState) {
  const piece = board[move.r][move.c];
  if (!piece) return moveToUci(move);

  if (move.castling === "K") return "O-O";
  if (move.castling === "Q") return "O-O-O";

  const kind = piece[1];
  const dest = squareName(move.tr, move.tc);
  const isCapture = Boolean(board[move.tr][move.tc]) || move.enPassant;

  // Pawn moves
  if (kind === "P") {
    let san = isCapture
      ? `${FILES[move.c]}x${dest}`
      : dest;
    if (move.promotion) san += "=Q";
    return san;
  }

  // Disambiguate other pieces if multiple of the same kind can reach dest
  const color = piece[0];
  let needFile = false;
  let needRank = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === move.r && c === move.c) continue;
      const other = board[r][c];
      if (other !== `${color}${kind}`) continue;
      const others = getLegalMovesWithRules(board, r, c, gameState);
      if (others.some(m => m.tr === move.tr && m.tc === move.tc)) {
        if (c !== move.c) needFile = true;
        else needRank = true;
      }
    }
  }
  let disambig = "";
  if (needFile) disambig += FILES[move.c];
  if (needRank) disambig += String(8 - move.r);
  return `${kind}${disambig}${isCapture ? "x" : ""}${dest}`;
}

export function colorOnMove(turn) {
  return turn === "w" ? "White" : "Black";
}

export function startingPosition() {
  return {
    board: createInitialBoard(),
    turn: "w",
    gameState: createGameState(),
    fen: boardToFen(START, "w", createGameState(), 0, 1),
  };
}
