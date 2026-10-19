import test from "node:test";
import assert from "node:assert/strict";
import {
  squareFromPoint,
  hasSquare,
  toggleSquare,
  toggleArrow,
  arrowPoints,
} from "../web/src/utils/boardAnnotations.js";

test("squareFromPoint maps pixel offsets to board squares", () => {
  assert.deepEqual(squareFromPoint(0, 0, 576), { r: 0, c: 0 });
  assert.deepEqual(squareFromPoint(575, 575, 576), { r: 7, c: 7 });
  assert.deepEqual(squareFromPoint(4 * 72 + 10, 6 * 72 + 1, 576), { r: 6, c: 4 });
});

test("squareFromPoint returns null outside the board", () => {
  assert.equal(squareFromPoint(-1, 10, 576), null);
  assert.equal(squareFromPoint(10, 576, 576), null);
  assert.equal(squareFromPoint(10, 10, 0), null);
});

test("toggleSquare adds then removes a highlight", () => {
  const once = toggleSquare([], { r: 4, c: 4 });
  assert.ok(hasSquare(once, 4, 4));
  const twice = toggleSquare(once, { r: 4, c: 4 });
  assert.deepEqual(twice, []);
});

test("toggleArrow adds then removes the same arrow and keeps others", () => {
  const e2 = { r: 6, c: 4 }, e4 = { r: 4, c: 4 }, d4 = { r: 4, c: 3 };
  let arrows = toggleArrow([], e2, e4);
  arrows = toggleArrow(arrows, e2, d4);
  assert.equal(arrows.length, 2);
  arrows = toggleArrow(arrows, e2, e4);
  assert.deepEqual(arrows, [{ from: e2, to: d4 }]);
  // Reverse direction is a different arrow
  arrows = toggleArrow(arrows, d4, e2);
  assert.equal(arrows.length, 2);
});

test("arrowPoints builds a 7-point polygon ending near the target centre", () => {
  const pts = arrowPoints({ r: 6, c: 4 }, { r: 4, c: 4 }).split(" ");
  assert.equal(pts.length, 7);
  const [tipX, tipY] = pts[3].split(",").map(Number);
  assert.equal(tipX, 4.5);
  assert.ok(Math.abs(tipY - 4.6) < 1e-9);
  assert.equal(arrowPoints({ r: 1, c: 1 }, { r: 1, c: 1 }), "");
});
