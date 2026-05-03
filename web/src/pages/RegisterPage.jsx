// ── Register page ───────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../utils/useAuth.js";

const ERROR_MESSAGES = {
  invalid_username: "Username must be 3–24 characters: letters, numbers, _ or -.",
  invalid_email: "Please enter a valid email address.",
  invalid_password: "Password must be at least 8 characters.",
  username_taken: "That username is already in use.",
  email_taken: "That email is already registered.",
  rate_limited: "Too many attempts. Please wait and try again.",
};

export default function RegisterPage({ onSuccess, onSwitch }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(username.trim(), email.trim(), password);
      onSuccess?.();
    } catch (err) {
      setError(err?.code || "unknown");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-title" style={{textAlign:"center"}}>Create an account</div>
      <div className="page-subtitle" style={{textAlign:"center"}}>
        Save game history, analyze your games, and play online.
      </div>
      <form className="auth-shell" onSubmit={onSubmit}>
        {error && <div className="form-error">{ERROR_MESSAGES[error] || `Registration failed (${error}).`}</div>}
        <div className="form-row">
          <label htmlFor="reg-user">Username</label>
          <input
            id="reg-user"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_-]{3,24}"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="reg-pw">Password (8+ characters)</label>
          <input
            id="reg-pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="auth-actions">
          <button type="button" className="form-link" onClick={onSwitch}>
            Already have an account? Log in →
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
