// ── Chess Rules Engine ───────────────────────────────────────────────────────
// Implements castling, en passant, check/checkmate/stalemate detection,
// and legal move filtering.

function isInside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

const KNIGHT_DELTAS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

const SLIDING_DIRECTIONS = {
  B: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  R: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  Q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
};

// ── Game state factory ───────────────────────────────────────────────────────
export function createGameState() {
  return {
    castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
    enPassantSquare: null, // { r, c } — the square where en passant capture lands
  };
}

// ── Attack detection ─────────────────────────────────────────────────────────
// Returns true if the square (r, c) is attacked by pieces of the given color.
export function isSquareAttacked(board, r, c, byColor) {
  // Check pawn attacks
  const pawnDir = byColor === "w" ? 1 : -1; // pawns of byColor attack in this direction
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir;
    const pc = c + dc;
    if (isInside(pr, pc)) {
      const piece = board[pr][pc];
      if (piece === `${byColor}P`) return true;
    }
  }

  // Check knight attacks
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = r + dr;
    const nc = c + dc;
    if (isInside(nr, nc) && board[nr][nc] === `${byColor}N`) return true;
  }

  // Check king attacks
  for (const [dr, dc] of KING_DELTAS) {
    const kr = r + dr;
    const kc = c + dc;
    if (isInside(kr, kc) && board[kr][kc] === `${byColor}K`) return true;
  }

  // Check sliding piece attacks (bishop, rook, queen)
  for (const [dr, dc] of SLIDING_DIRECTIONS.Q) {
    let sr = r + dr;
    let sc = c + dc;
    while (isInside(sr, sc)) {
      const piece = board[sr][sc];
      if (piece) {
        if (piece[0] === byColor) {
          const kind = piece[1];
          const isDiagonal = dr !== 0 && dc !== 0;
          const isStraight = dr === 0 || dc === 0;
          if (kind === "Q") return true;
          if (kind === "B" && isDiagonal) return true;
          if (kind === "R" && isStraight) return true;
        }
        break;
      }
      sr += dr;
      sc += dc;
    }
  }

  return false;
}

// ── Find king position ───────────────────────────────────────────────────────
export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === `${color}K`) return { r, c };
    }
  }
  return null;
}

// ── Check detection ──────────────────────────────────────────────────────────
export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  const opponent = color === "w" ? "b" : "w";
  return isSquareAttacked(board, king.r, king.c, opponent);
}

// ── Generate pseudo-legal moves for one piece (no check filtering) ───────────
function generatePieceMoves(board, r, c, gameState) {
  const piece = board[r][c];
  if (!piece) return [];

  const color = piece[0];
  const kind = piece[1];
  const opponent = color === "w" ? "b" : "w";
  const moves = [];

  if (kind === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promoRow = color === "w" ? 0 : 7;
    const oneStep = r + dir;

    // Forward one
    if (isInside(oneStep, c) && !board[oneStep][c]) {
      moves.push({ r, c, tr: oneStep, tc: c, promotion: oneStep === promoRow });
      // Forward two from start
      const twoStep = r + dir * 2;
      if (r === startRow && !board[twoStep][c]) {
        moves.push({ r, c, tr: twoStep, tc: c });
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const tr = r + dir;
      const tc = c + dc;
      if (!isInside(tr, tc)) continue;

      if (board[tr][tc] && board[tr][tc][0] === opponent) {
        moves.push({ r, c, tr, tc, promotion: tr === promoRow });
      }

      // En passant
      if (gameState && gameState.enPassantSquare &&
          gameState.enPassantSquare.r === tr &&
          gameState.enPassantSquare.c === tc) {
        moves.push({ r, c, tr, tc, enPassant: true });
      }
    }
    return moves;
  }

  if (kind === "N") {
    for (const [dr, dc] of KNIGHT_DELTAS) {
      const tr = r + dr;
      const tc = c + dc;
      if (!isInside(tr, tc)) continue;
      if (!board[tr][tc] || board[tr][tc][0] === opponent) {
        moves.push({ r, c, tr, tc });
      }
    }
    return moves;
  }

  if (kind === "K") {
    // Normal king moves
    for (const [dr, dc] of KING_DELTAS) {
      const tr = r + dr;
      const tc = c + dc;
      if (!isInside(tr, tc)) continue;
      if (!board[tr][tc] || board[tr][tc][0] === opponent) {
        moves.push({ r, c, tr, tc });
      }
    }

    // Castling
    if (gameState) {
      const rank = color === "w" ? 7 : 0;
      if (r === rank && c === 4) {
        // King-side castling
        const ksKey = `${color}K`;
        if (gameState.castlingRights[ksKey] &&
            board[rank][5] === null &&
            board[rank][6] === null &&
            board[rank][7] === `${color}R` &&
            !isSquareAttacked(board, rank, 4, opponent) &&
            !isSquareAttacked(board, rank, 5, opponent) &&
            !isSquareAttacked(board, rank, 6, opponent)) {
          moves.push({ r, c, tr: rank, tc: 6, castling: "K" });
        }

        // Queen-side castling
        const qsKey = `${color}Q`;
        if (gameState.castlingRights[qsKey] &&
            board[rank][3] === null &&
            board[rank][2] === null &&
            board[rank][1] === null &&
            board[rank][0] === `${color}R` &&
            !isSquareAttacked(board, rank, 4, opponent) &&
            !isSquareAttacked(board, rank, 3, opponent) &&
            !isSquareAttacked(board, rank, 2, opponent)) {
          moves.push({ r, c, tr: rank, tc: 2, castling: "Q" });
        }
      }
    }
    return moves;
  }

  // Sliding pieces (B, R, Q)
  const directions = SLIDING_DIRECTIONS[kind] || [];
  for (const [dr, dc] of directions) {
    let tr = r + dr;
    let tc = c + dc;
    while (isInside(tr, tc)) {
      if (!board[tr][tc]) {
        moves.push({ r, c, tr, tc });
      } else {
        if (board[tr][tc][0] === opponent) {
          moves.push({ r, c, tr, tc });
        }
        break;
      }
      tr += dr;
      tc += dc;
    }
  }

  return moves;
}

// ── Apply a move to a board (returns new board, does not mutate) ─────────────
function applyRawMove(board, move) {
  const next = board.map(row => [...row]);
  const piece = next[move.r][move.c];

  // En passant capture: remove the captured pawn
  if (move.enPassant) {
    const capturedRow = move.r; // the captured pawn is on the same rank as the moving pawn
    next[capturedRow][move.tc] = null;
  }

  // Move the piece
  next[move.tr][move.tc] = piece;
  next[move.r][move.c] = null;

  // Castling: move the rook too
  if (move.castling) {
    const rank = move.r;
    if (move.castling === "K") {
      next[rank][5] = next[rank][7];
      next[rank][7] = null;
    } else {
      next[rank][3] = next[rank][0];
      next[rank][0] = null;
    }
  }

  // Promotion
  if (move.promotion && piece) {
    next[move.tr][move.tc] = `${piece[0]}Q`;
  }

  return next;
}

// ── Get legal moves (filtered for check) for a single piece ──────────────────
export function getLegalMovesWithRules(board, r, c, gameState) {
  const piece = board[r][c];
  if (!piece) return [];

  const color = piece[0];
  const pseudoMoves = generatePieceMoves(board, r, c, gameState);

  // Filter: only moves that don't leave own king in check
  return pseudoMoves.filter(move => {
    const nextBoard = applyRawMove(board, move);
    return !isInCheck(nextBoard, color);
  });
}

// ── Get ALL legal moves for a side ───────────────────────────────────────────
export function getAllLegalMoves(board, color, gameState) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        const pieceMoves = getLegalMovesWithRules(board, r, c, gameState);
        moves.push(...pieceMoves);
      }
    }
  }
  return moves;
}

// ── Apply move with full rules (returns { board, gameState }) ────────────────
export function applyMoveWithRules(board, move, gameState) {
  const piece = board[move.r][move.c];
  if (!piece) return { board, gameState };

  const color = piece[0];
  const nextBoard = applyRawMove(board, move);

  // Update game state
  const nextState = {
    castlingRights: { ...gameState.castlingRights },
    enPassantSquare: null,
  };

  // Update en passant square for double pawn push
  if (piece[1] === "P" && Math.abs(move.tr - move.r) === 2) {
    const epRow = (move.r + move.tr) / 2;
    nextState.enPassantSquare = { r: epRow, c: move.c };
  }

  // Update castling rights
  // King moved
  if (piece[1] === "K") {
    nextState.castlingRights[`${color}K`] = false;
    nextState.castlingRights[`${color}Q`] = false;
  }

  // Rook moved or captured
  const whiteKingSideRook = { r: 7, c: 7 };
  const whiteQueenSideRook = { r: 7, c: 0 };
  const blackKingSideRook = { r: 0, c: 7 };
  const blackQueenSideRook = { r: 0, c: 0 };

  // Rook moved from its starting square
  if (move.r === whiteKingSideRook.r && move.c === whiteKingSideRook.c) {
    nextState.castlingRights.wK = false;
  }
  if (move.r === whiteQueenSideRook.r && move.c === whiteQueenSideRook.c) {
    nextState.castlingRights.wQ = false;
  }
  if (move.r === blackKingSideRook.r && move.c === blackKingSideRook.c) {
    nextState.castlingRights.bK = false;
  }
  if (move.r === blackQueenSideRook.r && move.c === blackQueenSideRook.c) {
    nextState.castlingRights.bQ = false;
  }

  // Rook captured on its starting square
  if (move.tr === whiteKingSideRook.r && move.tc === whiteKingSideRook.c) {
    nextState.castlingRights.wK = false;
  }
  if (move.tr === whiteQueenSideRook.r && move.tc === whiteQueenSideRook.c) {
    nextState.castlingRights.wQ = false;
  }
  if (move.tr === blackKingSideRook.r && move.tc === blackKingSideRook.c) {
    nextState.castlingRights.bK = false;
  }
  if (move.tr === blackQueenSideRook.r && move.tc === blackQueenSideRook.c) {
    nextState.castlingRights.bQ = false;
  }

  return { board: nextBoard, gameState: nextState };
}

// ── Game status detection ────────────────────────────────────────────────────
// Returns: "checkmate", "stalemate", "check", or "playing"
export function getGameStatus(board, color, gameState) {
  const legalMoves = getAllLegalMoves(board, color, gameState);
  const inCheck = isInCheck(board, color);

  if (legalMoves.length === 0) {
    return inCheck ? "checkmate" : "stalemate";
  }

  return inCheck ? "check" : "playing";
}
