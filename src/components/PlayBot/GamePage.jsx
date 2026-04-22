import { useState, useEffect, useCallback } from 'react';
import Board from '../Board/Board.jsx';
import { START_BOARD, PIECE_UNICODE } from '../../chess/constants.js';
import {
  getLegalMoves, applyMove, getGameStatus,
  updateCastlingRights, getEnPassantTarget, isInCheck, getColor,
} from '../../chess/moves.js';
import { getBotMove } from '../../chess/bot.js';

const INIT_CASTLING = { wK: true, wQ: true, bK: true, bQ: true };

function freshState() {
  return {
    board: START_BOARD.map(r => [...r]),
    turn: 'w',
    enPassantTarget: null,
    castlingRights: { ...INIT_CASTLING },
    selectedSquare: null,
    legalMoves: [],
    moveHistory: [],
    gameStatus: 'playing',
    lastMove: null,
    promotionPending: null,
  };
}

export default function GamePage({ botLevel, playerColor, onBack }) {
  const [state, setState] = useState(freshState);
  const [botThinking, setBotThinking] = useState(false);

  const isPlayerTurn = state.turn === playerColor;

  // Find king position when in check/checkmate for highlighting
  const checkSquare = (() => {
    if (state.gameStatus === 'check' || state.gameStatus === 'checkmate') {
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          if (state.board[r][c] === state.turn + 'K') return { r, c };
    }
    return null;
  })();

  const executeMove = useCallback((st, move, promotionPiece) => {
    const piece = st.board[move.r][move.c];
    const finalMove = promotionPiece ? { ...move, promotion: promotionPiece } : move;
    const newBoard = applyMove(st.board, finalMove);
    const newTurn = st.turn === 'w' ? 'b' : 'w';
    const newEP = getEnPassantTarget(st.board, finalMove, piece);
    const newCR = updateCastlingRights(st.castlingRights, finalMove, piece);

    // Build algebraic notation
    const files = 'abcdefgh';
    let notation = '';
    if (finalMove.isCastle) {
      notation = finalMove.isCastle === 'K' ? 'O-O' : 'O-O-O';
    } else {
      const type = piece[1];
      if (type === 'P') {
        if (move.c !== move.tc) notation = files[move.c] + 'x';
        notation += files[move.tc] + (8 - move.tr);
        if (finalMove.promotion) notation += '=' + finalMove.promotion[1];
      } else {
        notation = type;
        const isCapture = st.board[move.tr][move.tc] !== null || move.isEnPassant;
        if (isCapture) notation += 'x';
        notation += files[move.tc] + (8 - move.tr);
      }
    }

    const newStatus = getGameStatus(newBoard, newTurn, newEP, newCR);
    if (newStatus === 'check') notation += '+';
    if (newStatus === 'checkmate') notation += '#';

    return {
      ...st,
      board: newBoard,
      turn: newTurn,
      enPassantTarget: newEP,
      castlingRights: newCR,
      selectedSquare: null,
      legalMoves: [],
      moveHistory: [...st.moveHistory, { notation, move: finalMove, turn: st.turn }],
      gameStatus: newStatus,
      lastMove: finalMove,
      promotionPending: null,
    };
  }, []);

  // Trigger bot move after player's turn
  useEffect(() => {
    if (state.gameStatus !== 'playing' && state.gameStatus !== 'check') return;
    if (isPlayerTurn) return;
    if (botThinking) return;

    setBotThinking(true);
    // Use setTimeout to avoid blocking UI thread.
    // Production should use a Web Worker for heavy minimax computations.
    const timer = setTimeout(() => {
      setState(st => {
        const move = getBotMove(st.board, st.turn, st.enPassantTarget, st.castlingRights, botLevel);
        if (!move) return st;
        return executeMove(st, move, move.promotion || null);
      });
      setBotThinking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [state.turn, state.gameStatus, isPlayerTurn, botThinking, botLevel, executeMove]);

  function handleSquareClick(r, c) {
    if (!isPlayerTurn) return;
    if (state.gameStatus === 'checkmate' || state.gameStatus === 'stalemate') return;
    if (state.promotionPending) return;

    const { board, turn, selectedSquare, legalMoves, enPassantTarget, castlingRights } = state;
    const piece = board[r][c];

    if (selectedSquare) {
      const move = legalMoves.find(m => m.tr === r && m.tc === c);
      if (move) {
        const movingPiece = board[selectedSquare.r][selectedSquare.c];
        const promRank = turn === 'w' ? 0 : 7;
        if (movingPiece && movingPiece[1] === 'P' && r === promRank) {
          setState(st => ({ ...st, promotionPending: move }));
          return;
        }
        setState(st => executeMove(st, move, null));
        return;
      }
    }

    // Select a piece belonging to current player
    if (piece && getColor(piece) === turn) {
      const moves = getLegalMoves(board, r, c, enPassantTarget, castlingRights, turn);
      setState(st => ({ ...st, selectedSquare: { r, c }, legalMoves: moves }));
    } else {
      setState(st => ({ ...st, selectedSquare: null, legalMoves: [] }));
    }
  }

  function handleDrop(from, to) {
    if (!isPlayerTurn) return;
    if (state.gameStatus === 'checkmate' || state.gameStatus === 'stalemate') return;
    const { board, turn, enPassantTarget, castlingRights } = state;
    const piece = board[from.r][from.c];
    if (!piece || getColor(piece) !== turn) return;

    const moves = getLegalMoves(board, from.r, from.c, enPassantTarget, castlingRights, turn);
    const move = moves.find(m => m.tr === to.r && m.tc === to.c);
    if (!move) return;

    const promRank = turn === 'w' ? 0 : 7;
    if (piece[1] === 'P' && to.r === promRank) {
      setState(st => ({ ...st, selectedSquare: from, legalMoves: moves, promotionPending: move }));
      return;
    }
    setState(st => executeMove(st, move, null));
  }

  function handlePromotion(promotionPiece) {
    if (!state.promotionPending) return;
    setState(st => executeMove(st, st.promotionPending, promotionPiece));
  }

  // Group move history into pairs for display
  const historyPairs = [];
  for (let i = 0; i < state.moveHistory.length; i += 2) {
    historyPairs.push({
      num: Math.floor(i / 2) + 1,
      white: state.moveHistory[i],
      black: state.moveHistory[i + 1],
    });
  }

  const statusMessages = {
    playing: '',
    check: `${state.turn === 'w' ? 'White' : 'Black'} is in Check!`,
    checkmate: `Checkmate — ${state.turn === 'w' ? 'Black' : 'White'} wins!`,
    stalemate: 'Stalemate — Draw!',
  };
  const statusMessage = statusMessages[state.gameStatus] || '';
  const statusClass = state.gameStatus === 'playing' ? '' : state.gameStatus;

  const flipped = playerColor === 'b';

  const promotingColor = state.promotionPending ? state.turn : null;
  const promotionPieces = promotingColor ? ['Q','R','B','N'].map(t => promotingColor + t) : [];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="page-title" style={{ marginBottom: 0 }}>
            vs {botLevel.emoji} {botLevel.name} ({botLevel.rating})
          </div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>
            You play as {playerColor === 'w' ? 'White ♔' : 'Black ♚'}
          </div>
        </div>
      </div>

      {state.promotionPending && (
        <div className="promotion-overlay">
          <div className="promotion-dialog">
            <h3>Promote your pawn</h3>
            <div className="promotion-pieces">
              {promotionPieces.map(p => (
                <button key={p} className="promotion-piece" onClick={() => handlePromotion(p)}>
                  {PIECE_UNICODE[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-layout">
        <Board
          board={state.board}
          turn={state.turn}
          legalMovesMap={state.legalMoves}
          selectedSquare={state.selectedSquare}
          lastMove={state.lastMove}
          checkSquare={checkSquare}
          onSquareClick={handleSquareClick}
          onDrop={handleDrop}
          flipped={flipped}
        />

        <div className="game-info">
          {statusMessage && (
            <div className={`status-banner ${statusClass}`}>{statusMessage}</div>
          )}

          <div className="game-info-card">
            <div className="turn-indicator">
              <div className={`turn-dot ${state.turn === 'w' ? 'white' : 'black'}`} />
              {state.turn === 'w' ? 'White' : 'Black'} to move
              {botThinking && !isPlayerTurn && ' (thinking...)'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setState(st => ({ ...st, gameStatus: 'checkmate' }))}
                disabled={state.gameStatus === 'checkmate' || state.gameStatus === 'stalemate'}
              >
                🏳 Resign
              </button>
              <button className="btn btn-sm" onClick={() => setState(freshState())}>
                🔄 New Game
              </button>
            </div>
          </div>

          <div className="game-info-card">
            <div className="move-list-title">Move History</div>
            <div className="move-history">
              {historyPairs.map(pair => (
                <div key={pair.num} className="move-history-row">
                  <span className="move-history-num">{pair.num}.</span>
                  <span className="move-history-move">{pair.white?.notation || ''}</span>
                  <span className="move-history-move">{pair.black?.notation || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
