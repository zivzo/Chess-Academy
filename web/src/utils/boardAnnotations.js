// ── Board annotation helpers (right-click highlights & arrows) ───────────────
// Pure functions so they can be unit-tested without a DOM.

/**
 * Converts a point (relative to the top-left of the playable 8×8 area) into
 * a board square.
 * @param {number} x    - Horizontal offset in px.
 * @param {number} y    - Vertical offset in px.
 * @param {number} size - Side length of the playable area in px.
 * @returns {{ r: number, c: number } | null} null when outside the board.
 */
export function squareFromPoint(x, y, size) {
  if (!(size > 0) || x < 0 || y < 0 || x >= size || y >= size) return null;
  const cell = size / 8;
  return { r: Math.floor(y / cell), c: Math.floor(x / cell) };
}

export function sameSquare(a, b) {
  return Boolean(a && b && a.r === b.r && a.c === b.c);
}

export function hasSquare(squares, r, c) {
  return squares.some((sq) => sq.r === r && sq.c === c);
}

/** Adds the square if absent, removes it if already present. */
export function toggleSquare(squares, sq) {
  return hasSquare(squares, sq.r, sq.c)
    ? squares.filter((s) => !sameSquare(s, sq))
    : [...squares, { r: sq.r, c: sq.c }];
}

/** Adds the arrow if absent, removes it if the same arrow already exists. */
export function toggleArrow(arrows, from, to) {
  const exists = arrows.some((a) => sameSquare(a.from, from) && sameSquare(a.to, to));
  return exists
    ? arrows.filter((a) => !(sameSquare(a.from, from) && sameSquare(a.to, to)))
    : [...arrows, { from: { r: from.r, c: from.c }, to: { r: to.r, c: to.c } }];
}

const round = (n) => Math.round(n * 1000) / 1000;

/**
 * Builds SVG polygon points for an arrow between two square centres, in board
 * units (one square = 1 unit, so the board spans a 0 0 8 8 viewBox).
 * @returns {string} "x,y x,y …" or "" when from === to.
 */
export function arrowPoints(from, to, {
  shaftWidth = 0.2,
  headWidth = 0.55,
  headLength = 0.45,
  tipInset = 0.1,
} = {}) {
  const sx = from.c + 0.5, sy = from.r + 0.5;
  const dx = to.c - from.c, dy = to.r - from.r;
  const len = Math.hypot(dx, dy);
  if (len === 0) return "";
  const ux = dx / len, uy = dy / len;   // unit direction
  const nx = -uy, ny = ux;              // unit normal
  const tipLen = len - tipInset;
  const baseLen = Math.max(0, tipLen - headLength);
  const at = (along, side) => `${round(sx + ux * along + nx * side)},${round(sy + uy * along + ny * side)}`;
  return [
    at(0, shaftWidth / 2),
    at(baseLen, shaftWidth / 2),
    at(baseLen, headWidth / 2),
    at(tipLen, 0),
    at(baseLen, -headWidth / 2),
    at(baseLen, -shaftWidth / 2),
    at(0, -shaftWidth / 2),
  ].join(" ");
}
