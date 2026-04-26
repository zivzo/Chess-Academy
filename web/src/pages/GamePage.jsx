// ── Play vs Stockfish + Analysis page ────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIECES,
  START,
  createGameState,
  getLegalMovesWithRules,
  applyMoveWithRules,
  getGameStatus,
  formatMove,
} from "../chess-core.js";
import {
  getStockfishMove,
  getStockfishAnalysis,
  DEFAULT_ENGINE_RATING,
  MIN_ENGINE_RATING,
  MAX_ENGINE_RATING,
} from "../stockfish-api.js";
import { strengthLabel, formatEval } from "../utils/formatters.js";

export default function GamePage() {
  // Board & game state
  const [board, setBoard]               = useState(() => START.map(r => [...r]));
  const [turn, setTurn]                 = useState("w");
  const [selected, setSelected]         = useState(null);
  const [movesFromSquare, setMovesFromSquare] = useState([]);
  const [history, setHistory]           = useState([]);

  // UI state
  const [activeTab, setActiveTab]       = useState("play");
  const [engineRating, setEngineRating] = useState(DEFAULT_ENGINE_RATING);

  // Rules engine state
  const [gameState, setGameState] = useState(() => createGameState());
  const [status, setStatus] = useState("playing"); // "playing" | "check" | "checkmate" | "stalemate"

  // Snapshots for undo (each snapshot is the state *before* a move).
  const [historyStack, setHistoryStack] = useState([]);

  // Analysis state (async — null means "loading or not yet fetched")
  const [analysis, setAnalysis]         = useState(null);

  // Drag state
  const [draggingSquare, setDraggingSquare] = useState(null);
  const dragValidDrop = useRef(false);

  // Engine is thinking whenever it is Black's turn.
  const engineThinking = turn === "b";

  // Ref to track the latest request and avoid stale async responses.
  const moveRequestId = useRef(0);

  // ── Engine plays as Black (async) ──────────────────────────────────────────
  useEffect(() => {
    if (turn !== "b") return;
    if (status === "checkmate" || status === "stalemate") return;

    let cancelled = false;
    const requestId = ++moveRequestId.current;

    getStockfishMove(board, "b", engineRating).then((move) => {
      // Ignore if a newer request was started or the effect was cleaned up.
      if (cancelled || requestId !== moveRequestId.current) return;

      if (move) {
        const { board: nextBoard, gameState: nextGS } =
          applyMoveWithRules(board, move, gameState);
        const nextStatus = getGameStatus(nextBoard, "w", nextGS);
        setBoard(nextBoard);
        setGameState(nextGS);
        setHistory(prev => [...prev, `Black: ${formatMove(move)}`]);
        setStatus(nextStatus);
      }
      setTurn("w");
    });

    return () => { cancelled = true; };
  }, [turn, board, engineRating, gameState, status]);

  // ── Fetch analysis whenever the position changes ───────────────────────────
  useEffect(() => {
    if (activeTab !== "analysis") return;

    let cancelled = false;

    getStockfishAnalysis(board, turn).then((result) => {
      if (!cancelled) {
        setAnalysis(result);
      }
    });

    return () => { cancelled = true; };
  }, [board, turn, activeTab]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    moveRequestId.current++;          // Cancel any in-flight API call.
    setBoard(START.map(r => [...r]));
    setTurn("w");
    setSelected(null);
    setMovesFromSquare([]);
    setHistory([]);
    setAnalysis(null);
    setGameState(createGameState());
    setStatus("playing");
    setHistoryStack([]);
  }, []);

  // ── Undo ───────────────────────────────────────────────────────────────────
  // Step back to the most recent White-to-move position so the human can
  // replay. Snapshots are only pushed before the human's move (never before
  // the engine's reply), so popping one always lands on a White-to-move state
  // — automatically rolling back the engine's reply along with it.
  const undoMove = useCallback(() => {
    setHistoryStack(prevStack => {
      if (prevStack.length === 0) return prevStack;
      const stack = prevStack.slice();
      const snap = stack.pop();
      moveRequestId.current++;        // Cancel any in-flight engine API call.

      setBoard(snap.board);
      setTurn(snap.turn);
      setGameState(snap.gameState);
      setStatus(snap.status);
      setHistory(snap.history);
      setSelected(null);
      setMovesFromSquare([]);
      setAnalysis(null);
      return stack;
    });
  }, []);

  function colorName(color) {
    return color === "w" ? "White" : "Black";
  }

  // ── Square click handler ───────────────────────────────────────────────────
  function onSquareClick(r, c) {
    if (turn !== "w" || engineThinking) return;
    if (status === "checkmate" || status === "stalemate") return;

    const chosenMove = movesFromSquare.find(m => m.tr === r && m.tc === c);
    if (selected && chosenMove) {
      const snapshot = { board, turn, gameState, status, history };
      const { board: nextBoard, gameState: nextGameState } =
        applyMoveWithRules(board, chosenMove, gameState);
      const nextStatus = getGameStatus(nextBoard, "b", nextGameState);

      setHistoryStack(prev => [...prev, snapshot]);
      setBoard(nextBoard);
      setGameState(nextGameState);
      setHistory(prev => [...prev, `White: ${formatMove(chosenMove)}`]);
      setTurn("b");
      setStatus(nextStatus);
      setSelected(null);
      setMovesFromSquare([]);
      return;
    }

    const piece = board[r][c];
    if (!piece || piece[0] !== "w") {
      setSelected(null);
      setMovesFromSquare([]);
      return;
    }

    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragStart(e, r, c) {
    if (turn !== "w" || engineThinking || status === "checkmate" || status === "stalemate") {
      e.preventDefault(); return;
    }
    const piece = board[r][c];
    if (!piece || piece[0] !== "w") { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText = "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 36, 36);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ghost.remove(), 0);
    setDraggingSquare({ r, c });
    setSelected([r, c]);
    setMovesFromSquare(getLegalMovesWithRules(board, r, c, gameState));
  }

  function onDragOver(e, r, c) {
    const isLegalTarget = movesFromSquare.some((m) => m.tr === r && m.tc === c);
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
      setMovesFromSquare([]);
    }
    dragValidDrop.current = false;
    setDraggingSquare(null);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isGameOver = status === "checkmate" || status === "stalemate";
  // Lock the engine strength as soon as a move has been played so changing it
  // mid-game can't interfere with the engine's in-flight calculation. It
  // becomes editable again after `resetGame` clears the history.
  const isStrengthLocked = history.length > 0 && !isGameOver;
  const moveDests = new Set(movesFromSquare.map(m => `${m.tr}-${m.tc}`));
  const { label: ratingLabel, css: ratingCss } = strengthLabel(engineRating);
  const evalText = analysis ? formatEval(analysis.evaluation, analysis.mate) : "0.0";

  const canInteract = turn === "w" && !engineThinking && !isGameOver;

  const kingInCheckPos = (() => {
    if (status !== "check" && status !== "checkmate") return null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === `${turn}K`) return [r, c];
    return null;
  })();

  let turnLabel;
  if (status === "checkmate") {
    const winner = turn === "w" ? "b" : "w";
    turnLabel = `Checkmate! ${colorName(winner)} wins`;
  } else if (status === "stalemate") {
    turnLabel = "Stalemate — Draw";
  } else if (engineThinking) {
    turnLabel = "Stockfish thinking…";
  } else if (status === "check") {
    turnLabel = `${colorName(turn)} is in check`;
  } else {
    turnLabel = `${colorName(turn)} to move`;
  }

  return (
    <div className="fade-in">
      <div className="page-title">Play vs Stockfish</div>
      <div className="page-subtitle">
        Play as White against the Stockfish engine. Adjust strength and switch to Analysis for recommendations.
      </div>

      <div className="tab-row">
        <button className={`mini-tab ${activeTab === "play" ? "active" : ""}`} onClick={() => setActiveTab("play")}>♟ Game</button>
        <button className={`mini-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>🔍 Analysis</button>
      </div>

      {/* ── Engine strength selector ── */}
      {/* Strength is locked once the game has started so changing it mid-game
          cannot disturb the engine's in-flight move calculation. It unlocks on Reset. */}
      <div className="strength-selector">
        <label>
          Engine Strength: <strong>{engineRating}</strong> Elo
          <span className={`strength-badge ${ratingCss}`}>{ratingLabel}</span>
        </label>
        <input
          type="range"
          min={MIN_ENGINE_RATING}
          max={MAX_ENGINE_RATING}
          step={100}
          value={engineRating}
          disabled={isStrengthLocked}
          onChange={(e) => setEngineRating(Number(e.target.value))}
        />
        <div className="strength-labels">
          <span>Beginner ({MIN_ENGINE_RATING})</span>
          <span>Master ({MAX_ENGINE_RATING})</span>
        </div>
        {isStrengthLocked && (
          <div className="strength-locked-hint">
            🔒 Engine strength is locked during the game. Reset to change it.
          </div>
        )}
      </div>

      <div className="game-controls">
        <span className="turn-pill">{isGameOver ? "🏁" : status === "check" ? "⚠️" : "⏱"} {turnLabel}</span>
        <button
          className="btn btn-sm btn-outline"
          onClick={undoMove}
          disabled={historyStack.length === 0}
        >↶ Undo</button>
        <button className="btn btn-sm btn-outline" onClick={resetGame}>Reset Game</button>
      </div>

      <div className="board-wrap">
        <div className="board-outer">
          <div className="board-files">
            {["a","b","c","d","e","f","g","h"].map(f => <div key={f} className="board-file-label">{f}</div>)}
          </div>
          <div className="board-labels-row">
            <div style={{display:"flex",flexDirection:"column"}}>
              {[8,7,6,5,4,3,2,1].map(r => <div key={r} className="board-rank-label">{r}</div>)}
            </div>
            <div className="board">
              {board.map((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0;
                  const isSelected = selected && selected[0] === ri && selected[1] === ci;
                  const isLegalEmpty = moveDests.has(`${ri}-${ci}`) && !board[ri][ci];
                  const isLegalCapture = moveDests.has(`${ri}-${ci}`) && Boolean(board[ri][ci]);
                  const isWhitePiece = Boolean(piece && piece[0] === "w");
                  const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
                  const isInCheck = kingInCheckPos && kingInCheckPos[0] === ri && kingInCheckPos[1] === ci;
                  const className = [
                    "sq",
                    isLight ? "light" : "dark",
                    isSelected && "selected",
                    isLegalEmpty && "legal-empty",
                    isLegalCapture && "legal-capture",
                    canInteract && isWhitePiece && "piece-grabbable",
                    isDragging && "dragging",
                    isInCheck && "in-check",
                  ].filter(Boolean).join(" ");
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={className}
                      draggable={canInteract && isWhitePiece}
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
          {activeTab === "analysis" && (
            <>
              <div className="engine-rec">
                <h4>Stockfish Recommendation</h4>
                {!analysis ? (
                  <p>Analyzing position…</p>
                ) : (
                  <p>
                    {analysis?.move
                      ? `${turn === "w" ? "White" : "Black"} best move: ${formatMove(analysis.move)}`
                      : "No legal moves available from this position."}
                    <br />
                    Evaluation (White perspective): <strong>{evalText}</strong>
                  </p>
                )}
                {analysis?.source && (
                  <div className="engine-source">
                    Source: {analysis.source === "stockfish" ? "Stockfish API" : "Local engine (API unavailable)"}
                  </div>
                )}
              </div>
              <div className="card" style={{padding:"1rem"}}>
                <div className="card-title" style={{fontSize:"0.92rem"}}>How to use this tab</div>
                <div className="card-body">
                  After each move, check the suggested move and compare it to what you played.
                  If they differ, ask what tactical or positional idea the engine saw first.
                </div>
              </div>
            </>
          )}

          <div className="move-list-title">Game Moves</div>
          <div className="move-list">
            {history.length === 0 && <span className="move-number">No moves yet</span>}
            {history.map((entry, i) => (
              <div key={i} className="move-chip">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
