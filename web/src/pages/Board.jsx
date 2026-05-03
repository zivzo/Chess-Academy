// ── Reusable read-only / interactive board view ────────────────────────────
import { PIECES } from "../chess-core.js";

export default function Board({
  board,
  flipped = false,
  size = 56,
  selected = null,
  legalMoves = [],
  lastMove = null,
  kingInCheck = null,
  onSquareClick,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingSquare = null,
}) {
  const rows = flipped
    ? board.map((row, i) => ({ ri: 7 - i, row: [...row].reverse() }))
    : board.map((row, i) => ({ ri: i, row }));
  // When flipped we still need correct (ri, ci) for events; figure out ci from index.
  const filesOrder = flipped ? ["h","g","f","e","d","c","b","a"] : ["a","b","c","d","e","f","g","h"];
  const ranksOrder = flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];

  return (
    <div className="board-outer">
      <div className="board-files">
        {filesOrder.map(f => <div key={f} className="board-file-label" style={{ width: size }}>{f}</div>)}
      </div>
      <div className="board-labels-row">
        <div style={{display:"flex",flexDirection:"column"}}>
          {ranksOrder.map(r => <div key={r} className="board-rank-label" style={{ lineHeight: `${size}px` }}>{r}</div>)}
        </div>
        <div className="board" style={{
          gridTemplateColumns: `repeat(8, ${size}px)`,
          gridTemplateRows: `repeat(8, ${size}px)`,
        }}>
          {rows.map(({ ri, row }) =>
            row.map((piece, idx) => {
              const ci = flipped ? 7 - idx : idx;
              const isLight = (ri + ci) % 2 === 0;
              const isSelected = selected?.r === ri && selected?.c === ci;
              const legalMove = legalMoves.find?.((m) => m.tr === ri && m.tc === ci);
              const isLegalEmpty = Boolean(legalMove && !board[ri][ci]);
              const isLegalCapture = Boolean(legalMove && board[ri][ci]);
              const isMoved = Boolean(lastMove?.some?.(sq => sq.r === ri && sq.c === ci));
              const isDragging = draggingSquare?.r === ri && draggingSquare?.c === ci;
              const isInCheck = kingInCheck && kingInCheck[0] === ri && kingInCheck[1] === ci;
              const className = [
                "sq",
                isLight ? "light" : "dark",
                isMoved && "moved",
                isSelected && "selected",
                isLegalEmpty && "legal-empty",
                isLegalCapture && "legal-capture",
                isDragging && "dragging",
                isInCheck && "in-check",
              ].filter(Boolean).join(" ");
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={className}
                  style={{ width: size, height: size, fontSize: `${size * 0.55}px` }}
                  draggable={draggable && Boolean(piece)}
                  onClick={() => onSquareClick?.(ri, ci)}
                  onDragStart={(e) => onDragStart?.(e, ri, ci)}
                  onDragOver={(e) => onDragOver?.(e, ri, ci)}
                  onDrop={(e) => onDrop?.(e, ri, ci)}
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
  );
}
