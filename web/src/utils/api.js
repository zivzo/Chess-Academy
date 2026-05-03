// ── Tiny fetch wrapper for the backend API ──────────────────────────────────
//
// All endpoints return JSON. Network/parse failures and non-2xx responses
// both throw `ApiError` so callers can `try/catch` uniformly.

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.status = status ?? 0;
    this.code = code ?? null;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(`Network error: ${e.message}`);
  }
  let payload = null;
  try { payload = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    const code = payload?.error || `http_${res.status}`;
    throw new ApiError(code, { status: res.status, code });
  }
  return payload;
}

export const api = {
  get:    (p)       => request("GET", p),
  post:   (p, body) => request("POST", p, body),
  put:    (p, body) => request("PUT", p, body),
  delete: (p)       => request("DELETE", p),
};
