export default function TheoryPage() {
  return (
    <div className="fade-in">
      <div className="page-title">Chess Theory Deep Dives</div>
      <div className="page-subtitle">Core principles that underpin everything — from move 1 to the endgame.</div>

      {[
        {
          title: "The 3 Principles of the Opening",
          body: `Every good opening follows three principles: (1) Control the center — with pawns on e4/d4 or by attacking those squares. (2) Develop your pieces — get knights before bishops, bishops before rooks. (3) Ensure king safety — castle early, usually kingside.\n\nViolating these principles is the #1 cause of losses at the 800–1200 level. Before any tactical calculation in the opening, ask: "Am I following all three principles?"`,
        },
        {
          title: "Understanding Pawn Structure",
          body: `Pawn structure determines the middlegame plan. Isolated pawns (no pawn neighbors) are a weakness — target them with rooks and knights. Passed pawns (no enemy pawns blocking them) are a strength — advance them to promote.\n\nDoubled pawns can be weak but also open files for rooks. Backward pawns can't be defended by other pawns. Learn to identify these patterns and they'll tell you your plan automatically.`,
        },
        {
          title: "The Concept of Imbalances (Silman)",
          body: `Jeremy Silman's system: every position has imbalances — differences between the two sides. These include: minor piece imbalance (bishop vs knight), pawn structure differences, space, piece activity, king safety, and initiative.\n\nYour job is to identify the imbalances in your position and make a plan that exploits yours while targeting your opponent's weaknesses. This single concept can replace memorizing 1,000 specific positions.`,
        },
        {
          title: "Tempo and Initiative",
          body: `A tempo is a move. If you gain a tempo, you're a move ahead in development. If you lose one, you fall behind. The initiative means your opponent must respond to your threats instead of executing their own plans.\n\nDon't make unnecessary pawn moves in the opening — each one wastes a tempo. Every move should develop a piece, control center, or improve king safety. When you have the initiative, keep making threats. When you don't, find the most challenging move to seize it back.`,
        },
      ].map((item, i) => (
        <div className="card" key={i}>
          <div className="card-title">{item.title}</div>
          <div className="card-body" style={{ whiteSpace:"pre-line" }}>{item.body}</div>
        </div>
      ))}
    </div>
  );
}
