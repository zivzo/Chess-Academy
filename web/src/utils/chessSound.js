// ── Chess sound effects via Web Audio API ─────────────────────────────────────
// All sounds are synthesised on-the-fly — no external audio files needed.
// The mute state lives in a plain JS module variable (not localStorage, which
// is blocked in sandboxed iframes).
//
// Default: muted when the user has `prefers-reduced-motion: reduce` set.

let _muted =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let _ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      return null;
    }
  }
  // Browsers suspend the context until a user gesture — resume if needed.
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

/** Synthesise a single tone. */
function tone(ctx, freq, type, gainStart, gainEnd, duration, startOffset = 0) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    gain.gain.setValueAtTime(gainStart, ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(gainEnd, 0.0001),
      ctx.currentTime + startOffset + duration,
    );
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  } catch (_) {
    // Gracefully ignore any AudioContext errors.
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isMuted() { return _muted; }
export function setMuted(val) { _muted = Boolean(val); }
export function toggleMute() { _muted = !_muted; return _muted; }

/** Quiet neutral "thud" for a normal move. */
export function playMove() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  tone(ctx, 240, "sine", 0.28, 0.0001, 0.09);
}

/** Sharper "clack" for captures. */
export function playCapture() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  tone(ctx, 360, "square", 0.22, 0.0001, 0.11);
  tone(ctx, 180, "sine",   0.14, 0.0001, 0.09);
}

/** Rising two-note alert for check. */
export function playCheck() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  tone(ctx, 480, "sine", 0.32, 0.0001, 0.09);
  tone(ctx, 640, "sine", 0.26, 0.0001, 0.11, 0.09);
}

/** Dramatic descending chord for checkmate. */
export function playCheckmate() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  [880, 740, 622, 440].forEach((freq, i) =>
    tone(ctx, freq, "sine", 0.38, 0.0001, 0.22, i * 0.22),
  );
}

/** Low buzz for an illegal move attempt. */
export function playIllegal() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  tone(ctx, 110, "sawtooth", 0.18, 0.0001, 0.12);
}

/** Soft rising chime for game start / board reset. */
export function playGameStart() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  [330, 440, 550].forEach((freq, i) =>
    tone(ctx, freq, "sine", 0.28, 0.0001, 0.14, i * 0.14),
  );
}

/** Very soft click for history-navigation steps. */
export function playNavStep() {
  if (_muted) return;
  const ctx = getCtx(); if (!ctx) return;
  tone(ctx, 200, "sine", 0.10, 0.0001, 0.06);
}
