// ── LowDB-backed JSON database ──────────────────────────────────────────────
//
// Wraps lowdb so the rest of the server treats it like a tiny document store.
// All writes go through `persist()` which calls `db.write()` once the in-memory
// state has been mutated. A timestamped backup of `db.json` is taken once a
// day on server start.
//
// Schema (collections inside db.json):
//   users:    { id, username, email, passwordHash, createdAt }
//   sessions: { id, userId, createdAt, expiresAt }
//   games:    { id, type, whiteUserId, blackUserId, whiteName, blackName,
//               engineRating?, timeControl?, result, termination,
//               startedAt, endedAt, pgn, moves: [{ san, uci, fenAfter,
//               timeLeftWhiteMs?, timeLeftBlackMs? }] }
//   analyses: { id, gameId, userId, createdAt, updatedAt, summary,
//               notes: [{ ply, comment }] }
//
// If/when the data outgrows a flat file, the swap target is better-sqlite3
// — same shape of code, no migration drama.

import { JSONFilePreset } from "lowdb/node";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "..", "db.json");

const DEFAULT_DATA = {
  users: [],
  sessions: [],
  games: [],
  analyses: [],
};

let dbPromise = null;

async function makeBackup() {
  try {
    const stat = await fs.stat(DB_PATH);
    if (!stat.isFile()) return;
    const ymd = new Date().toISOString().slice(0, 10);
    const backupPath = `${DB_PATH}.bak.${ymd}`;
    try {
      await fs.access(backupPath);
      // backup for today already exists — skip
    } catch {
      await fs.copyFile(DB_PATH, backupPath);
    }
  } catch {
    // No file yet — nothing to back up.
  }
}

export async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      await makeBackup();
      const db = await JSONFilePreset(DB_PATH, DEFAULT_DATA);
      // Ensure all default collections exist (in case of older db.json files).
      let dirty = false;
      for (const k of Object.keys(DEFAULT_DATA)) {
        if (!Array.isArray(db.data[k])) {
          db.data[k] = [];
          dirty = true;
        }
      }
      if (dirty) await db.write();
      return db;
    })();
  }
  return dbPromise;
}

export function newId() {
  return randomUUID();
}

export async function persist() {
  const db = await getDb();
  await db.write();
}
