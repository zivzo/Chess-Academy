export const BOT_LEVELS = [
  { rating: 200,  name: "Beginner",         emoji: "🐣", depth: 1, errorRate: 0.85,  description: "Makes mostly random moves with frequent blunders." },
  { rating: 400,  name: "Novice",           emoji: "🌱", depth: 1, errorRate: 0.60,  description: "Plays randomly but occasionally captures pieces." },
  { rating: 600,  name: "Amateur",          emoji: "📗", depth: 1, errorRate: 0.35,  description: "Captures free pieces, misses tactics." },
  { rating: 800,  name: "Club Beginner",    emoji: "♟",  depth: 2, errorRate: 0.20,  description: "Avoids obvious blunders, basic tactics." },
  { rating: 1000, name: "Club Player",      emoji: "🎯", depth: 2, errorRate: 0.10,  description: "Plays principled moves, simple strategy." },
  { rating: 1200, name: "Intermediate",     emoji: "⚔️", depth: 3, errorRate: 0.05,  description: "Sees 2-3 move combinations." },
  { rating: 1400, name: "Advanced",         emoji: "🏆", depth: 3, errorRate: 0.02,  description: "Solid positional play, good tactics." },
  { rating: 1600, name: "Expert",           emoji: "🌟", depth: 4, errorRate: 0.01,  description: "Deep calculation, strong positional understanding." },
  { rating: 1800, name: "Master",           emoji: "👑", depth: 4, errorRate: 0.005, description: "Near-master level, complex strategy." },
  { rating: 2000, name: "Candidate Master", emoji: "💎", depth: 5, errorRate: 0,     description: "Strong candidate master level play." },
];
