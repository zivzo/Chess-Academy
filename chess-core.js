// ── Chess pieces unicode map ────────────────────────────────────────────────
export const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

// ── Starting position ───────────────────────────────────────────────────────
export const START = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

// ── Apply moves helper (simplified) ────────────────────────────────────────
export function applyMoves(moves) {
  const board = START.map(r => [...r]);
  for (const m of moves) {
    const piece = board[m.r][m.c];
    board[m.tr][m.tc] = piece;
    board[m.r][m.c] = null;
  }
  return board;
}

export function cloneBoard(board) {
  return board.map(rank => [...rank]);
}

export function applyBoardMove(board, move) {
  const next = cloneBoard(board);
  next[move.tr][move.tc] = next[move.r][move.c];
  next[move.r][move.c] = null;
  return next;
}

const PIECE_VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const KNIGHT_DELTAS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];
const FILES = "abcdefgh";

function isInside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isOpponent(piece, side) {
  return piece && piece[0] !== side;
}

export function evaluateBoard(board) {
  let score = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece[1]] ?? 0;
      score += piece[0] === "w" ? value : -value;
    }
  }
  return score;
}

export function generatePseudoLegalMoves(board, side) {
  const moves = [];

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = board[r][c];
      if (!piece || piece[0] !== side) continue;
      const kind = piece[1];

      if (kind === "P") {
        const dir = side === "w" ? -1 : 1;
        const startRank = side === "w" ? 6 : 1;
        const oneStep = r + dir;
        if (isInside(oneStep, c) && !board[oneStep][c]) {
          moves.push({ r, c, tr: oneStep, tc: c });
          const twoStep = r + (2 * dir);
          if (r === startRank && !board[twoStep][c]) {
            moves.push({ r, c, tr: twoStep, tc: c });
          }
        }
        for (const dc of [-1, 1]) {
          const tr = r + dir;
          const tc = c + dc;
          if (isInside(tr, tc) && isOpponent(board[tr][tc], side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      if (kind === "N") {
        for (const [dr, dc] of KNIGHT_DELTAS) {
          const tr = r + dr;
          const tc = c + dc;
          if (!isInside(tr, tc)) continue;
          const target = board[tr][tc];
          if (!target || isOpponent(target, side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      if (kind === "K") {
        for (const [dr, dc] of KING_DELTAS) {
          const tr = r + dr;
          const tc = c + dc;
          if (!isInside(tr, tc)) continue;
          const target = board[tr][tc];
          if (!target || isOpponent(target, side)) {
            moves.push({ r, c, tr, tc });
          }
        }
        continue;
      }

      const directions = [];
      if (kind === "B" || kind === "Q") directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (kind === "R" || kind === "Q") directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of directions) {
        let tr = r + dr;
        let tc = c + dc;
        while (isInside(tr, tc)) {
          const target = board[tr][tc];
          if (!target) {
            moves.push({ r, c, tr, tc });
          } else {
            if (isOpponent(target, side)) {
              moves.push({ r, c, tr, tc });
            }
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    }
  }

  return moves;
}

export function getEngineRecommendation(board, side) {
  const moves = generatePseudoLegalMoves(board, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestPerspectiveScore = -Infinity;
  let bestRawScore = 0;

  for (const move of moves) {
    const nextBoard = applyBoardMove(board, move);
    const score = evaluateBoard(nextBoard);
    const perspectiveScore = side === "w" ? score : -score;
    if (perspectiveScore > bestPerspectiveScore) {
      bestPerspectiveScore = perspectiveScore;
      bestRawScore = score;
      bestMove = move;
    }
  }

  return { ...bestMove, evaluation: bestRawScore };
}

export function formatMove(move) {
  return `${FILES[move.c]}${8 - move.r}→${FILES[move.tc]}${8 - move.tr}`;
}

// ── Opening definitions ─────────────────────────────────────────────────────
export const OPENINGS = [
  {
    id: "italian", name: "Italian Game", color: "green",
    tags: ["Opening", "Beginner-friendly"],
    diff: 1, side: "White",
    desc: "One of the oldest openings. White aims to control the center, develop quickly, and build toward a kingside attack via f4 or d3.",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    positions: [
      { board: applyMoves([]), annotation: "The starting position. White aims to control the center with pawns and develop pieces rapidly.", highlight: [] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }]), annotation: "1. e4 — Controls the center, opens lines for the bishop and queen.", highlight: [[4, 4]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 4, tr: 3, tc: 4 }]), annotation: "1...e5 — Black mirrors White, fighting for center control.", highlight: [[3, 4]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 4, tr: 3, tc: 4 }, { r: 7, c: 6, tr: 5, tc: 5 }]), annotation: "2. Nf3 — Develops a knight to a great square, attacks e5.", highlight: [[5, 5]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 4, tr: 3, tc: 4 }, { r: 7, c: 6, tr: 5, tc: 5 }, { r: 0, c: 1, tr: 2, tc: 2 }]), annotation: "2...Nc6 — Defends e5 and develops a piece.", highlight: [[2, 2]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 4, tr: 3, tc: 4 }, { r: 7, c: 6, tr: 5, tc: 5 }, { r: 0, c: 1, tr: 2, tc: 2 }, { r: 7, c: 5, tr: 4, tc: 2 }]), annotation: "3. Bc4 — The Italian! The bishop eyes the f7 pawn — Black's most vulnerable square. White is ready to castle and launch middlegame play.", highlight: [[4, 2]] },
    ],
    ideas: ["Control center with e4+d3 or d4", "Develop Nf3, Bc4, castle kingside", "Attack via f4-f5 or central break d4", "Watch for f7 weakness"],
  },
  {
    id: "london", name: "London System", color: "gold",
    tags: ["Opening", "Solid"],
    diff: 1, side: "White",
    desc: "A solid, flexible opening where White builds a strong pawn triangle (d4, e3, c3) and bishop on f4. Easy to learn, hard to crack.",
    moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
    positions: [
      { board: applyMoves([]), annotation: "Starting position. White will build a solid pawn structure.", highlight: [] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }]), annotation: "1. d4 — Controls the center. The London starts here.", highlight: [[4, 3]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 1, c: 3, tr: 3, tc: 3 }]), annotation: "1...d5 — Black contests the center symmetrically.", highlight: [[3, 3]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 1, c: 3, tr: 3, tc: 3 }, { r: 7, c: 6, tr: 5, tc: 5 }]), annotation: "2. Nf3 — Developing the knight toward the center.", highlight: [[5, 5]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 1, c: 3, tr: 3, tc: 3 }, { r: 7, c: 6, tr: 5, tc: 5 }, { r: 0, c: 6, tr: 2, tc: 5 }]), annotation: "2...Nf6 — Black develops and prepares.", highlight: [[2, 5]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 1, c: 3, tr: 3, tc: 3 }, { r: 7, c: 6, tr: 5, tc: 5 }, { r: 0, c: 6, tr: 2, tc: 5 }, { r: 7, c: 5, tr: 5, tc: 3 }]), annotation: "3. Bf4 — The London bishop! Active outside the pawn chain. White has a very solid setup. Next: e3, c3, Nbd2, Bd3.", highlight: [[5, 3]] },
    ],
    ideas: ["Build pawn triangle: d4, e3, c3", "Develop Bf4 before e3 (key move order!)", "Nbd2 supports center, avoids pins", "Queenside expansion or kingside attack possible"],
  },
  {
    id: "carokann", name: "Caro-Kann Defense", color: "red",
    tags: ["Opening", "Solid", "Black"],
    diff: 2, side: "Black",
    desc: "Black's solid answer to 1.e4. Avoids the sharp Sicilian while maintaining a strong pawn structure. Favored by positional players.",
    moves: ["e4", "c6", "d4", "d5"],
    positions: [
      { board: applyMoves([]), annotation: "Starting position. Black will answer 1.e4 with the Caro-Kann.", highlight: [] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }]), annotation: "1. e4 — White stakes a claim in the center.", highlight: [[4, 4]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 2, tr: 2, tc: 2 }]), annotation: "1...c6 — The Caro-Kann! Black prepares d5 with solid pawn support.", highlight: [[2, 2]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 2, tr: 2, tc: 2 }, { r: 6, c: 3, tr: 4, tc: 3 }]), annotation: "2. d4 — White establishes a strong center.", highlight: [[4, 3]] },
      { board: applyMoves([{ r: 6, c: 4, tr: 4, tc: 4 }, { r: 1, c: 2, tr: 2, tc: 2 }, { r: 6, c: 3, tr: 4, tc: 3 }, { r: 1, c: 3, tr: 3, tc: 3 }]), annotation: "2...d5 — Black challenges! Unlike the French, Black's light-squared bishop isn't locked in. This is the key difference.", highlight: [[3, 3]] },
    ],
    ideas: ["Solid pawn structure, no weak pawns", "Light-squared bishop is active (unlike French)", "Play ...Bf5 or ...Bg4 to develop", "Counterattack with ...c5 or ...e5 in middlegame"],
  },
  {
    id: "kingsindian", name: "King's Indian Defense", color: "green",
    tags: ["Opening", "Dynamic", "Black"],
    diff: 3, side: "Black",
    desc: "Black allows White a strong center, then launches a fierce kingside counterattack. Favored by fighters and attacking players.",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"],
    positions: [
      { board: applyMoves([]), annotation: "Starting position. The King's Indian is one of chess's most dynamic openings.", highlight: [] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }]), annotation: "1. d4 — White goes for the center.", highlight: [[4, 3]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 0, c: 6, tr: 2, tc: 5 }]), annotation: "1...Nf6 — Black develops, preparing to fianchetto.", highlight: [[2, 5]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 0, c: 6, tr: 2, tc: 5 }, { r: 6, c: 2, tr: 4, tc: 2 }]), annotation: "2. c4 — White expands, claiming even more space.", highlight: [[4, 2]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 0, c: 6, tr: 2, tc: 5 }, { r: 6, c: 2, tr: 4, tc: 2 }, { r: 1, c: 6, tr: 2, tc: 6 }]), annotation: "2...g6 — Black prepares the fianchetto bishop on g7.", highlight: [[2, 6]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 0, c: 6, tr: 2, tc: 5 }, { r: 6, c: 2, tr: 4, tc: 2 }, { r: 1, c: 6, tr: 2, tc: 6 }, { r: 7, c: 1, tr: 5, tc: 2 }]), annotation: "3. Nc3 — White develops and prepares e4.", highlight: [[5, 2]] },
      { board: applyMoves([{ r: 6, c: 3, tr: 4, tc: 3 }, { r: 0, c: 6, tr: 2, tc: 5 }, { r: 6, c: 2, tr: 4, tc: 2 }, { r: 1, c: 6, tr: 2, tc: 6 }, { r: 7, c: 1, tr: 5, tc: 2 }, { r: 0, c: 5, tr: 2, tc: 6 }]), annotation: "3...Bg7 — The King's Indian bishop! A powerful long diagonal piece that supports Black's future kingside attack with ...e5 and ...f5.", highlight: [[2, 6]] },
    ],
    ideas: ["Let White have the center — then attack it!", "Counterplay with ...e5 in the center", "Kingside attack: ...f5-f4, ...Ng4", "The g7 bishop becomes a monster in the endgame"],
  },
];

// ── Middlegame concepts ──────────────────────────────────────────────────────
export const CONCEPTS = [
  { icon: "♟", title: "Weak Squares", tag: "mid", desc: "A square that can't be defended by pawns. Knights love outposts on weak squares — place yours on d5 or e6 and it becomes a monster." },
  { icon: "🏰", title: "Rook on 7th", tag: "mid", desc: "A rook on the 7th rank terrorizes the opponent's unmoved pawns and restricts their king. Often worth a pawn or more in practical play." },
  { icon: "⚔️", title: "Piece Activity", tag: "mid", desc: "Always ask: which is my worst piece? Improving your worst piece is often the strongest plan. Active pieces win games — passive pieces lose them." },
  { icon: "🔱", title: "Pawn Majority", tag: "mid", desc: "More pawns on one flank means a passed pawn potential. Push your majority, restrain theirs. A passed pawn in the endgame is a future queen." },
  { icon: "🔒", title: "Closed vs Open Files", tag: "mid", desc: "Open files belong to rooks. Doubled rooks on an open file vs the enemy king is almost always winning. Contest open files aggressively." },
  { icon: "♾️", title: "Bishop Pair", tag: "mid", desc: "Two bishops dominate in open positions. Trade one off to cripple the pair, or keep yours active by eliminating their pawn chain." },
  { icon: "🎯", title: "Pawn Breaks", tag: "mid", desc: "A pawn break (like ...c5 or f4) opens the position for your pieces. Every middlegame has a critical pawn break — find it first." },
  { icon: "👑", title: "King Safety", tag: "mid", desc: "Before launching an attack, secure your king. A king on g1 behind h2-g2-f2 with Nf3 and Re1 is often safe enough to attack from." },
  { icon: "🧲", title: "Outpost Knight", tag: "mid", desc: "A knight on a strong outpost (can't be kicked by enemy pawns) is often worth as much as a rook. d5, e6, and f5 are classic outpost squares." },
  { icon: "⚡", title: "Initiative", tag: "mid", desc: "The player making threats keeps the initiative. Even a slightly worse position can be held if you force your opponent to react constantly." },
  { icon: "🏗️", title: "Prophylaxis", tag: "mid", desc: "Stop your opponent's plan before they execute it. Petrosian's famous technique: every move should consider what the opponent wants to do." },
  { icon: "🌀", title: "Imbalances", tag: "mid", desc: "Silman's key idea: every position has imbalances. Knight vs bishop, space vs piece activity, attack vs defense. Play to your imbalance!" },
];

// ── Quiz questions ───────────────────────────────────────────────────────────
export const QUIZZES = [
  { q: "White has a bishop on c4 pointing at f7. Black's king is on e8. What is the key weakness White is exploiting?", opts: ["The f7 pawn — Black's most vulnerable square in the opening", "The e5 pawn — easy to win with Nxe5", "Black's king being in the center", "The c6 knight is pinned"], correct: 0, explanation: "f7 is defended only by the king in the starting position, making it Black's biggest vulnerability in many open games. The Italian Game and Fried Liver Attack both exploit this square." },
  { q: "In the London System, what is the most important move order rule for the Bf4 bishop?", opts: ["Play Bf4 after e3", "Play Bf4 BEFORE playing e3 (so the bishop isn't locked in)", "Play Bf4 before d4", "Always develop Bf4 on move 1"], correct: 1, explanation: "If White plays e3 before Bf4, the light-squared bishop gets locked behind the pawn chain. The key London move order is d4, Nf3, then Bf4 — BEFORE e3." },
  { q: "What is the main strategic idea behind the Caro-Kann compared to the French Defense?", opts: ["Black gets a queenside attack", "The c6 pawn support makes Black's center stronger", "Black's light-squared bishop is NOT locked in by the pawn chain", "Black can castle queenside faster"], correct: 2, explanation: "In the French Defense, Black plays ...e6 which locks in the light-squared bishop — a chronic problem. In the Caro-Kann, ...c6 supports d5 without trapping any pieces." },
  { q: "In the King's Indian Defense, Black willingly gives White a large center. What is Black's main compensation?", opts: ["Material advantage from winning the d4 pawn", "Faster development and queenside play", "A kingside counterattack with ...e5 and ...f5", "Better endgame pawn structure"], correct: 2, explanation: "The KID is all about tension and counterplay. Black attacks White's center from the side with ...e5 (or sometimes ...c5), then uses the g7 bishop and kingside pawn storm with ...f5-f4 to create mating threats." },
  { q: "You have a knight on d5 that cannot be kicked by any enemy pawn. What is this called?", opts: ["A backward pawn", "A passed pawn", "An outpost", "A pin"], correct: 2, explanation: "An outpost is a square (usually for a knight) that cannot be attacked by enemy pawns. A knight on an outpost — especially d5, e6, or f5 — is enormously powerful and can dominate the game." },
  { q: "Your rook reaches the 7th rank. Why is this so valuable?", opts: ["It can promote immediately", "It attacks the opponent's unadvanced pawns and restricts their king", "It controls more squares than on the 1st rank", "It defends your own king better"], correct: 1, explanation: "The 7th rank is called 'the promised land' for rooks. The opponent's pawns usually haven't moved far, sitting on their 7th rank ready to be attacked. Plus, an enemy king sheltering on the 8th rank gets cut off." },
];
