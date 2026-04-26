// ── chess-core.js ─────────────────────────────────────────────────────────────
// Central re-export hub. Import from this file to access all chess utilities,
// data, and rules without needing to know the internal module layout.

// ── Chess rules engine ───────────────────────────────────────────────────────
export {
  createGameState,
  isSquareAttacked,
  findKing,
  isInCheck,
  getLegalMovesWithRules,
  getAllLegalMoves,
  applyMoveWithRules,
  getGameStatus,
} from "./chess-rules.js";

// ── Board constants and utilities ────────────────────────────────────────────
export {
  PIECES,
  START,
  createInitialBoard,
  getLegalMoves,
  applyLocalMove,
  applyMoves,
  cloneBoard,
  applyBoardMove,
  evaluateBoard,
  generatePseudoLegalMoves,
  getEngineRecommendation,
  formatMove,
} from "./chess-board.js";

// ── Opening library ──────────────────────────────────────────────────────────
export { OPENINGS } from "./chess-openings.js";

// ── Educational content ──────────────────────────────────────────────────────
export { CONCEPTS, QUIZZES } from "./chess-content.js";
