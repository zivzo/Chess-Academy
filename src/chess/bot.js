import { getAllLegalMoves, applyMove, getGameStatus, updateCastlingRights, getEnPassantTarget } from './moves.js';
import { evaluate } from './evaluation.js';

function minimax(board, depth, alpha, beta, maximizing, turn, enPassantTarget, castlingRights) {
  const status = getGameStatus(board, turn, enPassantTarget, castlingRights);
  if (depth === 0 || status === 'checkmate' || status === 'stalemate') {
    if (status === 'checkmate') return maximizing ? -100000 : 100000;
    if (status === 'stalemate') return 0;
    return evaluate(board, maximizing ? turn : (turn === 'w' ? 'b' : 'w'));
  }

  const moves = getAllLegalMoves(board, turn, enPassantTarget, castlingRights);
  const nextTurn = turn === 'w' ? 'b' : 'w';

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const piece = board[move.r][move.c];
      const newBoard = applyMove(board, move);
      const newEP = getEnPassantTarget(board, move, piece);
      const newCR = updateCastlingRights(castlingRights, move, piece);
      const val = minimax(newBoard, depth - 1, alpha, beta, false, nextTurn, newEP, newCR);
      if (val > best) best = val;
      if (val > alpha) alpha = val;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const piece = board[move.r][move.c];
      const newBoard = applyMove(board, move);
      const newEP = getEnPassantTarget(board, move, piece);
      const newCR = updateCastlingRights(castlingRights, move, piece);
      const val = minimax(newBoard, depth - 1, alpha, beta, true, nextTurn, newEP, newCR);
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Get best move for given bot level.
 * With probability errorRate, picks a random legal move (simulates blunder).
 * Otherwise runs minimax to botLevel.depth.
 *
 * NOTE: In production this should run in a Web Worker to avoid blocking the UI.
 * For simplicity in this dev/test setup we run synchronously and call via setTimeout(0) from the UI.
 */
export function getBotMove(board, turn, enPassantTarget, castlingRights, botLevel) {
  const moves = getAllLegalMoves(board, turn, enPassantTarget, castlingRights);
  if (moves.length === 0) return null;

  // Introduce intentional blunders based on bot level
  if (Math.random() < botLevel.errorRate) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestScore = -Infinity;
  const nextTurn = turn === 'w' ? 'b' : 'w';

  for (const move of moves) {
    const piece = board[move.r][move.c];
    const newBoard = applyMove(board, move);
    const newEP = getEnPassantTarget(board, move, piece);
    const newCR = updateCastlingRights(castlingRights, move, piece);
    const score = minimax(newBoard, botLevel.depth - 1, -Infinity, Infinity, false, nextTurn, newEP, newCR);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}
