// ── Educational Content ──────────────────────────────────────────────────────
// Middlegame concepts and quiz questions for the Chess Academy.

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
  {
    q: "White has a bishop on c4 pointing at f7. Black's king is on e8. What is the key weakness White is exploiting?",
    opts: ["The f7 pawn — Black's most vulnerable square in the opening", "The e5 pawn — easy to win with Nxe5", "Black's king being in the center", "The c6 knight is pinned"],
    correct: 0,
    explanation: "f7 is defended only by the king in the starting position, making it Black's biggest vulnerability in many open games. The Italian Game and Fried Liver Attack both exploit this square.",
    // Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4
    board: [
      ["bR",null,"bB","bQ","bK","bB",null,"bR"],
      ["bP","bP","bP","bP",null,"bP","bP","bP"],
      [null,null,"bN",null,null,null,null,null],
      [null,null,null,null,"bP",null,null,null],
      [null,null,"wB",null,"wP",null,null,null],
      [null,null,null,null,null,"wN",null,null],
      ["wP","wP","wP","wP",null,"wP","wP","wP"],
      ["wR","wN","wB","wQ","wK",null,null,"wR"],
    ],
    highlight: [[4,2],[1,5]],
  },
  {
    q: "In the London System, what is the most important move order rule for the Bf4 bishop?",
    opts: ["Play Bf4 after e3", "Play Bf4 BEFORE playing e3 (so the bishop isn't locked in)", "Play Bf4 before d4", "Always develop Bf4 on move 1"],
    correct: 1,
    explanation: "If White plays e3 before Bf4, the light-squared bishop gets locked behind the pawn chain. The key London move order is d4, Nf3, then Bf4 — BEFORE e3.",
    // London System after 1.d4 d5 2.Nf3 Nf6 3.Bf4
    board: [
      ["bR","bN","bB","bQ","bK","bB",null,"bR"],
      ["bP","bP","bP",null,"bP","bP","bP","bP"],
      [null,null,null,null,null,"bN",null,null],
      [null,null,null,"bP",null,null,null,null],
      [null,null,null,"wP",null,"wB",null,null],
      [null,null,null,null,null,"wN",null,null],
      ["wP","wP","wP",null,"wP","wP","wP","wP"],
      ["wR","wN",null,"wQ","wK","wB",null,"wR"],
    ],
    highlight: [[4,5]],
  },
  {
    q: "What is the main strategic idea behind the Caro-Kann compared to the French Defense?",
    opts: ["Black gets a queenside attack", "The c6 pawn support makes Black's center stronger", "Black's light-squared bishop is NOT locked in by the pawn chain", "Black can castle queenside faster"],
    correct: 2,
    explanation: "In the French Defense, Black plays ...e6 which locks in the light-squared bishop — a chronic problem. In the Caro-Kann, ...c6 supports d5 without trapping any pieces.",
    // Caro-Kann after 1.e4 c6 2.d4 d5
    board: [
      ["bR","bN","bB","bQ","bK","bB","bN","bR"],
      ["bP","bP",null,null,"bP","bP","bP","bP"],
      [null,null,"bP",null,null,null,null,null],
      [null,null,null,"bP",null,null,null,null],
      [null,null,null,"wP","wP",null,null,null],
      [null,null,null,null,null,null,null,null],
      ["wP","wP","wP",null,null,"wP","wP","wP"],
      ["wR","wN","wB","wQ","wK","wB","wN","wR"],
    ],
    highlight: [[2,2],[3,3]],
  },
  {
    q: "In the King's Indian Defense, Black willingly gives White a large center. What is Black's main compensation?",
    opts: ["Material advantage from winning the d4 pawn", "Faster development and queenside play", "A kingside counterattack with ...e5 and ...f5", "Better endgame pawn structure"],
    correct: 2,
    explanation: "The KID is all about tension and counterplay. Black attacks White's center from the side with ...e5 (or sometimes ...c5), then uses the g7 bishop and kingside pawn storm with ...f5-f4 to create mating threats.",
    // King's Indian Defense after 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O
    board: [
      ["bR","bN","bB","bQ",null,"bR","bK",null],
      ["bP","bP","bP",null,"bP","bP","bB","bP"],
      [null,null,null,"bP",null,"bN","bP",null],
      [null,null,null,null,null,null,null,null],
      [null,null,"wP","wP","wP",null,null,null],
      [null,null,"wN",null,null,"wN",null,null],
      ["wP","wP",null,null,null,"wP","wP","wP"],
      ["wR",null,"wB","wQ","wK","wB",null,"wR"],
    ],
    highlight: [[4,3],[4,4]],
  },
  {
    q: "You have a knight on d5 that cannot be kicked by any enemy pawn. What is this called?",
    opts: ["A backward pawn", "A passed pawn", "An outpost", "A pin"],
    correct: 2,
    explanation: "An outpost is a square (usually for a knight) that cannot be attacked by enemy pawns. A knight on an outpost — especially d5, e6, or f5 — is enormously powerful and can dominate the game.",
    // Middlegame with a white knight outpost on d5
    board: [
      [null,null,null,null,null,"bR","bK",null],
      ["bP","bP",null,null,null,"bP","bP","bP"],
      [null,null,null,"bP",null,"bN",null,null],
      [null,null,null,"wN",null,null,null,null],
      [null,null,null,null,"wP",null,null,null],
      [null,null,null,null,null,null,null,null],
      ["wP","wP","wP",null,null,"wP","wP","wP"],
      ["wR",null,null,"wQ",null,null,"wK",null],
    ],
    highlight: [[3,3]],
  },
  {
    q: "Your rook reaches the 7th rank. Why is this so valuable?",
    opts: ["It can promote immediately", "It attacks the opponent's unadvanced pawns and restricts their king", "It controls more squares than on the 1st rank", "It defends your own king better"],
    correct: 1,
    explanation: "The 7th rank is called 'the promised land' for rooks. The opponent's pawns usually haven't moved far, sitting on their 7th rank ready to be attacked. Plus, an enemy king sheltering on the 8th rank gets cut off.",
    // White rook dominating the 7th rank
    board: [
      [null,null,null,null,null,"bR","bK",null],
      ["bP","bP","bP","wR",null,"bP",null,"bP"],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ["wP","wP","wP",null,null,"wP","wP","wP"],
      [null,null,null,null,null,"wR","wK",null],
    ],
    highlight: [[1,3]],
  },
];
