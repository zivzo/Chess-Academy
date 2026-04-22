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
└── chess-academy.jsx   # The entire application — styles, data, and components
```

### Sections inside `chess-academy.jsx`

| Lines | Section | Purpose |
|---|---|---|
| 16 | Imports | React hooks (only `useState` is actively used; `useEffect` and `useCallback` are imported but currently unused) |
| 27–297 | `GlobalStyles` | All CSS custom properties, layout, and component styles |
| 299–313 | `PIECES` | Unicode map for white/black chess pieces |
| 315–348 | `START` | 8×8 board matrix representing the starting position |
| 350–432 | `OPENINGS` | Static data for all 4 openings (moves, positions, annotations) |
| 434–454 | `applyMoves()` | Helper that builds a board state from a sequence of moves |
| 456–481 | `CONCEPTS` | 12 middlegame strategy concept objects |
| 483–502 | `QUIZZES` | 6 quiz question objects with options, correct answer, and explanation |
| 504–563 | `Dashboard` | Home page component |
| 564–598 | `OpeningsPage` | Opening library grid component |
| 600–680 | `BoardViewer` | Interactive board viewer with move navigation |
| 682–728 | `StrategyPage` | Middlegame concepts grid component |
| 730–814 | `QuizPage` | Quiz flow component |
| 816–855 | `TheoryPage` | Static theory article cards component |
| 857–949 | `ChessAcademy` | Root app component — nav, sidebar, and page routing |

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

Import and render `ChessAcademy` as a top-level page component inside any React app:

```jsx
import ChessAcademy from './chess-academy';

export default function App() {
  return <ChessAcademy />;
}
```

The component is fully self-contained — it injects its own global styles and requires no additional CSS imports.

---

## Study Roadmap (built into the app)

| Phase | Timeframe | Focus |
|---|---|---|
| Phase 1 | Week 1–2 | Learn 1 White opening + 1 Black opening; understand the ideas |
| Phase 2 | Week 3–4 | Study 6 middlegame concepts; review them after every game |
| Phase 3 | Ongoing | 15 min daily tactics on Lichess + analyze games with an engine |
