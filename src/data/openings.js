export const START = [
  ["bR","bN","bB","bQ","bK","bB","bN","bR"],
  ["bP","bP","bP","bP","bP","bP","bP","bP"],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ["wP","wP","wP","wP","wP","wP","wP","wP"],
  ["wR","wN","wB","wQ","wK","wB","wN","wR"],
];

export function applyMoves(moves) {
  const board = START.map(r => [...r]);
  for (const m of moves) {
    const piece = board[m.r][m.c];
    board[m.tr][m.tc] = piece;
    board[m.r][m.c] = null;
  }
  return board;
}

export const OPENINGS = [
  {
    id:"italian", name:"Italian Game", color:"green",
    tags:["Opening","Beginner-friendly"],
    diff:1, side:"White",
    desc:"One of the oldest openings. White aims to control the center, develop quickly, and build toward a kingside attack via f4 or d3.",
    moves:["e4","e5","Nf3","Nc6","Bc4"],
    positions:[
      { board: applyMoves([]), annotation:"The starting position. White aims to control the center with pawns and develop pieces rapidly.", highlight:[] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4}]), annotation:"1. e4 — Controls the center, opens lines for the bishop and queen.", highlight:[[4,4]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:4,tr:3,tc:4}]), annotation:"1...e5 — Black mirrors White, fighting for center control.", highlight:[[3,4]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:4,tr:3,tc:4},{r:7,c:6,tr:5,tc:5}]), annotation:"2. Nf3 — Develops a knight to a great square, attacks e5.", highlight:[[5,5]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:4,tr:3,tc:4},{r:7,c:6,tr:5,tc:5},{r:0,c:1,tr:2,tc:2}]), annotation:"2...Nc6 — Defends e5 and develops a piece.", highlight:[[2,2]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:4,tr:3,tc:4},{r:7,c:6,tr:5,tc:5},{r:0,c:1,tr:2,tc:2},{r:7,c:5,tr:4,tc:2}]), annotation:"3. Bc4 — The Italian! The bishop eyes the f7 pawn — Black's most vulnerable square. White is ready to castle and launch middlegame play.", highlight:[[4,2]] },
    ],
    ideas:["Control center with e4+d3 or d4","Develop Nf3, Bc4, castle kingside","Attack via f4-f5 or central break d4","Watch for f7 weakness"],
  },
  {
    id:"london", name:"London System", color:"gold",
    tags:["Opening","Solid"],
    diff:1, side:"White",
    desc:"A solid, flexible opening where White builds a strong pawn triangle (d4, e3, c3) and bishop on f4. Easy to learn, hard to crack.",
    moves:["d4","d5","Nf3","Nf6","Bf4"],
    positions:[
      { board: applyMoves([]), annotation:"Starting position. White will build a solid pawn structure.", highlight:[] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3}]), annotation:"1. d4 — Controls the center. The London starts here.", highlight:[[4,3]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:1,c:3,tr:3,tc:3}]), annotation:"1...d5 — Black contests the center symmetrically.", highlight:[[3,3]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:1,c:3,tr:3,tc:3},{r:7,c:6,tr:5,tc:5}]), annotation:"2. Nf3 — Developing the knight toward the center.", highlight:[[5,5]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:1,c:3,tr:3,tc:3},{r:7,c:6,tr:5,tc:5},{r:0,c:6,tr:2,tc:5}]), annotation:"2...Nf6 — Black develops and prepares.", highlight:[[2,5]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:1,c:3,tr:3,tc:3},{r:7,c:6,tr:5,tc:5},{r:0,c:6,tr:2,tc:5},{r:7,c:5,tr:5,tc:3}]), annotation:"3. Bf4 — The London bishop! Active outside the pawn chain. White has a very solid setup. Next: e3, c3, Nbd2, Bd3.", highlight:[[5,3]] },
    ],
    ideas:["Build pawn triangle: d4, e3, c3","Develop Bf4 before e3 (key move order!)","Nbd2 supports center, avoids pins","Queenside expansion or kingside attack possible"],
  },
  {
    id:"carokann", name:"Caro-Kann Defense", color:"red",
    tags:["Opening","Solid","Black"],
    diff:2, side:"Black",
    desc:"Black's solid answer to 1.e4. Avoids the sharp Sicilian while maintaining a strong pawn structure. Favored by positional players.",
    moves:["e4","c6","d4","d5"],
    positions:[
      { board: applyMoves([]), annotation:"Starting position. Black will answer 1.e4 with the Caro-Kann.", highlight:[] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4}]), annotation:"1. e4 — White stakes a claim in the center.", highlight:[[4,4]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:2,tr:2,tc:2}]), annotation:"1...c6 — The Caro-Kann! Black prepares d5 with solid pawn support.", highlight:[[2,2]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:2,tr:2,tc:2},{r:6,c:3,tr:4,tc:3}]), annotation:"2. d4 — White establishes a strong center.", highlight:[[4,3]] },
      { board: applyMoves([{r:6,c:4,tr:4,tc:4},{r:1,c:2,tr:2,tc:2},{r:6,c:3,tr:4,tc:3},{r:1,c:3,tr:3,tc:3}]), annotation:"2...d5 — Black challenges! Unlike the French, Black's light-squared bishop isn't locked in. This is the key difference.", highlight:[[3,3]] },
    ],
    ideas:["Solid pawn structure, no weak pawns","Light-squared bishop is active (unlike French)","Play ...Bf5 or ...Bg4 to develop","Counterattack with ...c5 or ...e5 in middlegame"],
  },
  {
    id:"kingsindian", name:"King's Indian Defense", color:"green",
    tags:["Opening","Dynamic","Black"],
    diff:3, side:"Black",
    desc:"Black allows White a strong center, then launches a fierce kingside counterattack. Favored by fighters and attacking players.",
    moves:["d4","Nf6","c4","g6","Nc3","Bg7"],
    positions:[
      { board: applyMoves([]), annotation:"Starting position. The King's Indian is one of chess's most dynamic openings.", highlight:[] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3}]), annotation:"1. d4 — White goes for the center.", highlight:[[4,3]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:0,c:6,tr:2,tc:5}]), annotation:"1...Nf6 — Black develops, preparing to fianchetto.", highlight:[[2,5]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:0,c:6,tr:2,tc:5},{r:6,c:2,tr:4,tc:2}]), annotation:"2. c4 — White expands, claiming even more space.", highlight:[[4,2]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:0,c:6,tr:2,tc:5},{r:6,c:2,tr:4,tc:2},{r:1,c:6,tr:2,tc:6}]), annotation:"2...g6 — Black prepares the fianchetto bishop on g7.", highlight:[[2,6]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:0,c:6,tr:2,tc:5},{r:6,c:2,tr:4,tc:2},{r:1,c:6,tr:2,tc:6},{r:7,c:1,tr:5,tc:2}]), annotation:"3. Nc3 — White develops and prepares e4.", highlight:[[5,2]] },
      { board: applyMoves([{r:6,c:3,tr:4,tc:3},{r:0,c:6,tr:2,tc:5},{r:6,c:2,tr:4,tc:2},{r:1,c:6,tr:2,tc:6},{r:7,c:1,tr:5,tc:2},{r:0,c:5,tr:2,tc:6}]), annotation:"3...Bg7 — The King's Indian bishop! A powerful long diagonal piece that supports Black's future kingside attack with ...e5 and ...f5.", highlight:[[2,6]] },
    ],
    ideas:["Let White have the center — then attack it!","Counterplay with ...e5 in the center","Kingside attack: ...f5-f4, ...Ng4","The g7 bishop becomes a monster in the endgame"],
  },
];
