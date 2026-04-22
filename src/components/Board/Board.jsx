import Square from './Square.jsx';

export default function Board({ board, legalMovesMap, selectedSquare, lastMove, checkSquare, onSquareClick, onDrop, flipped }) {
  const rows = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const cols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const files = flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
  const ranks = flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];

  function isLegal(r, c) {
    if (!legalMovesMap) return false;
    return legalMovesMap.some(m => m.tr === r && m.tc === c);
  }

  return (
    <div className="board-outer">
      <div className="board-files">
        <div style={{ width: 22 }} />
        {files.map(f => <div key={f} className="board-file-label">{f}</div>)}
      </div>
      <div className="board-labels-row">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ranks.map(r => <div key={r} className="board-rank-label">{r}</div>)}
        </div>
        <div className="board">
          {rows.map(ri =>
            cols.map(ci => {
              const piece = board[ri][ci];
              const isLight = (ri + ci) % 2 === 0;
              const isSel = selectedSquare && selectedSquare.r === ri && selectedSquare.c === ci;
              const isLM = isLegal(ri, ci);
              const isLast = lastMove && (
                (lastMove.r === ri && lastMove.c === ci) ||
                (lastMove.tr === ri && lastMove.tc === ci)
              );
              const isChk = checkSquare && checkSquare.r === ri && checkSquare.c === ci;
              return (
                <Square
                  key={`${ri}-${ci}`}
                  piece={piece}
                  isLight={isLight}
                  isSelected={!!isSel}
                  isLegalMove={isLM}
                  isLastMove={!!(isLast && !isSel)}
                  isCheck={!!isChk}
                  onClick={() => onSquareClick && onSquareClick(ri, ci)}
                  onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ r: ri, c: ci }))}
                  onDrop={e => {
                    const text = e.dataTransfer.getData('text/plain');
                    if (!text) return;
                    const from = JSON.parse(text);
                    onDrop && onDrop(from, { r: ri, c: ci });
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
