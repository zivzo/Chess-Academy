// ── Client-side FEN / PGN helpers ───────────────────────────────────────────
// Mirrors the server's chess-engine helpers. Used when posting finished games
// to the API so the AnalysisPage can replay any saved position from FEN.

const FILES = "abcdefgh";
const PIECE_TO_FEN = {
  wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
  bK: "k", bQ: "q", bR: "r", bB: "b", bN: "n", bP: "p",
};

export function squareName(r, c) {
  return `${FILES[c]}${8 - r}`;
}

export function moveToUci(move) {
  const from = squareName(move.r, move.c);
  const to = squareName(move.tr, move.tc);
  let promo = "";
  if (move.promotion) {
    const p = typeof move.promotion === "string" ? move.promotion.toLowerCase() : "q";
    promo = "qrbn".includes(p) ? p : "q";
  }
  return `${from}${to}${promo}`;
}

export function boardToFen(board, turn, gameState, halfmove = 0, fullmove = 1) {
  const ranks = [];
  for (let r = 0; r < 8; r++) {
    let rank = "";
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) { empty++; continue; }
      if (empty > 0) { rank += String(empty); empty = 0; }
      rank += PIECE_TO_FEN[p] || "?";
    }
    if (empty > 0) rank += String(empty);
    ranks.push(rank);
  }
  const placement = ranks.join("/");
  let castling = "";
  if (gameState?.castlingRights?.wK) castling += "K";
  if (gameState?.castlingRights?.wQ) castling += "Q";
  if (gameState?.castlingRights?.bK) castling += "k";
  if (gameState?.castlingRights?.bQ) castling += "q";
  if (!castling) castling = "-";
  const ep = gameState?.enPassantSquare
    ? squareName(gameState.enPassantSquare.r, gameState.enPassantSquare.c)
    : "-";
  return `${placement} ${turn} ${castling} ${ep} ${halfmove} ${fullmove}`;
}

// Parse a FEN piece-placement string back into an 8×8 board.
export function fenToBoard(fen) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const placement = String(fen).split(" ")[0] || "";
  const ranks = placement.split("/");
  if (ranks.length !== 8) return board;
  const FROM_FEN = Object.fromEntries(
    Object.entries(PIECE_TO_FEN).map(([k, v]) => [v, k]),
  );
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of ranks[r]) {
      if (/[1-8]/.test(ch)) c += Number(ch);
      else if (FROM_FEN[ch]) { board[r][c] = FROM_FEN[ch]; c++; }
      else c++;
    }
  }
  return board;
}

// Build a minimal but valid PGN from a list of SAN moves and metadata.
export function buildPgn({ white, black, result, date, event = "Chess Academy", sanMoves }) {
  const tags = [
    `[Event "${event}"]`,
    `[Site "Chess Academy"]`,
    `[Date "${(date || new Date().toISOString()).slice(0, 10).replaceAll("-", ".")}"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result || "*"}"]`,
  ].join("\n");
  let body = "";
  for (let i = 0; i < sanMoves.length; i++) {
    if (i % 2 === 0) body += `${(i / 2) + 1}. `;
    body += `${sanMoves[i]} `;
  }
  body += result || "*";
  return `${tags}\n\n${body.trim()}\n`;
}

// SAN-ish builder matching the server's. Sufficient for game-history display.
export function moveToSan(board, move, gameState, getLegalMovesWithRules) {
  const piece = board[move.r][move.c];
  if (!piece) return moveToUci(move);
  if (move.castling === "K") return "O-O";
  if (move.castling === "Q") return "O-O-O";
  const kind = piece[1];
  const dest = squareName(move.tr, move.tc);
  const isCapture = Boolean(board[move.tr][move.tc]) || move.enPassant;
  if (kind === "P") {
    let san = isCapture ? `${FILES[move.c]}x${dest}` : dest;
    if (move.promotion) san += "=Q";
    return san;
  }
  // Disambiguate
  const color = piece[0];
  let needFile = false, needRank = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === move.r && c === move.c) continue;
      const other = board[r][c];
      if (other !== `${color}${kind}`) continue;
      const others = getLegalMovesWithRules(board, r, c, gameState);
      if (others.some(m => m.tr === move.tr && m.tc === move.tc)) {
        if (c !== move.c) needFile = true; else needRank = true;
      }
    }
  }
  let disambig = "";
  if (needFile) disambig += FILES[move.c];
  if (needRank) disambig += String(8 - move.r);
  return `${kind}${disambig}${isCapture ? "x" : ""}${dest}`;
}

export function uciToCoords(uci) {
  if (typeof uci !== "string" || uci.length < 4) return null;
  const fc = FILES.indexOf(uci[0]);
  const fr = 8 - Number(uci[1]);
  const tc = FILES.indexOf(uci[2]);
  const tr = 8 - Number(uci[3]);
  if (fc < 0 || tc < 0 || isNaN(fr) || isNaN(tr)) return null;
  return { r: fr, c: fc, tr, tc };
}

export function formatTimeMs(ms) {
  if (ms == null || isNaN(ms)) return "--:--";
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
