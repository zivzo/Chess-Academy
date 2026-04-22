# Chess Academy

An interactive, single-component chess learning app built with React. Designed for players at the **800–1400 rating level**, Chess Academy teaches openings, middlegame strategy, and chess theory through annotated interactive boards, concept cards, and knowledge quizzes.

---

## Features

| Section | Description |
|---|---|
| **Dashboard** | Overview of learning progress with navigation shortcuts and a study roadmap |
| **Opening Library** | 4 core openings with move-by-move interactive boards and annotations |
| **Middlegame Strategy** | 12 essential middlegame concepts with expandable explanations |
| **Theory Notes** | Deep-dive articles on opening principles, pawn structure, imbalances, and tempo |
| **Knowledge Quiz** | 6-question quiz with instant feedback and explanations |

### Openings covered

- Italian Game *(Beginner, White)*
- London System *(Beginner, White)*
- Caro-Kann Defense *(Intermediate, Black)*
- King's Indian Defense *(Advanced, Black)*

---

## Tech Stack

- **React** – function components with hooks (`useState`)
- **JSX** – component and UI definition
- **CSS-in-JS** – all styles injected via a `<style>` tag component (`GlobalStyles`); no external CSS files or UI libraries
- **Google Fonts** – Playfair Display, DM Sans, DM Mono (loaded via `@import`)
- **Unicode chess symbols** – pieces rendered as UTF-8 characters (no image assets)

> There is no build config or `package.json` in this repository. `chess-academy.jsx` is a self-contained component intended to be dropped into an existing React project.

---

## File Structure

```
Chess-Academy/
├── chess-academy.jsx          # React UI layer — styles, components, routing
├── chess-core.js              # Pure-data module — chess content & applyMoves helper
├── package.json               # npm metadata & test script
├── tests/
│   └── chess-core.test.js     # Unit tests for chess-core.js (Node built-in runner)
└── README.md
```

### Sections inside `chess-core.js`

| Lines | Section | Purpose |
|---|---|---|
| 1–18 | Module header | File-level JSDoc |
| 19–34 | `PIECES` | Unicode map for white/black chess pieces |
| 35–47 | `START` | 8×8 board matrix representing the starting position |
| 48–65 | `applyMoves()` | Coordinate-based board-state builder |
| 66–97 | `OPENINGS` | Static data for all 4 openings (moves, positions, annotations) |
| 98–114 | `CONCEPTS` | 12 middlegame strategy concept objects |
| 115–129 | `QUIZZES` | 6 quiz question objects with options, correct answer, and explanation |

### Sections inside `chess-academy.jsx`

| Lines | Section | Purpose |
|---|---|---|
| 18–19 | Imports | React `useState` + data imports from `chess-core.js` |
| 30–298 | `GlobalStyles` | All CSS custom properties, layout, and component styles |
| 301–360 | `Dashboard` | Home page component |
| 361–396 | `OpeningsPage` | Opening library grid component |
| 397–477 | `BoardViewer` | Interactive board viewer with move navigation |
| 479–525 | `StrategyPage` | Middlegame concepts grid component |
| 527–611 | `QuizPage` | Quiz flow component |
| 613–652 | `TheoryPage` | Static theory article cards component |
| 654–746 | `ChessAcademy` | Root app component — nav, sidebar, and page routing |

---

## Data Shapes

### `OPENINGS` entry
```js
{
  id: string,          // Unique identifier (e.g. "italian")
  name: string,        // Display name
  color: string,       // Accent color class ("green" | "gold" | "red")
  tags: string[],      // Labels shown on the card
  diff: 1 | 2 | 3,    // Difficulty: 1=Beginner, 2=Intermediate, 3=Advanced
  side: string,        // "White" or "Black"
  desc: string,        // Short description for the card
  moves: string[],     // Algebraic notation move list (display only)
  positions: {         // One entry per board step (length = moves.length + 1)
    board: (string|null)[][],  // 8×8 matrix of piece codes or null
    annotation: string,        // Explanatory text for this step
    highlight: [number, number][], // [row, col] squares to highlight
  }[],
  ideas: string[],     // Bullet-point strategic ideas
}
```

### `PIECES` map
Piece codes follow the pattern `{color}{type}` where color is `w` (white) or `b` (black) and type is one of `K Q R B N P`.

```js
// Example: "wK" → "♔",  "bP" → "♟"
```

### `START` board
An 8×8 array of piece code strings or `null`. Row 0 is Black's back rank; row 7 is White's back rank. Columns 0–7 map to files a–h.

### `QUIZZES` entry
```js
{
  q: string,           // Question text
  opts: string[],      // Array of answer options
  correct: number,     // Index into opts for the correct answer
  explanation: string, // Explanation shown after answering
}
```

### `CONCEPTS` entry
```js
{
  icon: string,   // Emoji icon
  title: string,  // Concept name
  tag: string,    // Category tag ("mid" for middlegame)
  desc: string,   // Full description text
}
```

---

## Usage

Import and render `ChessAcademy` as a top-level page component inside any React app. Make sure both `chess-academy.jsx` and `chess-core.js` are present in the same directory:

```jsx
import ChessAcademy from './chess-academy';

export default function App() {
  return <ChessAcademy />;
}
```

The component injects its own global styles and requires no additional CSS imports. All chess data is loaded from `chess-core.js` at import time.

## Running Tests

The test suite uses Node's built-in test runner (Node ≥ 18) and targets `chess-core.js`:

```bash
npm test
```

---

## Study Roadmap (built into the app)

| Phase | Timeframe | Focus |
|---|---|---|
| Phase 1 | Week 1–2 | Learn 1 White opening + 1 Black opening; understand the ideas |
| Phase 2 | Week 3–4 | Study 6 middlegame concepts; review them after every game |
| Phase 3 | Ongoing | 15 min daily tactics on Lichess + analyze games with an engine |
