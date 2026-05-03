// ── Login page ──────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../utils/useAuth.js";

const ERROR_MESSAGES = {
  invalid_credentials: "Invalid username/email or password.",
  rate_limited: "Too many attempts. Please wait and try again.",
  network_error: "Cannot reach the server. Is it running?",
};

export default function LoginPage({ onSuccess, onSwitch }) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(usernameOrEmail.trim(), password);
      onSuccess?.();
    } catch (err) {
      setError(err?.code || "unknown");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-title" style={{textAlign:"center"}}>Welcome back</div>
      <div className="page-subtitle" style={{textAlign:"center"}}>
        Log in to track your games and play online.
      </div>
      <form className="auth-shell" onSubmit={onSubmit}>
        {error && <div className="form-error">{ERROR_MESSAGES[error] || `Login failed (${error}).`}</div>}
        <div className="form-row">
          <label htmlFor="login-id">Username or email</label>
          <input
            id="login-id"
            type="text"
            autoComplete="username"
            required
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="login-pw">Password</label>
          <input
            id="login-pw"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="auth-actions">
          <button type="button" className="form-link" onClick={onSwitch}>
            Don't have an account? Register →
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}
