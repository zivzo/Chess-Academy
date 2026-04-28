// ── Opening Data ──────────────────────────────────────────────────────────────
// All chess opening lines (Italian, London, Caro-Kann, King's Indian) with
// move sequences, board positions, and annotations.

import { applyMoves } from "./chess-board.js";


// ── Opening helpers ─────────────────────────────────────────────────────────
// Convert algebraic square ("e4") to [row, col] indices used by applyMoves.
function sq(s) {
  return [8 - parseInt(s[1], 10), s.charCodeAt(0) - 97];
}
// Build a single move object from algebraic-from / algebraic-to squares.
function mv(from, to) {
  const [r, c] = sq(from);
  const [tr, tc] = sq(to);
  return { r, c, tr, tc };
}
// Castling decomposes into a king move and a rook move so the simplified
// applyMoves helper renders the resulting board correctly.
function castle(color, side) {
  if (color === "w") {
    return side === "K"
      ? [mv("e1", "g1"), mv("h1", "f1")]
      : [mv("e1", "c1"), mv("a1", "d1")];
  }
  return side === "K"
    ? [mv("e8", "g8"), mv("h8", "f8")]
    : [mv("e8", "c8"), mv("a8", "d8")];
}
// Build an opening line (moves + positions) from a list of move specs.
// Each spec: { san, m: move | move[], annotation, highlight? }
function buildLine(specs, startAnnotation = "Starting position.") {
  const moves = specs.map((s) => s.san);
  const accumulated = [];
  const positions = [
    { board: applyMoves([]), annotation: startAnnotation, highlight: [] },
  ];
  for (const spec of specs) {
    const ms = Array.isArray(spec.m) ? spec.m : [spec.m];
    accumulated.push(...ms);
    positions.push({
      board: applyMoves(accumulated),
      annotation: spec.annotation,
      highlight: spec.highlight ?? [],
    });
  }
  return { moves, positions };
}

// ── Italian Game ────────────────────────────────────────────────────────────
const italianMain = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4 — Controls the center, opens lines for the bishop and queen.", highlight: [[4, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "1...e5 — Black mirrors White, fighting for central control.", highlight: [[3, 4]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3 — Develops a knight to a great square and attacks the e5 pawn.", highlight: [[5, 5]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "2...Nc6 — Defends e5 and develops a piece toward the center.", highlight: [[2, 2]] },
    { san: "Bc4", m: mv("f1", "c4"), annotation: "3. Bc4 — The Italian! The bishop eyes the f7 pawn — Black's most vulnerable square.", highlight: [[4, 2]] },
    { san: "Bc5", m: mv("f8", "c5"), annotation: "3...Bc5 — The Giuoco Piano (\"Quiet Game\"). Black mirrors with active development.", highlight: [[3, 2]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "4. c3 — Prepares the central break d4, building a classical pawn duo.", highlight: [[5, 2]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "4...Nf6 — Develops the knight, attacks e4, and contests the center.", highlight: [[2, 5]] },
    { san: "d3", m: mv("d2", "d3"), annotation: "5. d3 — The modern \"Giuoco Pianissimo\". White keeps a flexible center and plans Nbd2, Bb3, h3, O-O.", highlight: [[5, 3]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "5...d6 — Symmetrical, solid. Both sides will manoeuvre slowly: Nbd2/Nbd7, Bb3/Bb6, h3/h6, O-O. A typical positional Italian.", highlight: [[3, 3]] },
  ],
  "The starting position. White aims to control the center with pawns and develop pieces rapidly toward the kingside.",
);
const italianTwoKnights = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4 — Controls the center.", highlight: [[4, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "1...e5 — Classical reply.", highlight: [[3, 4]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3 — Attacks e5 and develops.", highlight: [[5, 5]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "2...Nc6 — Defends e5.", highlight: [[2, 2]] },
    { san: "Bc4", m: mv("f1", "c4"), annotation: "3. Bc4 — Italian setup.", highlight: [[4, 2]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "3...Nf6 — The Two Knights Defense! Black ignores f7 threats and counterattacks e4.", highlight: [[2, 5]] },
    { san: "Ng5", m: mv("f3", "g5"), annotation: "4. Ng5 — The provocative double attack on f7. Sharp theory begins.", highlight: [[3, 6]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "4...d5 — The only good move! Black blocks the bishop's attack on f7 by counter-attacking the center.", highlight: [[3, 3]] },
    { san: "exd5", m: mv("e4", "d5"), annotation: "5. exd5 — White takes the pawn.", highlight: [[3, 3]] },
    { san: "Na5", m: mv("c6", "a5"), annotation: "5...Na5 — The mainline! Black attacks the c4 bishop instead of recapturing on d5 (which would lose to 6.Nxf7).", highlight: [[3, 0]] },
    { san: "Bb5+", m: mv("c4", "b5"), annotation: "6. Bb5+ — Bishop retreats with check.", highlight: [[3, 1]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "6...c6 — Black blocks the check and chases the bishop.", highlight: [[2, 2]] },
    { san: "dxc6", m: mv("d5", "c6"), annotation: "7. dxc6 — White grabs another pawn.", highlight: [[2, 2]] },
    { san: "bxc6", m: mv("b7", "c6"), annotation: "7...bxc6 — Black recaptures, opening the b-file. Black is a pawn down but has lead in development and active piece play — typical Two Knights compensation.", highlight: [[2, 2]] },
    { san: "Be2", m: mv("b5", "e2"), annotation: "8. Be2 — The bishop returns to safety.", highlight: [[6, 4]] },
    { san: "h6", m: mv("h7", "h6"), annotation: "8...h6 — Kicks the knight away from g5.", highlight: [[2, 7]] },
    { san: "Nf3", m: mv("g5", "f3"), annotation: "9. Nf3 — The knight retreats; Black has full mobilisation in return for the pawn.", highlight: [[5, 5]] },
    { san: "e4", m: mv("e5", "e4"), annotation: "9...e4 — Black gains space and chases the knight again.", highlight: [[4, 4]] },
    { san: "Ne5", m: mv("f3", "e5"), annotation: "10. Ne5 — The knight finds an outpost. Modern theory rates this position as roughly balanced thanks to Black's active bishops and open lines.", highlight: [[3, 4]] },
  ],
  "Two Knights Defense — Black answers 3.Bc4 with 3...Nf6, leading to one of chess's oldest tactical battlegrounds.",
);
const italianEvans = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4", highlight: [[4, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "1...e5", highlight: [[3, 4]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3", highlight: [[5, 5]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "2...Nc6", highlight: [[2, 2]] },
    { san: "Bc4", m: mv("f1", "c4"), annotation: "3. Bc4", highlight: [[4, 2]] },
    { san: "Bc5", m: mv("f8", "c5"), annotation: "3...Bc5 — Giuoco Piano setup.", highlight: [[3, 2]] },
    { san: "b4", m: mv("b2", "b4"), annotation: "4. b4 — The Evans Gambit! White sacrifices a pawn for fast development and an open game.", highlight: [[4, 1]] },
    { san: "Bxb4", m: mv("c5", "b4"), annotation: "4...Bxb4 — Accepting the gambit is the principled reply.", highlight: [[4, 1]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "5. c3 — Gains a tempo on the bishop and prepares the d4 break.", highlight: [[5, 2]] },
    { san: "Ba5", m: mv("b4", "a5"), annotation: "5...Ba5 — Modern mainline. Keeps the bishop on the a5–e1 diagonal.", highlight: [[3, 0]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "6. d4 — The thematic center break White paid for with the b4 pawn.", highlight: [[4, 3]] },
    { san: "exd4", m: mv("e5", "d4"), annotation: "6...exd4 — Black grabs another pawn but White's open lines roar to life.", highlight: [[4, 3]] },
    { san: "O-O", m: castle("w", "K"), annotation: "7. O-O — White castles, throwing yet another pawn at the d-file to keep developing.", highlight: [[7, 6]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "7...d6 — Solidifies Black's center and prepares ...Bg4 or ...Nf6.", highlight: [[2, 3]] },
    { san: "cxd4", m: mv("c3", "d4"), annotation: "8. cxd4 — White rebuilds a powerful pawn duo on d4 and e4.", highlight: [[4, 3]] },
    { san: "Bb6", m: mv("a5", "b6"), annotation: "8...Bb6 — Bishop retreats to a safer square, eyeing d4.", highlight: [[2, 1]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "9. Nc3 — Develops with tempo, eyeing the d5 break.", highlight: [[5, 2]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "9...Nf6 — Black completes development and prepares to castle.", highlight: [[2, 5]] },
    { san: "e5", m: mv("e4", "e5"), annotation: "10. e5 — A classical pawn thrust kicking the f6 knight. The Evans Gambit lives on as a tactical weapon at every level — modern engines confirm Black is fine, but only with precise play.", highlight: [[3, 4]] },
  ],
  "Evans Gambit — White's romantic 4.b4 sacrifices a pawn for a roaring initiative.",
);
const italianHungarian = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4", highlight: [[4, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "1...e5", highlight: [[3, 4]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3", highlight: [[5, 5]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "2...Nc6", highlight: [[2, 2]] },
    { san: "Bc4", m: mv("f1", "c4"), annotation: "3. Bc4", highlight: [[4, 2]] },
    { san: "Be7", m: mv("f8", "e7"), annotation: "3...Be7 — The Hungarian Defense. Solid, modest, and avoids the sharp Italian theory.", highlight: [[3, 4]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "4. d4 — White grabs the center.", highlight: [[4, 3]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "4...d6 — Black plays a Philidor-style structure.", highlight: [[2, 3]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "5. Nc3 — Developing with classical principles.", highlight: [[5, 2]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "5...Nf6 — Solid development, eyeing e4.", highlight: [[2, 5]] },
    { san: "h3", m: mv("h2", "h3"), annotation: "6. h3 — Pre-empts the pin ...Bg4.", highlight: [[5, 7]] },
    { san: "O-O", m: castle("b", "K"), annotation: "6...O-O — Black castles into safety.", highlight: [[0, 6]] },
    { san: "O-O", m: castle("w", "K"), annotation: "7. O-O — White castles too.", highlight: [[7, 6]] },
    { san: "exd4", m: mv("e5", "d4"), annotation: "7...exd4 — Black releases the central tension.", highlight: [[4, 3]] },
    { san: "Nxd4", m: mv("f3", "d4"), annotation: "8. Nxd4 — White recaptures with a powerful centralised knight.", highlight: [[4, 3]] },
    { san: "Re8", m: mv("f8", "e8"), annotation: "8...Re8 — Activates the rook on the half-open e-file.", highlight: [[0, 4]] },
    { san: "Re1", m: mv("f1", "e1"), annotation: "9. Re1 — Mirrors Black's plan, contesting the e-file.", highlight: [[7, 4]] },
    { san: "Bf8", m: mv("e7", "f8"), annotation: "9...Bf8 — A modern manoeuvre, planning ...g6 and ...Bg7.", highlight: [[0, 5]] },
    { san: "Bf4", m: mv("c1", "f4"), annotation: "10. Bf4 — White completes development with a calm middlegame ahead. The Hungarian gives Black a passive but rock-solid game.", highlight: [[4, 5]] },
  ],
  "Hungarian Defense — 3...Be7, a calm sidestep around the Italian's tactical jungle.",
);

// ── London System ───────────────────────────────────────────────────────────
const londonMain = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4 — White claims the center.", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "1...d5 — Black mirrors symmetrically.", highlight: [[3, 3]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3 — Flexible knight development.", highlight: [[5, 5]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "2...Nf6 — Black develops in kind.", highlight: [[2, 5]] },
    { san: "Bf4", m: mv("c1", "f4"), annotation: "3. Bf4 — The London bishop! Active outside the pawn chain — the move-order gem of the system.", highlight: [[4, 5]] },
    { san: "c5", m: mv("c7", "c5"), annotation: "3...c5 — Black challenges the d4 pawn, the modern critical try.", highlight: [[3, 2]] },
    { san: "e3", m: mv("e2", "e3"), annotation: "4. e3 — Supports d4 and unlocks the f1 bishop.", highlight: [[5, 4]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "4...Nc6 — Adds pressure on d4.", highlight: [[2, 2]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "5. c3 — Completes the famous London pawn triangle (d4-e3-c3).", highlight: [[5, 2]] },
    { san: "e6", m: mv("e7", "e6"), annotation: "5...e6 — Black opens the f8 bishop and prepares ...Bd6 or ...Be7. Both sides will quickly castle short with a long manoeuvring game ahead.", highlight: [[3, 4]] },
  ],
  "Starting position. White aims to reach the rock-solid London setup: d4, Nf3, Bf4, e3, c3, Nbd2, Bd3.",
);
const londonClassical = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "1...d5", highlight: [[3, 3]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3", highlight: [[5, 5]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "2...Nf6", highlight: [[2, 5]] },
    { san: "Bf4", m: mv("c1", "f4"), annotation: "3. Bf4 — London bishop.", highlight: [[4, 5]] },
    { san: "e6", m: mv("e7", "e6"), annotation: "3...e6 — The classical Queen's-pawn setup against the London.", highlight: [[3, 4]] },
    { san: "e3", m: mv("e2", "e3"), annotation: "4. e3", highlight: [[5, 4]] },
    { san: "Bd6", m: mv("f8", "d6"), annotation: "4...Bd6 — Challenges the London bishop directly.", highlight: [[2, 3]] },
    { san: "Bg3", m: mv("f4", "g3"), annotation: "5. Bg3 — Side-steps the trade, keeping the strong bishop alive.", highlight: [[5, 6]] },
    { san: "O-O", m: castle("b", "K"), annotation: "5...O-O — Black castles into safety.", highlight: [[0, 6]] },
    { san: "Nbd2", m: mv("b1", "d2"), annotation: "6. Nbd2 — Supports e4 break and reroutes via f1/e4.", highlight: [[6, 3]] },
    { san: "c5", m: mv("c7", "c5"), annotation: "6...c5 — Hits the centre.", highlight: [[3, 2]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "7. c3 — Completes the London triangle.", highlight: [[5, 2]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "7...Nc6 — Piling on d4.", highlight: [[2, 2]] },
    { san: "Bd3", m: mv("f1", "d3"), annotation: "8. Bd3 — Aims at h7, eyeing a kingside attack.", highlight: [[5, 3]] },
    { san: "b6", m: mv("b7", "b6"), annotation: "8...b6 — Prepares ...Bb7 for a long diagonal.", highlight: [[2, 1]] },
    { san: "O-O", m: castle("w", "K"), annotation: "9. O-O — White castles short. Both kings tucked away.", highlight: [[7, 6]] },
    { san: "Bb7", m: mv("c8", "b7"), annotation: "9...Bb7 — Black completes development.", highlight: [[1, 1]] },
    { san: "Ne5", m: mv("f3", "e5"), annotation: "10. Ne5 — The classic London plan: knight on e5, plans f4 with a kingside attack. A famous structure that has scored well for White at every level.", highlight: [[3, 4]] },
  ],
  "Classical London — Black plays ...e6 and ...Bd6, the most direct positional challenge.",
);
const londonAntiCxd4 = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "1...d5", highlight: [[3, 3]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "2. Nf3", highlight: [[5, 5]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "2...Nf6", highlight: [[2, 5]] },
    { san: "Bf4", m: mv("c1", "f4"), annotation: "3. Bf4", highlight: [[4, 5]] },
    { san: "c5", m: mv("c7", "c5"), annotation: "3...c5 — Hits the centre.", highlight: [[3, 2]] },
    { san: "e3", m: mv("e2", "e3"), annotation: "4. e3", highlight: [[5, 4]] },
    { san: "cxd4", m: mv("c5", "d4"), annotation: "4...cxd4 — Resolves the central tension early.", highlight: [[4, 3]] },
    { san: "exd4", m: mv("e3", "d4"), annotation: "5. exd4 — White accepts an isolated d-pawn for piece activity.", highlight: [[4, 3]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "5...Nc6 — Pressuring the IQP.", highlight: [[2, 2]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "6. c3 — Solidifies d4 and unlocks Bd3/Qb3 plans.", highlight: [[5, 2]] },
    { san: "Bf5", m: mv("c8", "f5"), annotation: "6...Bf5 — Active bishop development.", highlight: [[3, 5]] },
    { san: "Qb3", m: mv("d1", "b3"), annotation: "7. Qb3 — Targets b7 and d5, a typical London poke.", highlight: [[5, 1]] },
    { san: "Qd7", m: mv("d8", "d7"), annotation: "7...Qd7 — Defends b7 indirectly and prepares queenside castling.", highlight: [[1, 3]] },
    { san: "Nbd2", m: mv("b1", "d2"), annotation: "8. Nbd2 — Heads to f3-e5 or b3.", highlight: [[6, 3]] },
    { san: "e6", m: mv("e7", "e6"), annotation: "8...e6 — Solid wall.", highlight: [[3, 4]] },
    { san: "Bd3", m: mv("f1", "d3"), annotation: "9. Bd3 — Offers the bishop trade.", highlight: [[5, 3]] },
    { san: "Bxd3", m: mv("f5", "d3"), annotation: "9...Bxd3 — Black accepts.", highlight: [[5, 3]] },
    { san: "Qxd3", m: mv("b3", "d3"), annotation: "10. Qxd3 — White's queen lands on d3 with a small pull thanks to the bishop pair traded and active pieces. A typical IQP middlegame ensues.", highlight: [[5, 3]] },
  ],
  "Anti-London ...c5 with early ...cxd4 — Black takes on an IQP middlegame against White.",
);

// ── Caro-Kann Defense ───────────────────────────────────────────────────────
const caroMain = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4 — White stakes a claim in the center.", highlight: [[4, 4]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "1...c6 — The Caro-Kann! Black prepares ...d5 with solid pawn support.", highlight: [[2, 2]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "2. d4 — White builds the broad center.", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "2...d5 — Black challenges the center; unlike the French, the c8 bishop is not blocked.", highlight: [[3, 3]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "3. Nc3 — The Classical/Main Line, defending e4 with a piece.", highlight: [[5, 2]] },
    { san: "dxe4", m: mv("d5", "e4"), annotation: "3...dxe4 — Black resolves the tension and gains ...Bf5/Bg4 ideas.", highlight: [[4, 4]] },
    { san: "Nxe4", m: mv("c3", "e4"), annotation: "4. Nxe4 — White recaptures, eyeing g5/c5 outposts.", highlight: [[4, 4]] },
    { san: "Bf5", m: mv("c8", "f5"), annotation: "4...Bf5 — The Classical Variation. Black activates the light-squared bishop before locking it in with ...e6.", highlight: [[3, 5]] },
    { san: "Ng3", m: mv("e4", "g3"), annotation: "5. Ng3 — Kicks the bishop with tempo.", highlight: [[5, 6]] },
    { san: "Bg6", m: mv("f5", "g6"), annotation: "5...Bg6 — Bishop retreats to the safe square. Black has a healthy structure and a good bishop, planning ...Nd7, ...Ngf6, ...e6, ...Be7, O-O.", highlight: [[2, 6]] },
  ],
  "Starting position. Black will answer 1.e4 with the rock-solid Caro-Kann.",
);
const caroClassical = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4", highlight: [[4, 4]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "1...c6", highlight: [[2, 2]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "2. d4", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "2...d5", highlight: [[3, 3]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "3. Nc3", highlight: [[5, 2]] },
    { san: "dxe4", m: mv("d5", "e4"), annotation: "3...dxe4", highlight: [[4, 4]] },
    { san: "Nxe4", m: mv("c3", "e4"), annotation: "4. Nxe4", highlight: [[4, 4]] },
    { san: "Bf5", m: mv("c8", "f5"), annotation: "4...Bf5 — Classical mainline.", highlight: [[3, 5]] },
    { san: "Ng3", m: mv("e4", "g3"), annotation: "5. Ng3 — Hits the bishop.", highlight: [[5, 6]] },
    { san: "Bg6", m: mv("f5", "g6"), annotation: "5...Bg6", highlight: [[2, 6]] },
    { san: "h4", m: mv("h2", "h4"), annotation: "6. h4 — White starts a kingside pawn race aiming at the Bg6.", highlight: [[4, 7]] },
    { san: "h6", m: mv("h7", "h6"), annotation: "6...h6 — Creates a square on h7 for the bishop and prevents h5–h6 ideas.", highlight: [[2, 7]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "7. Nf3 — Develops calmly.", highlight: [[5, 5]] },
    { san: "Nd7", m: mv("b8", "d7"), annotation: "7...Nd7 — The flexible Caro knight, planning ...Ngf6 without blocking the bishop.", highlight: [[1, 3]] },
    { san: "h5", m: mv("h4", "h5"), annotation: "8. h5 — Forces the bishop to retreat.", highlight: [[3, 7]] },
    { san: "Bh7", m: mv("g6", "h7"), annotation: "8...Bh7 — The bishop tucks away, well-defended.", highlight: [[1, 7]] },
    { san: "Bd3", m: mv("f1", "d3"), annotation: "9. Bd3 — Offers the bishop trade.", highlight: [[5, 3]] },
    { san: "Bxd3", m: mv("h7", "d3"), annotation: "9...Bxd3 — Black accepts; the trade eases pressure.", highlight: [[5, 3]] },
    { san: "Qxd3", m: mv("d1", "d3"), annotation: "10. Qxd3 — White recaptures with the queen, reaching the famous Capablanca/Karpov tabiya — a slightly better but very playable middlegame for Black with rock-solid structure.", highlight: [[5, 3]] },
  ],
  "Classical Caro-Kann — 4...Bf5 mainline through the great theoretical 'h4–h5–Bd3' tabiya.",
);
const caroAdvance = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4", highlight: [[4, 4]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "1...c6", highlight: [[2, 2]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "2. d4", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "2...d5", highlight: [[3, 3]] },
    { san: "e5", m: mv("e4", "e5"), annotation: "3. e5 — The Advance Variation. White grabs space, locking the centre.", highlight: [[3, 4]] },
    { san: "Bf5", m: mv("c8", "f5"), annotation: "3...Bf5 — The point of the Caro: the bishop escapes BEFORE ...e6.", highlight: [[3, 5]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "4. Nf3 — Modern mainline, eyeing Be2 and Nh4.", highlight: [[5, 5]] },
    { san: "e6", m: mv("e7", "e6"), annotation: "4...e6 — Builds the French-like wall.", highlight: [[3, 4]] },
    { san: "Be2", m: mv("f1", "e2"), annotation: "5. Be2 — Flexible development.", highlight: [[6, 4]] },
    { san: "c5", m: mv("c6", "c5"), annotation: "5...c5 — Hits d4 — a key Caro Advance break.", highlight: [[3, 2]] },
    { san: "Be3", m: mv("c1", "e3"), annotation: "6. Be3 — Defends d4.", highlight: [[5, 4]] },
    { san: "Nd7", m: mv("b8", "d7"), annotation: "6...Nd7 — Prepares ...Ne7 and ...Nc6/Nb6.", highlight: [[1, 3]] },
    { san: "O-O", m: castle("w", "K"), annotation: "7. O-O — White castles short.", highlight: [[7, 6]] },
    { san: "Ne7", m: mv("g8", "e7"), annotation: "7...Ne7 — A typical Caro knight manoeuvre, supporting f5 and not blocking the bishop.", highlight: [[1, 4]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "8. c3 — Defends d4 against ...cxd4.", highlight: [[5, 2]] },
    { san: "Nc6", m: mv("d7", "c6"), annotation: "8...Nc6 — Adds another attacker.", highlight: [[2, 2]] },
    { san: "Nbd2", m: mv("b1", "d2"), annotation: "9. Nbd2 — Headed for b3 or f1.", highlight: [[6, 3]] },
    { san: "cxd4", m: mv("c5", "d4"), annotation: "9...cxd4 — Releases the tension.", highlight: [[4, 3]] },
    { san: "cxd4", m: mv("c3", "d4"), annotation: "10. cxd4 — White's central duo holds; Black has good piece play. The Caro Advance is one of the most theory-heavy battlegrounds in modern chess.", highlight: [[4, 3]] },
  ],
  "Advance Variation — 3.e5, locking the centre and racing for kingside space.",
);
const caroExchange = buildLine(
  [
    { san: "e4", m: mv("e2", "e4"), annotation: "1. e4", highlight: [[4, 4]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "1...c6", highlight: [[2, 2]] },
    { san: "d4", m: mv("d2", "d4"), annotation: "2. d4", highlight: [[4, 3]] },
    { san: "d5", m: mv("d7", "d5"), annotation: "2...d5", highlight: [[3, 3]] },
    { san: "exd5", m: mv("e4", "d5"), annotation: "3. exd5 — The Exchange Variation. Symmetrical structure; White hopes for a slight pull from being a tempo up.", highlight: [[3, 3]] },
    { san: "cxd5", m: mv("c6", "d5"), annotation: "3...cxd5 — Black recaptures, reaching a Carlsbad-like structure.", highlight: [[3, 3]] },
    { san: "Bd3", m: mv("f1", "d3"), annotation: "4. Bd3 — Eyes h7, classical Carlsbad plan.", highlight: [[5, 3]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "4...Nc6 — Develops, keeping symmetry.", highlight: [[2, 2]] },
    { san: "c3", m: mv("c2", "c3"), annotation: "5. c3 — Solid pawn shield.", highlight: [[5, 2]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "5...Nf6 — Standard development.", highlight: [[2, 5]] },
    { san: "Bf4", m: mv("c1", "f4"), annotation: "6. Bf4 — Active bishop, preventing ...e5.", highlight: [[4, 5]] },
    { san: "Bg4", m: mv("c8", "g4"), annotation: "6...Bg4 — Pins the knight, an active reply.", highlight: [[4, 6]] },
    { san: "Qb3", m: mv("d1", "b3"), annotation: "7. Qb3 — Hits b7 and d5.", highlight: [[5, 1]] },
    { san: "Qd7", m: mv("d8", "d7"), annotation: "7...Qd7 — Defends and prepares ...e6, ...Nh5 ideas.", highlight: [[1, 3]] },
    { san: "Nd2", m: mv("b1", "d2"), annotation: "8. Nd2 — Avoids the doubled pawns.", highlight: [[6, 3]] },
    { san: "e6", m: mv("e7", "e6"), annotation: "8...e6 — Solidifies the centre.", highlight: [[3, 4]] },
    { san: "Ngf3", m: mv("g1", "f3"), annotation: "9. Ngf3 — Completes development.", highlight: [[5, 5]] },
    { san: "Bd6", m: mv("f8", "d6"), annotation: "9...Bd6 — Offers the bishop trade.", highlight: [[2, 3]] },
    { san: "Bxd6", m: mv("f4", "d6"), annotation: "10. Bxd6 — Trades the dark-squared bishops. The Exchange leads to symmetrical, manoeuvring middlegames; Black is solid but must play accurately to avoid being slowly squeezed.", highlight: [[2, 3]] },
  ],
  "Exchange Variation — 3.exd5, the Carlsbad-like quiet line.",
);

// ── King's Indian Defense ───────────────────────────────────────────────────
const kidMain = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4 — White goes for the center.", highlight: [[4, 3]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "1...Nf6 — Black develops, declining symmetry.", highlight: [[2, 5]] },
    { san: "c4", m: mv("c2", "c4"), annotation: "2. c4 — White claims even more space.", highlight: [[4, 2]] },
    { san: "g6", m: mv("g7", "g6"), annotation: "2...g6 — Black prepares the fianchetto.", highlight: [[2, 6]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "3. Nc3 — Develops, pressing e4 break.", highlight: [[5, 2]] },
    { san: "Bg7", m: mv("f8", "g7"), annotation: "3...Bg7 — The King's Indian bishop, the engine of Black's counterplay.", highlight: [[1, 6]] },
    { san: "e4", m: mv("e2", "e4"), annotation: "4. e4 — White builds a huge centre, daring Black to attack it.", highlight: [[4, 4]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "4...d6 — Restrains e5 and prepares ...e5 or ...c5.", highlight: [[2, 3]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "5. Nf3 — The Classical setup.", highlight: [[5, 5]] },
    { san: "O-O", m: castle("b", "K"), annotation: "5...O-O — Black castles, ready to challenge the center with ...e5 next.", highlight: [[0, 6]] },
  ],
  "Starting position. The King's Indian: let White build a giant center, then dynamite it.",
);
const kidClassical = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4", highlight: [[4, 3]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "1...Nf6", highlight: [[2, 5]] },
    { san: "c4", m: mv("c2", "c4"), annotation: "2. c4", highlight: [[4, 2]] },
    { san: "g6", m: mv("g7", "g6"), annotation: "2...g6", highlight: [[2, 6]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "3. Nc3", highlight: [[5, 2]] },
    { san: "Bg7", m: mv("f8", "g7"), annotation: "3...Bg7", highlight: [[1, 6]] },
    { san: "e4", m: mv("e2", "e4"), annotation: "4. e4", highlight: [[4, 4]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "4...d6", highlight: [[2, 3]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "5. Nf3 — Classical Variation.", highlight: [[5, 5]] },
    { san: "O-O", m: castle("b", "K"), annotation: "5...O-O", highlight: [[0, 6]] },
    { san: "Be2", m: mv("f1", "e2"), annotation: "6. Be2 — Modest development typical of the Classical.", highlight: [[6, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "6...e5 — Black strikes the center! The KID's signature move.", highlight: [[3, 4]] },
    { san: "O-O", m: castle("w", "K"), annotation: "7. O-O — White castles, sidestepping the central tension.", highlight: [[7, 6]] },
    { san: "Nc6", m: mv("b8", "c6"), annotation: "7...Nc6 — The Mar del Plata setup, the sharpest of all KID lines.", highlight: [[2, 2]] },
    { san: "d5", m: mv("d4", "d5"), annotation: "8. d5 — White locks the center.", highlight: [[3, 3]] },
    { san: "Ne7", m: mv("c6", "e7"), annotation: "8...Ne7 — Knight reroutes to support the kingside attack.", highlight: [[1, 4]] },
    { san: "Ne1", m: mv("f3", "e1"), annotation: "9. Ne1 — The famous knight retreat — White heads to d3 and prepares c5 on the queenside.", highlight: [[7, 4]] },
    { san: "Nd7", m: mv("f6", "d7"), annotation: "9...Nd7 — Mirrors the plan: clear the f-pawn for ...f5 onslaught.", highlight: [[1, 3]] },
    { san: "Nd3", m: mv("e1", "d3"), annotation: "10. Nd3 — White prepares c5; Black prepares ...f5. The race of the wings — every classical KID game becomes a battle of opposite-flank attacks.", highlight: [[5, 3]] },
  ],
  "Classical Mar del Plata — 5.Nf3 O-O 6.Be2 e5, sharpest race of the wings in chess theory.",
);
const kidSamisch = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4", highlight: [[4, 3]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "1...Nf6", highlight: [[2, 5]] },
    { san: "c4", m: mv("c2", "c4"), annotation: "2. c4", highlight: [[4, 2]] },
    { san: "g6", m: mv("g7", "g6"), annotation: "2...g6", highlight: [[2, 6]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "3. Nc3", highlight: [[5, 2]] },
    { san: "Bg7", m: mv("f8", "g7"), annotation: "3...Bg7", highlight: [[1, 6]] },
    { san: "e4", m: mv("e2", "e4"), annotation: "4. e4", highlight: [[4, 4]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "4...d6", highlight: [[2, 3]] },
    { san: "f3", m: mv("f2", "f3"), annotation: "5. f3 — The Sämisch Variation. White prepares Be3 and a queenside expansion with c5/b4/a3.", highlight: [[5, 5]] },
    { san: "O-O", m: castle("b", "K"), annotation: "5...O-O", highlight: [[0, 6]] },
    { san: "Be3", m: mv("c1", "e3"), annotation: "6. Be3 — Solid development behind the f3 pawn.", highlight: [[5, 4]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "6...e5 — A principled try, hitting the centre while it's still mobile.", highlight: [[3, 4]] },
    { san: "d5", m: mv("d4", "d5"), annotation: "7. d5 — White locks the centre.", highlight: [[3, 3]] },
    { san: "Nh5", m: mv("f6", "h5"), annotation: "7...Nh5 — Sharp! Black prepares ...f5 with tempo.", highlight: [[3, 7]] },
    { san: "Qd2", m: mv("d1", "d2"), annotation: "8. Qd2 — Connects rooks, prepares O-O-O.", highlight: [[6, 3]] },
    { san: "f5", m: mv("f7", "f5"), annotation: "8...f5 — The king's-side pawn lever, the heart of any KID attack.", highlight: [[3, 5]] },
    { san: "exf5", m: mv("e4", "f5"), annotation: "9. exf5 — White opens the e-file.", highlight: [[3, 5]] },
    { san: "gxf5", m: mv("g6", "f5"), annotation: "9...gxf5 — Black opens the g-file aiming at White's king.", highlight: [[3, 5]] },
    { san: "O-O-O", m: castle("w", "Q"), annotation: "10. O-O-O — White castles long, signing up for opposite-side castling — both kings hunt each other in classic Sämisch fashion.", highlight: [[7, 2]] },
  ],
  "Sämisch Variation — 5.f3, the rock-solid attempt to crush the King's Indian.",
);
const kidFianchetto = buildLine(
  [
    { san: "d4", m: mv("d2", "d4"), annotation: "1. d4", highlight: [[4, 3]] },
    { san: "Nf6", m: mv("g8", "f6"), annotation: "1...Nf6", highlight: [[2, 5]] },
    { san: "c4", m: mv("c2", "c4"), annotation: "2. c4", highlight: [[4, 2]] },
    { san: "g6", m: mv("g7", "g6"), annotation: "2...g6", highlight: [[2, 6]] },
    { san: "g3", m: mv("g2", "g3"), annotation: "3. g3 — The Fianchetto Variation. White contests the long diagonal.", highlight: [[5, 6]] },
    { san: "Bg7", m: mv("f8", "g7"), annotation: "3...Bg7", highlight: [[1, 6]] },
    { san: "Bg2", m: mv("f1", "g2"), annotation: "4. Bg2 — Bishops point at each other on the long diagonal.", highlight: [[6, 6]] },
    { san: "O-O", m: castle("b", "K"), annotation: "4...O-O", highlight: [[0, 6]] },
    { san: "Nf3", m: mv("g1", "f3"), annotation: "5. Nf3 — Standard development.", highlight: [[5, 5]] },
    { san: "d6", m: mv("d7", "d6"), annotation: "5...d6 — Restrains e4.", highlight: [[2, 3]] },
    { san: "O-O", m: castle("w", "K"), annotation: "6. O-O — White castles short.", highlight: [[7, 6]] },
    { san: "Nbd7", m: mv("b8", "d7"), annotation: "6...Nbd7 — Prepares ...e5 without blocking the bishop.", highlight: [[1, 3]] },
    { san: "Nc3", m: mv("b1", "c3"), annotation: "7. Nc3 — Develops, eyeing e4 break.", highlight: [[5, 2]] },
    { san: "e5", m: mv("e7", "e5"), annotation: "7...e5 — The thematic central strike.", highlight: [[3, 4]] },
    { san: "e4", m: mv("e2", "e4"), annotation: "8. e4 — Builds the broad pawn centre.", highlight: [[4, 4]] },
    { san: "c6", m: mv("c7", "c6"), annotation: "8...c6 — The Gallagher / Yugoslav setup, preparing ...Qb6/...exd4.", highlight: [[2, 2]] },
    { san: "h3", m: mv("h2", "h3"), annotation: "9. h3 — Pre-empts ...Bg4 pin and prepares Be3.", highlight: [[5, 7]] },
    { san: "Qb6", m: mv("d8", "b6"), annotation: "9...Qb6 — Probes the queenside, eyeing b2 and d4.", highlight: [[2, 1]] },
    { san: "d5", m: mv("d4", "d5"), annotation: "10. d5 — White closes the centre and locks the structure for a long manoeuvring middlegame — a hallmark of the Fianchetto KID.", highlight: [[3, 3]] },
  ],
  "Fianchetto Variation — 3.g3, White's quiet system trying to neutralise the KID bishop.",
);

// ── Opening definitions ─────────────────────────────────────────────────────
export const OPENINGS = [
  {
    id: "italian", name: "Italian Game", color: "green",
    tags: ["Opening", "Beginner-friendly"],
    diff: 1, side: "White",
    desc: "One of the oldest openings. White aims to control the center, develop quickly, and build toward a kingside attack via f4 or d3.",
    moves: italianMain.moves,
    positions: italianMain.positions,
    ideas: ["Control center with e4+d3 or d4", "Develop Nf3, Bc4, castle kingside", "Attack via f4-f5 or central break d4", "Watch for f7 weakness"],
    variations: [
      { id: "italian-twoknights", name: "Two Knights Defense", desc: "Black plays 3...Nf6, ignoring f7 threats and counterattacking. Leads to sharp tactical battles around the Fried Liver.", moves: italianTwoKnights.moves, positions: italianTwoKnights.positions },
      { id: "italian-evans", name: "Evans Gambit", desc: "White's romantic 4.b4 sacrifices a pawn for explosive central play. A favourite of Morphy and Kasparov.", moves: italianEvans.moves, positions: italianEvans.positions },
      { id: "italian-hungarian", name: "Hungarian Defense", desc: "Black side-steps Italian theory with 3...Be7 — quiet, solid, and slightly passive.", moves: italianHungarian.moves, positions: italianHungarian.positions },
    ],
  },
  {
    id: "london", name: "London System", color: "gold",
    tags: ["Opening", "Solid"],
    diff: 1, side: "White",
    desc: "A solid, flexible opening where White builds a strong pawn triangle (d4, e3, c3) and bishop on f4. Easy to learn, hard to crack.",
    moves: londonMain.moves,
    positions: londonMain.positions,
    ideas: ["Build pawn triangle: d4, e3, c3", "Develop Bf4 before e3 (key move order!)", "Nbd2 supports center, avoids pins", "Queenside expansion or kingside attack possible"],
    variations: [
      { id: "london-classical", name: "Classical (...e6 / ...Bd6)", desc: "Black challenges the London bishop directly with ...Bd6. White's main weapon: Bg3 followed by a slow kingside build-up with Ne5 and f4.", moves: londonClassical.moves, positions: londonClassical.positions },
      { id: "london-cxd4", name: "Anti-London ...c5 with ...cxd4", desc: "Black liquidates early into an Isolated Queen's Pawn structure for White, fighting for piece activity.", moves: londonAntiCxd4.moves, positions: londonAntiCxd4.positions },
    ],
  },
  {
    id: "carokann", name: "Caro-Kann Defense", color: "red",
    tags: ["Opening", "Solid", "Black"],
    diff: 2, side: "Black",
    desc: "Black's solid answer to 1.e4. Avoids the sharp Sicilian while maintaining a strong pawn structure. Favored by positional players.",
    moves: caroMain.moves,
    positions: caroMain.positions,
    ideas: ["Solid pawn structure, no weak pawns", "Light-squared bishop is active (unlike French)", "Play ...Bf5 or ...Bg4 to develop", "Counterattack with ...c5 or ...e5 in middlegame"],
    variations: [
      { id: "caro-classical", name: "Classical Variation", desc: "The 4...Bf5 mainline through the Capablanca / Karpov tabiya after 10.Qxd3.", moves: caroClassical.moves, positions: caroClassical.positions },
      { id: "caro-advance", name: "Advance Variation", desc: "White grabs space with 3.e5; Black develops the bishop before locking it in. Modern theory considered very testing for both sides.", moves: caroAdvance.moves, positions: caroAdvance.positions },
      { id: "caro-exchange", name: "Exchange Variation", desc: "3.exd5 cxd5 leads to a Carlsbad-like symmetrical structure where White hopes for a slight pull.", moves: caroExchange.moves, positions: caroExchange.positions },
    ],
  },
  {
    id: "kingsindian", name: "King's Indian Defense", color: "green",
    tags: ["Opening", "Dynamic", "Black"],
    diff: 3, side: "Black",
    desc: "Black allows White a strong center, then launches a fierce kingside counterattack. Favored by fighters and attacking players.",
    moves: kidMain.moves,
    positions: kidMain.positions,
    ideas: ["Let White have the center — then attack it!", "Counterplay with ...e5 in the center", "Kingside attack: ...f5-f4, ...Ng4", "The g7 bishop becomes a monster in the endgame"],
    variations: [
      { id: "kid-classical", name: "Classical (Mar del Plata)", desc: "The most famous KID line: 6.Be2 e5 7.O-O Nc6 8.d5 Ne7 — both sides race on opposite wings.", moves: kidClassical.moves, positions: kidClassical.positions },
      { id: "kid-samisch", name: "Sämisch Variation", desc: "White's 5.f3 builds a granite centre and prepares opposite-side castling with Qd2 and O-O-O.", moves: kidSamisch.moves, positions: kidSamisch.positions },
      { id: "kid-fianchetto", name: "Fianchetto Variation", desc: "White's quiet 3.g3 contests the long diagonal — usually leading to a slow, manoeuvring battle.", moves: kidFianchetto.moves, positions: kidFianchetto.positions },
    ],
  },
];
