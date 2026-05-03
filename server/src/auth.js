// ── Auth: registration, login, logout, session middleware ───────────────────
//
// - Passwords hashed with bcrypt (cost 12).
// - Sessions are server-side: an opaque random session id is stored in an
//   httpOnly cookie and mapped to a user via the `sessions` collection.
// - Login + register are rate-limited to slow brute force.

import express from "express";
import bcrypt from "bcrypt";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { getDb, persist, newId } from "./db.js";

const BCRYPT_COST = 12;
const SESSION_COOKIE = "ca_sid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newSessionId() {
  return randomBytes(32).toString("hex");
}

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt };
}

export async function findUserBySessionCookie(sid) {
  if (!sid) return null;
  const db = await getDb();
  const session = db.data.sessions.find(s => s.id === sid);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Expired — clean it up.
    db.data.sessions = db.data.sessions.filter(s => s.id !== sid);
    await persist();
    return null;
  }
  const user = db.data.users.find(u => u.id === session.userId);
  return user || null;
}

// Express middleware that resolves req.user from the session cookie.
export async function attachUser(req, _res, next) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE];
    req.user = await findUserBySessionCookie(sid);
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "auth_required" });
  next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "rate_limited" },
});

function setSessionCookie(res, sid, expiresAt) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

async function createSession(userId) {
  const db = await getDb();
  const session = {
    id: newSessionId(),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  db.data.sessions.push(session);
  await persist();
  return session;
}

export const authRouter = express.Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "invalid_username" });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: "invalid_password" });
  }

  const db = await getDb();
  const lcUsername = username.toLowerCase();
  const lcEmail = email.toLowerCase();
  if (db.data.users.some(u => u.username.toLowerCase() === lcUsername)) {
    return res.status(409).json({ error: "username_taken" });
  }
  if (db.data.users.some(u => u.email.toLowerCase() === lcEmail)) {
    return res.status(409).json({ error: "email_taken" });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = {
    id: newId(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await persist();

  const session = await createSession(user.id);
  setSessionCookie(res, session.id, session.expiresAt);
  res.json({ user: publicUser(user) });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  if (!usernameOrEmail || typeof password !== "string") {
    return res.status(400).json({ error: "invalid_credentials" });
  }
  const db = await getDb();
  const lc = String(usernameOrEmail).toLowerCase();
  const user = db.data.users.find(u =>
    u.username.toLowerCase() === lc || u.email.toLowerCase() === lc,
  );
  if (!user) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const session = await createSession(user.id);
  setSessionCookie(res, session.id, session.expiresAt);
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", async (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) {
    const db = await getDb();
    db.data.sessions = db.data.sessions.filter(s => s.id !== sid);
    await persist();
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export { SESSION_COOKIE };
