import { WHITE, BLACK } from './constants.js';

export function getColor(piece) {
  if (!piece) return null;
  return piece[0];
}

function opponent(color) {
  return color === WHITE ? BLACK : WHITE;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/** Returns pseudo-legal moves (may leave own king in check). */
export function getPseudoMoves(board, r, c, enPassantTarget, castlingRights) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = getColor(piece);
  const type = piece[1];
  const moves = [];

  const isEmpty = (nr, nc) => inBounds(nr, nc) && board[nr][nc] === null;
  const isEnemy = (nr, nc) => inBounds(nr, nc) && board[nr][nc] !== null && getColor(board[nr][nc]) !== color;
  const canOccupy = (nr, nc) => isEmpty(nr, nc) || isEnemy(nr, nc);

  function slide(directions) {
    for (const [dr, dc] of directions) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (board[nr][nc] === null) {
          moves.push({ r, c, tr: nr, tc: nc });
        } else {
          if (isEnemy(nr, nc)) moves.push({ r, c, tr: nr, tc: nc });
          break;
        }
        nr += dr; nc += dc;
      }
    }
  }

  if (type === 'P') {
    const dir = color === WHITE ? -1 : 1;
    const startRank = color === WHITE ? 6 : 1;
    const promRank  = color === WHITE ? 0 : 7;

    // Forward 1
    if (isEmpty(r + dir, c)) {
      if (r + dir === promRank) {
        for (const p of ['Q','R','B','N'])
          moves.push({ r, c, tr: r + dir, tc: c, promotion: color + p });
      } else {
        moves.push({ r, c, tr: r + dir, tc: c });
        // Forward 2 from starting rank
        if (r === startRank && isEmpty(r + 2 * dir, c))
          moves.push({ r, c, tr: r + 2 * dir, tc: c });
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (isEnemy(nr, nc)) {
        if (nr === promRank) {
          for (const p of ['Q','R','B','N'])
            moves.push({ r, c, tr: nr, tc: nc, promotion: color + p });
        } else {
          moves.push({ r, c, tr: nr, tc: nc });
        }
      }
      // En passant
      if (enPassantTarget && enPassantTarget.r === nr && enPassantTarget.c === nc) {
        moves.push({ r, c, tr: nr, tc: nc, isEnPassant: true });
      }
    }
  }

  if (type === 'N') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      if (canOccupy(r + dr, c + dc))
        moves.push({ r, c, tr: r + dr, tc: c + dc });
    }
  }

  if (type === 'B') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'R') slide([[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === 'Q') slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);

  if (type === 'K') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      if (canOccupy(r + dr, c + dc))
        moves.push({ r, c, tr: r + dr, tc: c + dc });
    }
    // Castling
    const backRank = color === WHITE ? 7 : 0;
    if (r === backRank && c === 4) {
      if (castlingRights && castlingRights[color + 'K'] &&
          board[backRank][5] === null && board[backRank][6] === null) {
        moves.push({ r, c, tr: backRank, tc: 6, isCastle: 'K' });
      }
      if (castlingRights && castlingRights[color + 'Q'] &&
          board[backRank][3] === null && board[backRank][2] === null && board[backRank][1] === null) {
        moves.push({ r, c, tr: backRank, tc: 2, isCastle: 'Q' });
      }
    }
  }

  return moves;
}

export function isInCheck(board, color) {
  // Find king position
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === color + 'K') { kr = r; kc = c; }
  if (kr === -1) return false;

  const opp = opponent(color);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && getColor(board[r][c]) === opp) {
        const ms = getPseudoMoves(board, r, c, null, null);
        if (ms.some(m => m.tr === kr && m.tc === kc)) return true;
      }
    }
  }
  return false;
}

/** Apply a move and return a new board (does NOT mutate input). */
export function applyMove(board, move) {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.r][move.c];

  // En passant: remove captured pawn (same rank as moving pawn, destination file)
  if (move.isEnPassant) {
    newBoard[move.r][move.tc] = null;
  }

  // Move piece (apply promotion if present)
  newBoard[move.tr][move.tc] = move.promotion || piece;
  newBoard[move.r][move.c] = null;

  // Castling: also move the rook
  if (move.isCastle) {
    const backRank = move.tr;
    if (move.isCastle === 'K') {
      newBoard[backRank][5] = newBoard[backRank][7];
      newBoard[backRank][7] = null;
    } else {
      newBoard[backRank][3] = newBoard[backRank][0];
      newBoard[backRank][0] = null;
    }
  }

  return newBoard;
}

export function getLegalMoves(board, r, c, enPassantTarget, castlingRights, turn) {
  if (!inBounds(r, c)) return [];
  const piece = board[r][c];
  if (!piece || getColor(piece) !== turn) return [];

  const pseudo = getPseudoMoves(board, r, c, enPassantTarget, castlingRights);
  return pseudo.filter(move => {
    // Castling: king cannot start in check, and cannot pass through an attacked square
    if (move.isCastle) {
      const color = getColor(piece);
      if (isInCheck(board, color)) return false;
      const passTc = move.isCastle === 'K' ? 5 : 3;
      const passBoard = board.map(row => [...row]);
      passBoard[r][passTc] = piece;
      passBoard[r][c] = null;
      if (isInCheck(passBoard, color)) return false;
    }
    const newBoard = applyMove(board, move);
    return !isInCheck(newBoard, getColor(piece));
  });
}

export function getAllLegalMoves(board, turn, enPassantTarget, castlingRights) {
  const moves = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] && getColor(board[r][c]) === turn)
        moves.push(...getLegalMoves(board, r, c, enPassantTarget, castlingRights, turn));
  return moves;
}

export function getGameStatus(board, turn, enPassantTarget, castlingRights) {
  const legalMoves = getAllLegalMoves(board, turn, enPassantTarget, castlingRights);
  const inCheck = isInCheck(board, turn);
  if (legalMoves.length === 0) return inCheck ? 'checkmate' : 'stalemate';
  return inCheck ? 'check' : 'playing';
}

/** Update castling rights after a move. */
export function updateCastlingRights(castlingRights, move, piece) {
  const rights = { ...castlingRights };
  if (!piece) return rights;
  const type = piece[1];
  const color = piece[0];

  if (type === 'K') {
    rights[color + 'K'] = false;
    rights[color + 'Q'] = false;
  } else if (type === 'R') {
    const backRank = color === WHITE ? 7 : 0;
    if (move.r === backRank) {
      if (move.c === 7) rights[color + 'K'] = false;
      if (move.c === 0) rights[color + 'Q'] = false;
    }
  }
  // If a rook is captured
  if (move.tr === 7 && move.tc === 7) rights.wK = false;
  if (move.tr === 7 && move.tc === 0) rights.wQ = false;
  if (move.tr === 0 && move.tc === 7) rights.bK = false;
  if (move.tr === 0 && move.tc === 0) rights.bQ = false;
  return rights;
}

/** Compute the en-passant target square after a pawn double-push. */
export function getEnPassantTarget(board, move, piece) {
  if (!piece || piece[1] !== 'P') return null;
  const color = piece[0];
  const dir = color === WHITE ? -1 : 1;
  const startRank = color === WHITE ? 6 : 1;
  if (move.r === startRank && move.tr === startRank + 2 * dir) {
    return { r: move.r + dir, c: move.c };
  }
  return null;
}
