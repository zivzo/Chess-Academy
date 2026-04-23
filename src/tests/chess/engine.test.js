import { describe, it, expect } from 'vitest';
import { START_BOARD } from '../../chess/constants.js';
import {
  getAllLegalMoves,
  getLegalMoves,
  applyMove,
  getGameStatus,
  isInCheck,
  getColor,
} from '../../chess/moves.js';

const DEFAULT_CASTLING = { wK: true, wQ: true, bK: true, bQ: true };

describe('Chess Engine — starting position', () => {
  it('white has 20 legal moves from the start', () => {
    const moves = getAllLegalMoves(START_BOARD, 'w', null, DEFAULT_CASTLING);
    expect(moves.length).toBe(20);
  });

  it('black has 20 legal moves from the start', () => {
    const moves = getAllLegalMoves(START_BOARD, 'b', null, DEFAULT_CASTLING);
    expect(moves.length).toBe(20);
  });
});

describe('Chess Engine — pawn moves', () => {
  it('e-pawn can advance one or two squares from start', () => {
    const moves = getLegalMoves(START_BOARD, 6, 4, null, DEFAULT_CASTLING, 'w');
    expect(moves.some(m => m.tr === 5 && m.tc === 4)).toBe(true); // e3
    expect(moves.some(m => m.tr === 4 && m.tc === 4)).toBe(true); // e4
    expect(moves.length).toBe(2);
  });

  it('pawn cannot move two squares when blocked', () => {
    const board = START_BOARD.map(r => [...r]);
    board[5][4] = 'bP'; // place blocker on e3
    const moves = getLegalMoves(board, 6, 4, null, DEFAULT_CASTLING, 'w');
    expect(moves.length).toBe(0);
  });
});

describe('Chess Engine — knight moves', () => {
  it('b1 knight has two legal moves from start (a3 and c3)', () => {
    const moves = getLegalMoves(START_BOARD, 7, 1, null, DEFAULT_CASTLING, 'w');
    expect(moves.some(m => m.tr === 5 && m.tc === 0)).toBe(true); // a3
    expect(moves.some(m => m.tr === 5 && m.tc === 2)).toBe(true); // c3
    expect(moves.length).toBe(2);
  });

  it('knight in center has up to 8 moves', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[4][4] = 'wN'; // e5
    board[7][4] = 'wK';
    board[0][4] = 'bK';
    const moves = getLegalMoves(board, 4, 4, null, { wK:false,wQ:false,bK:false,bQ:false }, 'w');
    expect(moves.length).toBe(8);
  });
});

describe('Chess Engine — check detection', () => {
  it('moving into check is illegal', () => {
    // White king e1, black queen e8 — king cannot go to e2 (still on e-file)
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[7][4] = 'wK';
    board[0][4] = 'bQ';
    const moves = getLegalMoves(board, 7, 4, null, { wK:false,wQ:false,bK:false,bQ:false }, 'w');
    expect(moves.every(m => !(m.tr === 6 && m.tc === 4))).toBe(true);
  });

  it('isInCheck correctly identifies check', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[7][4] = 'wK';
    board[0][4] = 'bR'; // rook on same file
    expect(isInCheck(board, 'w')).toBe(true);
  });

  it('isInCheck returns false when not in check', () => {
    expect(isInCheck(START_BOARD, 'w')).toBe(false);
    expect(isInCheck(START_BOARD, 'b')).toBe(false);
  });
});

describe('Chess Engine — castling', () => {
  it('kingside castling available when path clear and rights set', () => {
    const board = START_BOARD.map(r => [...r]);
    board[7][5] = null; // clear f1
    board[7][6] = null; // clear g1
    const moves = getLegalMoves(board, 7, 4, null, DEFAULT_CASTLING, 'w');
    expect(moves.some(m => m.isCastle === 'K')).toBe(true);
  });

  it('castling not available when rights removed', () => {
    const board = START_BOARD.map(r => [...r]);
    board[7][5] = null;
    board[7][6] = null;
    const noRights = { wK: false, wQ: false, bK: false, bQ: false };
    const moves = getLegalMoves(board, 7, 4, null, noRights, 'w');
    expect(moves.some(m => m.isCastle === 'K')).toBe(false);
  });

  it('castling not available when path is blocked', () => {
    // f1 still occupied
    const moves = getLegalMoves(START_BOARD, 7, 4, null, DEFAULT_CASTLING, 'w');
    expect(moves.some(m => m.isCastle === 'K')).toBe(false);
  });

  it('castling rook moves with king', () => {
    const board = START_BOARD.map(r => [...r]);
    board[7][5] = null;
    board[7][6] = null;
    const castleMove = { r: 7, c: 4, tr: 7, tc: 6, isCastle: 'K' };
    const newBoard = applyMove(board, castleMove);
    expect(newBoard[7][6]).toBe('wK');
    expect(newBoard[7][5]).toBe('wR');
    expect(newBoard[7][7]).toBe(null);
    expect(newBoard[7][4]).toBe(null);
  });
});

describe('Chess Engine — en passant', () => {
  it('en passant capture removes the captured pawn', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[3][4] = 'wP'; // white pawn e5
    board[3][5] = 'bP'; // black pawn f5 (just double-pushed)
    board[7][4] = 'wK';
    board[0][4] = 'bK';
    const epTarget = { r: 2, c: 5 }; // f6
    const moves = getLegalMoves(board, 3, 4, epTarget, { wK:false,wQ:false,bK:false,bQ:false }, 'w');
    const epMove = moves.find(m => m.isEnPassant);
    expect(epMove).toBeDefined();
    const newBoard = applyMove(board, epMove);
    expect(newBoard[3][5]).toBe(null);  // captured pawn gone
    expect(newBoard[2][5]).toBe('wP');  // capturing pawn arrived
    expect(newBoard[3][4]).toBe(null);  // moving pawn left origin
  });

  it('en passant not available without target', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[3][4] = 'wP';
    board[3][5] = 'bP';
    board[7][4] = 'wK';
    board[0][4] = 'bK';
    const moves = getLegalMoves(board, 3, 4, null, { wK:false,wQ:false,bK:false,bQ:false }, 'w');
    expect(moves.some(m => m.isEnPassant)).toBe(false);
  });
});

describe('Chess Engine — checkmate & stalemate', () => {
  it("Scholar's mate is detected as checkmate", () => {
    // Position after 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#
    // Key: bQ still at d8 (row 0 col 3), e-pawn moved to e5 (row 1 col 4 empty),
    //      wQ captured on f7 (row 1 col 5), wQ left d1 (row 7 col 3 empty),
    //      wB left f1 (row 7 col 5 empty) and sits on c4 (row 4 col 2).
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0] = ['bR', null, 'bB', 'bQ', 'bK', 'bB', null, 'bR'];
    board[1] = ['bP', 'bP', 'bP', 'bP', null, 'wQ', 'bP', 'bP'];
    board[2] = [null, null, 'bN', null, null, 'bN', null, null];
    board[3] = [null, null, null, null, 'bP', null, null, null];
    board[4] = [null, null, 'wB', null, 'wP', null, null, null];
    board[5] = [null, null, null, null, null, null, null, null];
    board[6] = ['wP', 'wP', 'wP', 'wP', null, 'wP', 'wP', 'wP'];
    board[7] = ['wR', 'wN', 'wB', null, 'wK', null, 'wN', 'wR'];
    const status = getGameStatus(board, 'b', null, DEFAULT_CASTLING);
    expect(status).toBe('checkmate');
  });

  it('stalemate is detected correctly', () => {
    // Classic stalemate: black king on a8 (r=0,c=0), white queen on b6 (r=2,c=1), white king on c6 (r=2,c=2)
    // bK on a8: potential squares b8(r=0,c=1) covered by wQ, a7(r=1,c=0) covered by wQ, b7(r=1,c=1) covered by wK+wQ
    // Verify by construction: wQ on c7, wK on a6
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][0] = 'bK'; // a8
    board[1][2] = 'wQ'; // c7
    board[2][0] = 'wK'; // a6
    const status = getGameStatus(board, 'b', null, { wK:false,wQ:false,bK:false,bQ:false });
    expect(status).toBe('stalemate');
  });
});
