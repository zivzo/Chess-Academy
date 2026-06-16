import { PIECE_UNICODE } from '../../chess/constants.js';

export default function Square({ piece, isLight, isSelected, isLegalMove, isLastMove, isCheck, onClick, onDragStart, onDragOver, onDrop }) {
  let cls = `sq ${isLight ? 'light' : 'dark'}`;
  if (isSelected) cls += ' selected-sq';
  else if (isLastMove) cls += ' last-move';
  if (isCheck) cls += ' check-sq';

  return (
    <div
      className={cls}
      onClick={onClick}
      onDragOver={e => { e.preventDefault(); if (onDragOver) onDragOver(e); }}
      onDrop={e => { e.preventDefault(); if (onDrop) onDrop(e); }}
    >
      {piece && (
        <span
          draggable
          onDragStart={onDragStart}
          style={{ cursor: 'grab', fontSize: '2.2rem', lineHeight: 1, userSelect: 'none' }}
        >
          {PIECE_UNICODE[piece]}
        </span>
      )}
      {isLegalMove && (
        piece
          ? <div className="legal-ring" />
          : <div className="legal-dot" />
      )}
    </div>
  );
}
