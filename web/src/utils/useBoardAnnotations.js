// ── Right-click board annotations hook ───────────────────────────────────────
// Right-click a square (without moving) to toggle a highlight on it.
// Right-click and drag to another square to toggle an arrow between them.
// Any left-click on the board clears all annotations (like lichess/chess.com).
// Annotations belong to the position they were drawn on: once `positionKey`
// changes (a move is played or history is navigated) they are discarded.
import { useRef, useState } from "react";
import { sameSquare, squareFromPoint, toggleArrow, toggleSquare } from "./boardAnnotations.js";

const EMPTY = { squares: [], arrows: [] };

function eventSquare(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  return squareFromPoint(
    e.clientX - rect.left - el.clientLeft,
    e.clientY - rect.top - el.clientTop,
    el.clientWidth,
  );
}

export function useBoardAnnotations(positionKey) {
  const [annotations, setAnnotations] = useState({ key: positionKey, ...EMPTY });
  const [drawing, setDrawing] = useState(null); // { from, to } while right button is held
  const drawStart = useRef(null);

  const current = annotations.key === positionKey ? annotations : EMPTY;
  const hasAnnotations = current.squares.length > 0 || current.arrows.length > 0;

  function update(fn) {
    setAnnotations((prev) => {
      const base = prev.key === positionKey ? prev : EMPTY;
      return { key: positionKey, ...fn(base) };
    });
  }

  function clear() {
    if (hasAnnotations) setAnnotations({ key: positionKey, ...EMPTY });
  }

  function cancelDrawing() {
    drawStart.current = null;
    setDrawing(null);
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      cancelDrawing();
      clear();
      return;
    }
    if (e.button !== 2) return;
    const sq = eventSquare(e);
    if (!sq) return;
    drawStart.current = sq;
    setDrawing({ from: sq, to: sq });
  }

  function onMouseMove(e) {
    const from = drawStart.current;
    if (!from) return;
    const sq = eventSquare(e);
    if (!sq) return;
    setDrawing((prev) => (prev && sameSquare(prev.to, sq) ? prev : { from, to: sq }));
  }

  function onMouseUp(e) {
    if (e.button !== 2) return;
    const from = drawStart.current;
    const to = eventSquare(e);
    cancelDrawing();
    if (!from || !to) return;
    if (sameSquare(from, to)) {
      update((base) => ({ squares: toggleSquare(base.squares, to), arrows: base.arrows }));
    } else {
      update((base) => ({ squares: base.squares, arrows: toggleArrow(base.arrows, from, to) }));
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  const preview = drawing && !sameSquare(drawing.from, drawing.to) ? drawing : null;

  return {
    squares: current.squares,
    arrows: current.arrows,
    preview,
    boardHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: cancelDrawing,
      onContextMenu,
    },
  };
}
