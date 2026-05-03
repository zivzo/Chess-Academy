# Chess Academy

A small chess training app with:

- A **React + Vite** SPA (`web/`) for openings, theory, strategy, quiz, local
  2-player play, play vs Stockfish, online play, history, and per-game analysis.
- A **Node/Express** backend (`server/`) that owns auth, saved games,
  per-user analysis notes, and the real-time online chess server with clocks.

## Layout

```
Chess-Academy/
  web/                   ← React + Vite SPA
  server/                ← Express + WebSocket + LowDB backend
    src/
      index.js           ← entry point
      auth.js            ← register / login / logout / me, bcrypt + cookie sessions
      games.js           ← /api/games and /api/analyses REST
      online.js          ← WebSocket lobby + server-authoritative live games
      chess-engine.js    ← move validator + FEN/SAN helpers (re-uses chess-rules.js)
      db.js              ← LowDB-backed JSON store (db.json)
    db.json              ← database file (auto-created, gitignored)
  chess-rules.js         ← shared rules engine, used by web AND server
  chess-board.js         ← shared piece tables / starting position
  tests/                 ← node:test suite for the rules engine
```

## Running locally

```bash
npm run install:all     # installs root, server, and web deps
npm run dev             # starts server (:3001) + Vite (:5173) together
```

Then open <http://localhost:5173>. Vite proxies `/api/*` and `/ws` to the
backend so cookies stay first-party.

Single workspaces:

```bash
npm run dev:server      # backend only
npm run dev:web         # frontend only
npm run build           # production build of the SPA
npm test                # run the rules-engine test suite
```

## Storage

The backend stores everything in `server/db.json` using
[**LowDB v7**](https://github.com/typicode/lowdb). The schema:

- `users`     — `{ id, username, email, passwordHash, createdAt }`
- `sessions`  — opaque session ids that map a cookie to a user
- `games`     — finished or in-progress games (PGN + per-move FENs)
- `analyses`  — per-user notes for a given game

A timestamped backup of `db.json` is written on server start
(`db.json.bak.YYYY-MM-DD`).

### When to outgrow LowDB

The shape of the code is intentionally close to a tiny document store. If
the file ever gets too big or write contention becomes a problem, the
swap target is **better-sqlite3** — same async/await wrapper, no model
changes — using `users`, `sessions`, `games`, `analyses` as tables.
LowDB itself will continue to be fine for a personal-scale hobby app.

## Auth

- Passwords are hashed with **bcrypt** (cost 12).
- Sessions are server-side: a 32-byte random opaque token in an
  `httpOnly`, `sameSite=lax`, `secure` (in prod) cookie maps to a row in
  `sessions` with a 30-day TTL.
- `POST /api/auth/{register,login,logout}` and `GET /api/auth/me`.
- Login + register are rate-limited (`express-rate-limit`).

## Online games

WebSocket-based, **server-authoritative**:

- `/ws` upgrade is authenticated by reading the session cookie.
- One `LiveGame` object per match in server memory (also persisted to
  `games`). Every move is validated using the same `chess-rules.js` the
  frontend uses — the client cannot inject illegal moves.
- **Fischer clocks**: each side has `remainingMs` plus an `increment`.
  When it becomes player X's turn, `turnStartedAt` is recorded; on their
  move, `remainingMs -= elapsed; remainingMs += increment`. A
  `setTimeout` armed for `remainingMs` flags X if it fires before a move
  arrives.
- **Reconnect grace**: on disconnect mid-game, the player has 30 seconds
  to reconnect (the WS rebinds and re-syncs from the latest authoritative
  state) before the opponent wins by abandonment.
- **Lobby**: open challenges + a "quick match" queue keyed by time
  control. Default time controls: 1+0, 3+0, 3+2, 5+0, 10+0.

## Frontend pages

- **Login / Register** — `LoginPage`, `RegisterPage`.
- **My Games** — paginated list of saved games with type/result filters.
- **Analysis** — replay any saved game, per-ply Stockfish eval +
  blunder-finder, eval graph, and per-user notes (auto-saved).
- **Online Lobby + Online Game** — quick match, open challenges,
  in-game chat, resign, draw offer/accept/decline, and a "🔍 Analyze"
  button on the game-over modal that jumps to the Analysis page for
  the just-finished game.
- Existing pages (Local Game, vs Stockfish) now save finished games to
  `/api/games` when a logged-in user finishes them. Guest play still
  works — it just isn't persisted to the server.
