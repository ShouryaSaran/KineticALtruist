import { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import api from "../utils/api";
import "../styles/AdminDashboard.css";

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

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        api.get("/api/admin/users"),
        api.get("/api/admin/draws"),
        api.get("/api/admin/winners"),
      ]);

      if (!alive) return;

      const [usersRes, drawsRes, winnersRes] = results;

      setUsers(
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value.data?.data)
          ? usersRes.value.data.data
          : []
      );
      setDraws(
        drawsRes.status === "fulfilled" && Array.isArray(drawsRes.value.data?.data)
          ? drawsRes.value.data.data
          : []
      );
      setWinners(
        winnersRes.status === "fulfilled" && Array.isArray(winnersRes.value.data?.data)
          ? winnersRes.value.data.data
          : []
      );

      const failures = [];
      if (usersRes.status === "rejected") failures.push(usersRes.reason?.response?.data?.error || "users");
      if (drawsRes.status === "rejected") failures.push(drawsRes.reason?.response?.data?.error || "draws");
      if (winnersRes.status === "rejected") failures.push(winnersRes.reason?.response?.data?.error || "winners");

      setError(failures.length ? `Some admin data failed to load: ${failures.join(" | ")}` : "");
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalPrizesPaid = winners.reduce((sum, winner) => sum + (Number(winner?.prize_amount) || 0), 0);
    return {
      users: users.length,
      draws: draws.length,
      winners: winners.length,
      totalPrizesPaid,
    };
  }, [users, draws, winners]);

  return (
    <AdminShell
      overline="Admin Overview"
      title="Dashboard"
      subtitle="Monitor users, draws, winners, and payouts at a glance."
    >
      {loading ? (
        <div className="admin-spinner-wrap"><span className="admin-spinner" /></div>
      ) : (
        <>
          {error ? <div className="admin-error">{error}</div> : null}

          <div className="admin-grid-2">
            <article className="admin-card">
              <h2>Total Users</h2>
              <p className="admin-kpi-value">{stats.users}</p>
            </article>

            <article className="admin-card">
              <h2>Total Draws Run</h2>
              <p className="admin-kpi-value">{stats.draws}</p>
            </article>

            <article className="admin-card">
              <h2>Total Winners</h2>
              <p className="admin-kpi-value">{stats.winners}</p>
            </article>

            <article className="admin-card">
              <h2>Total Prizes Paid</h2>
              <p className="admin-kpi-value">{formatCurrency(stats.totalPrizesPaid)}</p>
            </article>
          </div>

          <article className="admin-card">
            <h2>Recent Draws</h2>
            {draws.length ? (
              <div className="admin-table-wrap admin-table-topgap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Numbers</th>
                      <th>Jackpot Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draws.slice(0, 6).map((draw, index) => (
                      <tr key={draw.id || `draw-${index}`}>
                        <td>{formatDate(draw.draw_date || draw.date)}</td>
                        <td>{parseNumbers(draw.numbers).join(", ") || "N/A"}</td>
                        <td>{formatCurrency(draw.jackpot_amount)}</td>
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
              <p className="admin-empty">No draws yet.</p>
            )}
          </article>

          <article className="admin-card">
            <h2>Recent Winners</h2>
            {winners.length ? (
              <div className="admin-table-wrap admin-table-topgap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Match Type</th>
                      <th>Prize Amount</th>
                      <th>Payout Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.slice(0, 8).map((winner) => {
                      const payout = (winner.payout_status || "pending").toString().toLowerCase();
                      return (
                        <tr key={winner.id}>
                          <td>{winner.user_id}</td>
                          <td>{(winner.match_type || "").replace("_", " ").toUpperCase()}</td>
                          <td>{formatCurrency(winner.prize_amount)}</td>
                          <td>
                            <span className={`admin-badge ${payout === "paid" ? "success" : "pending"}`}>{payout}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">No winners yet.</p>
            )}
          </article>
        </>
      )}
    </AdminShell>
  );
}
