// ── Local 2-player game page ──────────────────────────────────────────────────
import { useRef, useState } from "react";
import {
  PIECES,
  createInitialBoard,
  createGameState,
  getLegalMovesWithRules,
  applyMoveWithRules,
  getGameStatus,
} from "../chess-core.js";

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
      return prevStack.slice(0, -1);
    });
  }

  function onSquareClick(r, c) {
    if (status === "checkmate" || status === "stalemate") return;

    const piece = board[r][c];
    const isTurnPiece = piece && piece[0] === turn;
    const selectedMove = legalMoves.find((m) => m.tr === r && m.tc === c);

    if (selected && selectedMove) {
      const snapshot = { board, turn, gameState, status, lastMove };
      const { board: nextBoard, gameState: nextGameState } =
        applyMoveWithRules(board, selectedMove, gameState);
      const nextTurn = turn === "w" ? "b" : "w";
      const nextStatus = getGameStatus(nextBoard, nextTurn, nextGameState);

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

    setSelected(null);
    setLegalMoves([]);
  }

  function onDragStart(e, r, c) {
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
    if (status !== "check" && status !== "checkmate") return null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === `${turn}K`) return [r, c];
    return null;
  })();

  return (
    <div className="fade-in">
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
        <div className="board-outer">
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map((f) => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map((r) => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected?.r === ri && selected?.c === ci;
                  const legalMove = legalMoves.find((m) => m.tr === ri && m.tc === ci);
                  const isLegalEmpty = Boolean(legalMove && !board[ri][ci]);
                  const isLegalCapture = Boolean(legalMove && board[ri][ci]);
                  const isMoved = Boolean(lastMove?.some((sq) => sq.r === ri && sq.c === ci));
                  const isPieceOfCurrentTurn = Boolean(piece && piece[0] === turn && !isGameOver);
                  const isSelectable = !isGameOver && (isPieceOfCurrentTurn || Boolean(legalMove) || isSelected);
                  const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
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
        </div>

        <div className="move-list-wrap">
          <div className="card">
            <div className="card-title" style={{fontSize:"1rem"}}>How to play</div>
            <div className="card-body">
              Click a piece to select it, then click a highlighted square to move — or simply drag a piece directly to its destination.
              <br /><br />
              Includes all standard rules: castling, en passant, pawn promotion, check, checkmate, and stalemate detection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
