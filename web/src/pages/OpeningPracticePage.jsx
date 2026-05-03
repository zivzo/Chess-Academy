// ── Interactive opening practice page ────────────────────────────────────────
// Lets the user play through a known opening line move-by-move on a real board.
// The app validates each user move against the book line: if it matches the
// expected position, the system auto-plays the opponent's reply. Wrong moves
// are rejected with feedback, and a "Show hint" button reveals the book move.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PIECES,
  createInitialBoard,
  createGameState,
  getLegalMovesWithRules,
  getAllLegalMoves,
  applyMoveWithRules,
} from "../chess-core.js";
import {
  playMove,
  playCapture,
  playIllegal,
  playGameStart,
  playNavStep,
} from "../utils/chessSound.js";

const FILES = "abcdefgh";

function boardsEqual(a, b) {
  if (!a || !b) return false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

// Find the book move (a legal move of `color`) whose result matches expectedBoard.
function findBookMove(board, gameState, color, expectedBoard) {
  if (!expectedBoard) return null;
  const moves = getAllLegalMoves(board, color, gameState);
  for (const m of moves) {
    const { board: next } = applyMoveWithRules(board, m, gameState);
    if (boardsEqual(next, expectedBoard)) return m;
  }
  return null;
}

function squareLabel(r, c) {
  return `${FILES[c]}${8 - r}`;
}

export default function OpeningPracticePage({ opening, onBack }) {
  const variations = opening.variations ?? [];
  const userColor = opening.side === "Black" ? "b" : "w";

  const [variantId, setVariantId] = useState(null);
  const activeVariation = variantId
    ? variations.find((v) => v.id === variantId)
    : null;
  const line = activeVariation ?? opening;
  const lineLabel = activeVariation ? activeVariation.name : "Main Line";

  // Precompute the longest prefix of the book line that can be reproduced via
  // legal chess moves. The data has a few entries whose recorded board diff
  // doesn't correspond to a legal move (e.g. an illegal knight pattern) — we
  // simply end practice cleanly at the last legally reachable position.
  const playableLength = useMemo(() => {
    let b = createInitialBoard();
    let gs = createGameState();
    for (let i = 0; i < line.moves.length; i++) {
      const color = i % 2 === 0 ? "w" : "b";
      const expected = line.positions[i + 1]?.board;
      const m = findBookMove(b, gs, color, expected);
      if (!m) return i;
      const r = applyMoveWithRules(b, m, gs);
      b = r.board;
      gs = r.gameState;
    }
    return line.moves.length;
  }, [line]);

  const totalMoves = playableLength;

  const [board, setBoard] = useState(() => createInitialBoard());
  const [gameState, setGameState] = useState(() => createGameState());
  const [step, setStep] = useState(0); // number of book moves played so far
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type, text }
  const [hintLevel, setHintLevel] = useState(0); // 0 = none, 1 = piece only, 2 = full move
  const [ariaMsg, setAriaMsg] = useState("");
  const opponentTimerRef = useRef(null);

  // Reset whenever the opening or variation changes.
  const lineKey = `${opening.id}|${variantId ?? ""}`;
  const [prevLineKey, setPrevLineKey] = useState(lineKey);
  if (prevLineKey !== lineKey) {
    setPrevLineKey(lineKey);
    setBoard(createInitialBoard());
    setGameState(createGameState());
    setStep(0);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setFeedback(null);
    setHintLevel(0);
    setAriaMsg("");
  }

  function reset() {
    setBoard(createInitialBoard());
    setGameState(createGameState());
    setStep(0);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setFeedback(null);
    setHintLevel(0);
    setAriaMsg("Practice reset");
    playGameStart();
  }

  // Whose turn is it given step (0 = white to move, 1 = black, ...).
  const turnColor = step % 2 === 0 ? "w" : "b";
  const isUserTurn = turnColor === userColor;
  const isComplete = step >= totalMoves;

  // Compute the expected book move (for the side currently to move).
  const bookMove = useMemo(() => {
    if (isComplete) return null;
    const expected = line.positions[step + 1]?.board;
    return findBookMove(board, gameState, turnColor, expected);
  }, [board, gameState, step, line.positions, turnColor, isComplete]);

  // Auto-play the opponent's book move when it's their turn.
  useEffect(() => {
    if (isComplete || isUserTurn || !bookMove) return undefined;
    opponentTimerRef.current = setTimeout(() => {
      const isCapture = Boolean(board[bookMove.tr][bookMove.tc]) || bookMove.enPassant;
      const { board: nextBoard, gameState: nextState } =
        applyMoveWithRules(board, bookMove, gameState);
      if (isCapture) playCapture(); else playMove();
      setBoard(nextBoard);
      setGameState(nextState);
      setLastMove([
        { r: bookMove.r, c: bookMove.c },
        { r: bookMove.tr, c: bookMove.tc },
      ]);
      setStep((s) => s + 1);
      setHintLevel(0);
      const san = line.moves[step] ?? "";
      setAriaMsg(`Opponent plays ${san}`);
    }, 450);
    return () => {
      if (opponentTimerRef.current) {
        clearTimeout(opponentTimerRef.current);
        opponentTimerRef.current = null;
      }
    };
  }, [isComplete, isUserTurn, bookMove, board, gameState, line.moves, step]);

  // Cleanup pending timers on unmount.
  useEffect(() => () => {
    if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
  }, []);

  function tryUserMove(move) {
    const expected = line.positions[step + 1]?.board;
    const { board: nextBoard, gameState: nextState } =
      applyMoveWithRules(board, move, gameState);

    if (!boardsEqual(nextBoard, expected)) {
      // Not the book move — reject without revealing the answer.
      playIllegal();
      setFeedback({
        type: "error",
        text: `That's not the book move. Try again — or click "Show hint" if you're stuck.`,
      });
      setSelected(null);
      setLegalMoves([]);
      setAriaMsg("Incorrect — try again");
      return;
    }

    // Correct! Apply it.
    const isCapture = Boolean(board[move.tr][move.tc]) || move.enPassant;
    if (isCapture) playCapture(); else playMove();
    setBoard(nextBoard);
    setGameState(nextState);
    setLastMove([
      { r: move.r, c: move.c },
      { r: move.tr, c: move.tc },
    ]);
    setStep((s) => s + 1);
    setSelected(null);
    setLegalMoves([]);
    setHintLevel(0);
    const san = line.moves[step] ?? "";
    if (step + 1 >= totalMoves) {
      setFeedback({
        type: "complete",
        text: `🎉 You played the ${lineLabel} all the way through! Reset to try again.`,
      });
      setAriaMsg(`Correct — ${san}. Line complete.`);
    } else {
      setFeedback({ type: "success", text: `✓ Correct — ${san}.` });
      setAriaMsg(`Correct — ${san}`);
    }
  }

  function onSquareClick(r, c) {
    if (isComplete || !isUserTurn) return;

    const piece = board[r][c];
    const isOwnPiece = piece && piece[0] === userColor;
    const candidate = legalMoves.find((m) => m.tr === r && m.tc === c);

    if (selected && candidate) {
      tryUserMove(candidate);
      return;
    }

    if (isOwnPiece) {
      setSelected({ r, c });
      setLegalMoves(getLegalMovesWithRules(board, r, c, gameState));
      return;
    }

    if (selected) playIllegal();
    setSelected(null);
    setLegalMoves([]);
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const dragValidDrop = useRef(false);
  const [draggingSquare, setDraggingSquare] = useState(null);

  function onDragStart(e, r, c) {
    if (isComplete || !isUserTurn) { e.preventDefault(); return; }
    const piece = board[r][c];
    if (!piece || piece[0] !== userColor) { e.preventDefault(); return; }
    const ghost = document.createElement("div");
    ghost.textContent = PIECES[piece];
    ghost.style.cssText =
      "position:fixed;top:-200px;font-size:3.2rem;pointer-events:none;";
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

  // ── Hint highlight squares ────────────────────────────────────────────────
  // hintLevel 0 = no hint, 1 = highlight piece to move, 2 = reveal full move
  const hintSquares = useMemo(() => {
    if (!bookMove || !isUserTurn || hintLevel === 0) return [];
    if (hintLevel === 1) return [[bookMove.r, bookMove.c]];
    return [
      [bookMove.r, bookMove.c],
      [bookMove.tr, bookMove.tc],
    ];
  }, [hintLevel, bookMove, isUserTurn]);

  const onShowHint = useCallback(() => {
    if (!isUserTurn || !bookMove) return;
    playNavStep();
    if (hintLevel === 0) {
      const piece = board[bookMove.r][bookMove.c];
      const pieceNames = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" };
      const pieceName = pieceNames[piece?.[1]] ?? "piece";
      const from = squareLabel(bookMove.r, bookMove.c);
      setHintLevel(1);
      setFeedback({
        type: "hint",
        text: `Hint: move your ${pieceName} on ${from}. Click "Show hint" again to reveal the full move.`,
      });
      setAriaMsg(`Hint: move your ${pieceName} on ${from}`);
    } else {
      const from = squareLabel(bookMove.r, bookMove.c);
      const to = squareLabel(bookMove.tr, bookMove.tc);
      const san = line.moves[step] ?? "";
      setHintLevel(2);
      setFeedback({
        type: "hint",
        text: `Hint: play ${san} (${from} → ${to}).`,
      });
      setAriaMsg(`Hint: ${san}`);
    }
  }, [isUserTurn, bookMove, board, hintLevel, line.moves, step]);

  // ── Status pill text ──────────────────────────────────────────────────────
  let statusText;
  if (isComplete) {
    statusText = `🏁 Line complete — ${lineLabel}`;
  } else if (isUserTurn) {
    statusText = `Your move — you are ${userColor === "w" ? "White" : "Black"}`;
  } else {
    statusText = "Opponent thinking…";
  }

  return (
    <div className="fade-in">
      {/* Screen-reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaMsg}</div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
          <div>
            <div className="page-title" style={{marginBottom:0}}>Practice: {opening.name}</div>
            <div className="page-subtitle" style={{marginBottom:0}}>
              <strong>{lineLabel}</strong> — Move {step} of {totalMoves}. You play <strong>{userColor === "w" ? "White" : "Black"}</strong>.
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
          <span className="status-pill">{statusText}</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onShowHint}
            disabled={!isUserTurn || !bookMove || isComplete || hintLevel >= 2}
            title={hintLevel === 0 ? "Highlight which piece to move" : hintLevel === 1 ? "Reveal the full book move" : "Hint already revealed"}
          >💡 {hintLevel === 0 ? "Show hint" : hintLevel === 1 ? "Reveal move" : "Hint shown"}</button>
          <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="board-wrap">
        <div className="board-outer" style={{outline:"none"}}>
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
                  const isHint = hintSquares.some(([hr, hc]) => hr === ri && hc === ci);
                  const isOwn = Boolean(piece && piece[0] === userColor && isUserTurn && !isComplete);
                  const isSelectable = isUserTurn && !isComplete && (isOwn || Boolean(legalMove) || isSelected);
                  const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
                  const className = [
                    "sq",
                    isLight ? "light" : "dark",
                    isMoved && "moved",
                    isHint && "highlight",
                    isSelected && "selected",
                    isLegalEmpty && "legal-empty",
                    isLegalCapture && "legal-capture",
                    isSelectable && "selectable",
                    isOwn && "piece-grabbable",
                    isDragging && "dragging",
                  ].filter(Boolean).join(" ");
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={className}
                      draggable={isOwn}
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
          {/* Variation picker */}
          {variations.length > 0 && (
            <div style={{marginBottom:"1rem"}}>
              <div className="move-list-title">Variation</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                <button
                  type="button"
                  className={`btn btn-sm ${variantId===null?"":"btn-outline"}`}
                  onClick={() => setVariantId(null)}>Main Line</button>
                {variations.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    className={`btn btn-sm ${variantId===v.id?"":"btn-outline"}`}
                    onClick={() => setVariantId(v.id)}>{v.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Move list (highlights moves that have been played) */}
          <div className="move-list-title">Moves played</div>
          <div className="move-list">
            <div className="move-chip active" style={step===0?{}:{opacity:0.6}}>Start</div>
            {line.moves.slice(0, totalMoves).map((m, i) => {
              const played = i < step;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"3px"}}>
                  {i % 2 === 0 && <span className="move-number">{Math.floor(i/2)+1}.</span>}
                  <div
                    className={`move-chip ${played?"active":""}`}
                    style={played?{}:{opacity:0.45}}
                  >{m}</div>
                </div>
              );
            })}
          </div>

          {/* Feedback box */}
          {feedback && (
            <div
              role="status"
              style={{
                marginBottom:"1rem",
                padding:"0.6rem 0.8rem",
                borderRadius:"8px",
                fontSize:"0.85rem",
                lineHeight:1.5,
                border:"1px solid",
                borderColor:
                  feedback.type === "error" ? "#E5B4B4" :
                  feedback.type === "hint"  ? "#F0E2C4" :
                  "#BFE3C2",
                background:
                  feedback.type === "error" ? "#FBECEC" :
                  feedback.type === "hint"  ? "#FFF8EE" :
                  "#EFF9F0",
                color:"#4A3F35",
              }}
            >
              {feedback.text}
            </div>
          )}

          <div className="annotation">
            {line.positions[step]?.annotation}
          </div>

          <div style={{marginTop:"1.25rem"}}>
            <div className="card-title" style={{fontSize:"0.88rem",marginBottom:"0.5rem"}}>
              How practice works
            </div>
            <ul style={{paddingLeft:"1.2rem",fontSize:"0.82rem",color:"#4A3F35",lineHeight:"1.7"}}>
              <li>Drag or click a piece to make your move when it’s your turn.</li>
              <li>If your move matches the opening theory, the system plays the reply automatically.</li>
              <li>Stuck? Press <strong>💡 Show hint</strong> once to highlight the piece to move; press it again to reveal the full book move.</li>
              <li>Press <strong>Reset</strong> to start the line over.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
