// ── Local 2-player game page ──────────────────────────────────────────────────
import { useCallback, useRef, useState } from "react";
import {
  PIECES,
  createInitialBoard,
  createGameState,
  getLegalMovesWithRules,
  applyMoveWithRules,
  getGameStatus,
} from "../chess-core.js";
import {
  playMove,
  playCapture,
  playCheck,
  playCheckmate,
  playIllegal,
  playGameStart,
  playNavStep,
} from "../utils/chessSound.js";

const FILES = "abcdefgh";

function buildAnnouncement(toR, toC, isCapture, status, colorName) {
  const file = FILES[toC];
  const rank = 8 - toR;
  const verb = isCapture ? "captures on" : "plays";
  let msg = `${colorName} ${verb} ${file}${rank}`;
  if (status === "checkmate") msg += " — Checkmate!";
  else if (status === "check") msg += " — Check";
  else if (status === "stalemate") msg = "Stalemate — Draw";
  return msg;
}

export default function LocalGamePage() {
  const [board, setBoard] = useState(() => createInitialBoard());
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [status, setStatus] = useState("playing"); // "playing" | "check" | "checkmate" | "stalemate"
  const [lastMove, setLastMove] = useState(null);
  const [gameState, setGameState] = useState(() => createGameState());
  const [historyStack, setHistoryStack] = useState([]);
  const [draggingSquare, setDraggingSquare] = useState(null);
  const dragValidDrop = useRef(false);
  // viewIndex: 0 = live, k = k moves back from live (up to historyStack.length)
  const [viewIndex, setViewIndex] = useState(0);
  const [ariaMsg, setAriaMsg] = useState("");

  function colorName(color) {
    return color === "w" ? "White" : "Black";
  }

  function reset() {
    setBoard(createInitialBoard());
    setTurn("w");
    setSelected(null);
    setLegalMoves([]);
    setStatus("playing");
    setLastMove(null);
    setGameState(createGameState());
    setHistoryStack([]);
    setDraggingSquare(null);
    setViewIndex(0);
    setAriaMsg("Game reset");
    playGameStart();
  }

  function undoMove() {
    setHistoryStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const prev = prevStack[prevStack.length - 1];
      setBoard(prev.board);
      setTurn(prev.turn);
      setGameState(prev.gameState);
      setStatus(prev.status);
      setLastMove(prev.lastMove);
      setSelected(null);
      setLegalMoves([]);
      setViewIndex(0); // snap to new live position
      return prevStack.slice(0, -1);
    });
  }

  function onSquareClick(r, c) {
    // When in review mode, any square click snaps back to live position first.
    if (viewIndex > 0) {
      setViewIndex(0);
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (status === "checkmate" || status === "stalemate") return;

    const piece = board[r][c];
    const isTurnPiece = piece && piece[0] === turn;
    const selectedMove = legalMoves.find((m) => m.tr === r && m.tc === c);

    if (selected && selectedMove) {
      const isCapture = Boolean(board[selectedMove.tr][selectedMove.tc]);
      const snapshot = { board, turn, gameState, status, lastMove };
      const { board: nextBoard, gameState: nextGameState } =
        applyMoveWithRules(board, selectedMove, gameState);
      const nextTurn = turn === "w" ? "b" : "w";
      const nextStatus = getGameStatus(nextBoard, nextTurn, nextGameState);

      // Sound feedback
      if (nextStatus === "checkmate") playCheckmate();
      else if (nextStatus === "check") playCheck();
      else if (isCapture) playCapture();
      else playMove();

      // Aria announcement
      setAriaMsg(buildAnnouncement(
        selectedMove.tr, selectedMove.tc,
        isCapture, nextStatus, colorName(turn),
      ));

      setHistoryStack((prev) => [...prev, snapshot]);
      setBoard(nextBoard);
      setGameState(nextGameState);
      setLastMove([{ r: selectedMove.r, c: selectedMove.c }, { r: selectedMove.tr, c: selectedMove.tc }]);
      setSelected(null);
      setLegalMoves([]);
      setTurn(nextTurn);
      setStatus(nextStatus);
      return;
    }

    if (isTurnPiece) {
      setSelected({ r, c });
      setLegalMoves(getLegalMovesWithRules(board, r, c, gameState));
      return;
    }

    // Illegal destination selected while a piece was already chosen
    if (selected) {
      playIllegal();
    }
    setSelected(null);
    setLegalMoves([]);
  }

  function onDragStart(e, r, c) {
    if (viewIndex > 0) { e.preventDefault(); return; } // can't drag in review mode
    if (status === "checkmate" || status === "stalemate") { e.preventDefault(); return; }
    const piece = board[r][c];
    if (!piece || piece[0] !== turn) { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText = "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 36, 36);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ghost.remove(), 0);
    setDraggingSquare({ r, c });
    setSelected({ r, c });
    setLegalMoves(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragOver(e, r, c) {
    const isLegalTarget = legalMoves.some((m) => m.tr === r && m.tc === c);
    if (isLegalTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDrop(e, r, c) {
    e.preventDefault();
    dragValidDrop.current = true;
    onSquareClick(r, c);
    setDraggingSquare(null);
  }

  function onDragEnd() {
    if (!dragValidDrop.current) {
      setSelected(null);
      setLegalMoves([]);
    }
    dragValidDrop.current = false;
    setDraggingSquare(null);
  }

  // ── Keyboard navigation helpers ───────────────────────────────────────────
  const goBack = useCallback(() => {
    setViewIndex(v => {
      if (v >= historyStack.length) return v; // already at start
      const next = v + 1;
      playNavStep();
      const stackIdx = historyStack.length - next;
      if (stackIdx >= 0) {
        const snap = historyStack[stackIdx];
        const moveCount = historyStack.length - next;
        setAriaMsg(`Move ${moveCount} of ${historyStack.length}`);
      }
      return next;
    });
  }, [historyStack]);

  const goForward = useCallback(() => {
    setViewIndex(v => {
      if (v === 0) return v; // already at live
      const next = v - 1;
      playNavStep();
      setAriaMsg(next === 0 ? "Live position" : `Move ${historyStack.length - next} of ${historyStack.length}`);
      return next;
    });
  }, [historyStack]);

  const goToStart = useCallback(() => {
    if (historyStack.length === 0) return;
    playNavStep();
    setViewIndex(historyStack.length);
    setAriaMsg("Start position");
  }, [historyStack.length]);

  const goToEnd = useCallback(() => {
    if (viewIndex === 0) return;
    playNavStep();
    setViewIndex(0);
    setAriaMsg("Live position");
  }, [viewIndex]);

  function handleKeyDown(e) {
    if (e.key === "ArrowLeft")  { e.preventDefault(); goBack(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goForward(); }
    if (e.key === "Home")       { e.preventDefault(); goToStart(); }
    if (e.key === "End")        { e.preventDefault(); goToEnd(); }
  }

  // ── Derive view state (live or historical) ────────────────────────────────
  const isReviewing = viewIndex > 0;
  const stackIdx = historyStack.length - viewIndex;
  const viewBoard = isReviewing && stackIdx >= 0
    ? historyStack[stackIdx].board
    : board;
  const viewLastMove = isReviewing && stackIdx >= 0
    ? historyStack[stackIdx].lastMove
    : lastMove;
  const viewStatus = isReviewing && stackIdx >= 0
    ? historyStack[stackIdx].status
    : status;

  const isGameOver = status === "checkmate" || status === "stalemate";
  const winner = status === "checkmate" ? (turn === "w" ? "b" : "w") : null;
  let turnLabel;
  if (status === "checkmate") {
    turnLabel = `Checkmate! ${colorName(winner)} wins`;
  } else if (status === "stalemate") {
    turnLabel = "Stalemate — Draw";
  } else if (status === "check") {
    turnLabel = `${colorName(turn)} is in check`;
  } else {
    turnLabel = `${colorName(turn)} to move`;
  }

  const kingInCheckPos = (() => {
    if (viewStatus !== "check" && viewStatus !== "checkmate") return null;
    const checkTurn = isReviewing && stackIdx >= 0 ? historyStack[stackIdx].turn : turn;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (viewBoard[r][c] === `${checkTurn}K`) return [r, c];
    return null;
  })();

  return (
    <div className="fade-in">
      {/* Screen-reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaMsg}</div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <div>
          <div className="page-title" style={{marginBottom:0}}>Local Game</div>
          <div className="page-subtitle" style={{marginBottom:0}}>Two humans on one machine.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span className="status-pill">{isGameOver ? "🏁" : status === "check" ? "⚠️" : "⏱"} {turnLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={undoMove} disabled={historyStack.length === 0}>↶ Undo</button>
          <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="board-wrap">
        <div
          className="board-outer"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`Chess board. ${isReviewing ? `Reviewing move ${historyStack.length - viewIndex} of ${historyStack.length}.` : turnLabel} Use arrow keys to navigate move history.`}
          style={{outline:"none"}}
        >
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map((f) => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map((r) => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {viewBoard.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = !isReviewing && selected?.r === ri && selected?.c === ci;
                  const legalMove = !isReviewing && legalMoves.find((m) => m.tr === ri && m.tc === ci);
                  const isLegalEmpty = Boolean(legalMove && !viewBoard[ri][ci]);
                  const isLegalCapture = Boolean(legalMove && viewBoard[ri][ci]);
                  const isMoved = Boolean(viewLastMove?.some((sq) => sq.r === ri && sq.c === ci));
                  const isPieceOfCurrentTurn = !isReviewing && Boolean(piece && piece[0] === turn && !isGameOver);
                  const isSelectable = !isReviewing && !isGameOver && (isPieceOfCurrentTurn || Boolean(legalMove) || isSelected);
                  const isDragging = !isReviewing && draggingSquare?.r === ri && draggingSquare?.c === ci;
                  const isInCheck = kingInCheckPos && kingInCheckPos[0] === ri && kingInCheckPos[1] === ci;
                  const className = [
                    "sq",
                    isLight ? "light" : "dark",
                    isMoved && "moved",
                    isSelected && "selected",
                    isLegalEmpty && "legal-empty",
                    isLegalCapture && "legal-capture",
                    isSelectable && "selectable",
                    isPieceOfCurrentTurn && "piece-grabbable",
                    isDragging && "dragging",
                    isInCheck && "in-check",
                  ].filter(Boolean).join(" ");
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={className}
                      draggable={isPieceOfCurrentTurn}
                      onClick={() => onSquareClick(ri, ci)}
                      onDragStart={(e) => onDragStart(e, ri, ci)}
                      onDragOver={(e) => onDragOver(e, ri, ci)}
                      onDrop={(e) => onDrop(e, ri, ci)}
                      onDragEnd={onDragEnd}
                    >
                      {piece ? PIECES[piece] : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* Navigation buttons + move counter */}
          <div className="board-nav">
            <button
              className="nav-arrow"
              disabled={historyStack.length === 0}
              onClick={goToStart}
              aria-label="Go to start"
            >⟪</button>
            <button
              className="nav-arrow"
              disabled={viewIndex >= historyStack.length}
              onClick={goBack}
              aria-label="Previous move"
            >‹</button>
            <button
              className="nav-arrow"
              disabled={viewIndex === 0}
              onClick={goForward}
              aria-label="Next move"
            >›</button>
            <button
              className="nav-arrow"
              disabled={viewIndex === 0}
              onClick={goToEnd}
              aria-label="Go to latest move"
            >⟫</button>
            {historyStack.length > 0 && (
              <span className={`nav-counter${isReviewing ? " reviewing" : ""}`}>
                {historyStack.length - viewIndex} / {historyStack.length}
              </span>
            )}
          </div>
          {isReviewing && (
            <div className="board-review-hint">
              Reviewing history — click board to return to live
            </div>
          )}
        </div>

        <div className="move-list-wrap">
          <div className="card">
            <div className="card-title" style={{fontSize:"1rem"}}>How to play</div>
            <div className="card-body">
              Click a piece to select it, then click a highlighted square to move — or simply drag a piece directly to its destination.
              <br /><br />
              Includes all standard rules: castling, en passant, pawn promotion, check, checkmate, and stalemate detection.
              <br /><br />
              Use <strong>← →</strong> arrow keys (or the ‹ › buttons) to step through move history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
