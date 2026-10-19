// ── SVG overlay that draws right-click arrows on top of the board ────────────
import { arrowPoints } from "../utils/boardAnnotations.js";

export default function BoardAnnotationsOverlay({ arrows, preview }) {
  if (arrows.length === 0 && !preview) return null;
  return (
    <svg className="board-annotations" viewBox="0 0 8 8" aria-hidden="true">
      {arrows.map((a) => (
        <polygon
          key={`${a.from.r}${a.from.c}-${a.to.r}${a.to.c}`}
          className="board-arrow"
          points={arrowPoints(a.from, a.to)}
        />
      ))}
      {preview && (
        <polygon className="board-arrow preview" points={arrowPoints(preview.from, preview.to)} />
      )}
    </svg>
  );
}
