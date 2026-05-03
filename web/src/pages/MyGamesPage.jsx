// ── My Games — list of saved games ──────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../utils/useAuth.js";

const TYPE_LABELS = {
  local: "Local 2-player",
  "vs-engine": "vs Stockfish",
  online: "Online",
};

function resultClass(game, userId) {
  if (game.result === "1/2-1/2") return "result-d";
  const userIsWhite = game.whiteUserId === userId;
  if (game.result === "1-0") return userIsWhite ? "result-w" : "result-l";
  if (game.result === "0-1") return userIsWhite ? "result-l" : "result-w";
  return "";
}

export default function MyGamesPage({ onOpenGame }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [type, setType] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (type) params.set("type", type);
      if (result) params.set("result", result);
      const r = await api.get(`/api/games?${params.toString()}`);
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e?.code || "load_failed");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, type, result]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  async function onDelete(gameId) {
    if (!confirm("Delete this game from your history?")) return;
    try {
      await api.delete(`/api/games/${gameId}`);
      load();
    } catch (e) {
      alert(`Could not delete: ${e?.code || "unknown"}`);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="fade-in">
      <div className="page-title">My Games</div>
      <div className="page-subtitle">All games you've played and saved.</div>

      <div className="filter-row">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="local">Local 2-player</option>
          <option value="vs-engine">vs Stockfish</option>
          <option value="online">Online</option>
        </select>
        <select value={result} onChange={(e) => { setResult(e.target.value); setPage(1); }}>
          <option value="">All results</option>
          <option value="1-0">White wins (1–0)</option>
          <option value="0-1">Black wins (0–1)</option>
          <option value="1/2-1/2">Draw (½–½)</option>
        </select>
        <button className="btn btn-sm btn-outline" onClick={load} disabled={loading}>↻ Refresh</button>
      </div>

      {error && <div className="form-error">Could not load games ({error}).</div>}

      <table className="games-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>White</th>
            <th>Black</th>
            <th>Result</th>
            <th>Termination</th>
            <th>Moves</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading && (
            <tr><td colSpan={8} style={{textAlign:"center",padding:"1.5rem",color:"var(--muted)"}}>
              No games yet — play a local, engine, or online game and it will appear here.
            </td></tr>
          )}
          {items.map(g => (
            <tr key={g.id} className="row-clickable" onClick={() => onOpenGame?.(g.id)}>
              <td>{new Date(g.startedAt).toLocaleString()}</td>
              <td>{TYPE_LABELS[g.type] || g.type}</td>
              <td>{g.whiteName}</td>
              <td>{g.blackName}</td>
              <td><span className={`result-pill ${resultClass(g, user.id)}`}>{g.result}</span></td>
              <td>{g.termination}</td>
              <td>{g.moves.length}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                >Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pager">
        <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span style={{fontSize:"0.82rem",color:"var(--muted)"}}>Page {page} / {totalPages} — {total} games</span>
        <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
