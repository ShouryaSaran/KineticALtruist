import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../utils/api";
import "../styles/AdminDraws.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseNumbers(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [mode, setMode] = useState("random");

  useEffect(() => {
    if (!runResult) return undefined;
    const timer = setTimeout(() => setRunResult(null), 5000);
    return () => clearTimeout(timer);
  }, [runResult]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const fetchDraws = async () => {
    const response = await api.get("/api/admin/draws");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchDraws();
        if (!alive) return;
        setDraws(rows);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load draws.");
        setDraws([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const runDraw = async () => {
    setRunning(true);
    setError("");
    setRunResult(null);

    try {
      const response = await api.post("/api/admin/draws/run", { mode });
      const result = response.data?.data || null;
      setRunResult(result);
      setSimulationResult(null);
      setRunModalOpen(false);

      const rows = await fetchDraws();
      setDraws(rows);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to run draw.");
    } finally {
      setRunning(false);
    }
  };

  const simulateDraw = async () => {
    if (running) return;
    setRunning(true);
    setError("");
    setRunResult(null);

    try {
      const response = await api.post("/api/admin/draws/simulate", { mode });
      setSimulationResult(response.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to simulate draw.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminShell overline="Admin Draws" title="Draws" subtitle="Run monthly draws and audit published history.">
      <article className="admin-card">
        <div className="admin-actions">
          <h2>Draws</h2>
          <div className="admin-filter-group">
            <select value={mode} onChange={(event) => setMode(event.target.value)} className="admin-btn-lite">
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic</option>
            </select>
            <button type="button" className="admin-btn-lite" onClick={simulateDraw} disabled={running}>
              {running ? "Simulating..." : "Simulate"}
            </button>
            <button type="button" className="admin-btn" onClick={() => setRunModalOpen(true)}>Run New Draw</button>
          </div>
        </div>

        {simulationResult ? (
          <div className="admin-success admin-message-spacing">
            Simulation ({(simulationResult.mode || mode).toUpperCase()}) - Numbers: {(simulationResult.drawNumbers || []).join(", ")} | Winners - 5 Match: {simulationResult.winners?.fiveMatch?.length || 0}, 4 Match: {simulationResult.winners?.fourMatch?.length || 0}, 3 Match: {simulationResult.winners?.threeMatch?.length || 0}
          </div>
        ) : null}

        {runResult ? (
          <div className="admin-success admin-message-spacing">
            Draw completed. Numbers: {(runResult.drawNumbers || []).join(", ")} | Winners - 5 Match: {runResult.winners?.fiveMatch?.length || 0}, 4 Match: {runResult.winners?.fourMatch?.length || 0}, 3 Match: {runResult.winners?.threeMatch?.length || 0}
          </div>
        ) : null}

        {loading ? <div className="admin-spinner-wrap"><span className="admin-spinner" /></div> : null}
        {!loading && error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error ? (
          draws.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numbers</th>
                    <th>Jackpot</th>
                    <th>Four Match</th>
                    <th>Three Match</th>
                    <th>Rolled Over</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw, index) => (
                    <tr key={draw.id || `draw-${index}`}>
                      <td>{formatDate(draw.draw_date || draw.date)}</td>
                      <td>{parseNumbers(draw.numbers).join(", ") || "N/A"}</td>
                      <td>{formatCurrency(draw.jackpot_amount)}</td>
                      <td>{formatCurrency(draw.four_match_amount)}</td>
                      <td>{formatCurrency(draw.three_match_amount)}</td>
                      <td>{draw.jackpot_rolled_over ? "Yes" : "No"}</td>
                      <td>
                        <span className={`admin-badge ${(draw.status || "").toString().toLowerCase() === "published" ? "success" : "pending"}`}>
                          {draw.status || "draft"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No draws found.</p>
          )
        ) : null}
      </article>

      {runModalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">Run New Draw</h3>
              <button type="button" className="admin-btn-lite" onClick={() => setRunModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <p className="admin-modal-copy">
              Are you sure you want to run this month's draw in <strong>{mode.toUpperCase()}</strong> mode?
            </p>

            <div className="admin-modal-actions">
              <button type="button" className="admin-btn-lite" onClick={() => setRunModalOpen(false)} disabled={running}>Cancel</button>
              <button type="button" className="admin-btn" onClick={runDraw} disabled={running}>{running ? "Running..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
