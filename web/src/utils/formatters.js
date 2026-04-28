// ── Display formatting helpers ────────────────────────────────────────────────

/**
 * Returns a human-readable label for a given engine rating.
 * @param {number} rating - Elo rating (200–3000).
 * @returns {{ label: string, css: string }}
 */
export function strengthLabel(rating) {
  if (rating < 600)  return { label: "Beginner",   css: "beginner" };
  if (rating < 1000) return { label: "Casual",     css: "casual" };
  if (rating < 1600) return { label: "Club",       css: "club" };
  if (rating < 2200) return { label: "Advanced",   css: "advanced" };
  return                     { label: "Master",     css: "master" };
}

/**
 * Formats a numeric evaluation into a display string like "+1.5" or "M3".
 * @param {number|null} evaluation - Evaluation in pawns.
 * @param {number|null} mate       - Mate-in-N (null when no forced mate).
 * @returns {string}
 */
export function formatEval(evaluation, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  }
  if (evaluation === null || evaluation === undefined) return "0.0";
  const sign = evaluation > 0 ? "+" : evaluation < 0 ? "" : "±";
  return `${sign}${evaluation.toFixed(1)}`;
}
