// ── Auth context: current user + login/register/logout helpers ──────────────
// The React Context object lives in `authContext.js` so this file only
// exports a component (required for fast-refresh).
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolve the current session on first mount.
  useEffect(() => {
    let cancelled = false;
    api.get("/api/auth/me")
      .then(r => { if (!cancelled) setUser(r.user || null); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    setError(null);
    try {
      const r = await api.post("/api/auth/login", { usernameOrEmail, password });
      setUser(r.user);
      return r.user;
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "unknown";
      setError(code);
      throw e;
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setError(null);
    try {
      const r = await api.post("/api/auth/register", { username, email, password });
      setUser(r.user);
      return r.user;
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "unknown";
      setError(code);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try { await api.post("/api/auth/logout"); }
    catch { /* ignore */ }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
