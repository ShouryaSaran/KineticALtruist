import { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import api from "../utils/api";
import "../styles/AdminWinners.css";

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

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const fetchWinners = async () => {
    const response = await api.get("/api/admin/winners");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchWinners();
        if (!alive) return;
        setWinners(rows);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load winners.");
        setWinners([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filteredWinners = useMemo(() => {
    if (activeFilter === "all") return winners;
    return winners.filter((winner) => (winner?.payout_status || "").toString().toLowerCase() === activeFilter);
  }, [winners, activeFilter]);

  const updateWinnerStatus = async (winnerId, status) => {
    if (!winnerId) return;
    setUpdatingId(winnerId);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/api/admin/winners/${winnerId}`, { payout_status: status });
      const rows = await fetchWinners();
      setWinners(rows);
      setSuccess(`Winner marked as ${status}.`);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update winner status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminShell overline="Admin Winners" title="Winners" subtitle="Track payout status and validate winner documentation.">
      <article className="admin-card">
        <div className="admin-actions">
          <h2>All Winners</h2>
          <div className="admin-filter-group">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
              { key: "paid", label: "Paid" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={activeFilter === item.key ? "admin-btn" : "admin-btn-lite"}
                onClick={() => setActiveFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="admin-spinner-wrap"><span className="admin-spinner" /></div> : null}
  {!loading && success ? <div className="admin-success admin-message-spacing">{success}</div> : null}
        {!loading && error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error ? (
          filteredWinners.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Winner User ID</th>
                    <th>Draw Date</th>
                    <th>Match Type</th>
                    <th>Prize Amount</th>
                    <th>Proof URL</th>
                    <th>Payout Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWinners.map((winner) => {
                    const payoutStatus = (winner?.payout_status || "pending").toString().toLowerCase();
                    const hasProof = Boolean(winner?.proof_url);
                    return (
                      <tr key={winner.id}>
                        <td>{winner.user_id}</td>
                        <td>{formatDate(winner.draw_date || winner.created_at)}</td>
                        <td>{(winner.match_type || "").replace("_", " ").toUpperCase()}</td>
                        <td>{formatCurrency(winner.prize_amount)}</td>
                        <td>
                          {winner.proof_url ? (
                            <a href={winner.proof_url} target="_blank" rel="noreferrer" className="admin-proof-link">
                              View Proof
                            </a>
                          ) : (
                            <span className="admin-muted-text">N/A</span>
                          )}
                        </td>
                        <td>
                          <span className={`admin-badge ${payoutStatus === "paid" ? "success" : payoutStatus === "approved" ? "success" : payoutStatus === "rejected" ? "danger" : "pending"}`}>{payoutStatus}</span>
                        </td>
                        <td>
                          {payoutStatus === "pending" || payoutStatus === "rejected" ? (
                            <div className="admin-filter-group">
                              <button
                                type="button"
                                className="admin-btn-lite"
                                disabled={updatingId === winner.id}
                                onClick={() => updateWinnerStatus(winner.id, "rejected")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="admin-btn"
                                disabled={updatingId === winner.id || !hasProof}
                                onClick={() => updateWinnerStatus(winner.id, "approved")}
                              >
                                {updatingId === winner.id ? "Updating..." : "Approve"}
                              </button>
                            </div>
                          ) : payoutStatus === "approved" ? (
                            <button
                              type="button"
                              className="admin-btn"
                              disabled={updatingId === winner.id}
                              onClick={() => updateWinnerStatus(winner.id, "paid")}
                            >
                              {updatingId === winner.id ? "Updating..." : "Mark as Paid"}
                            </button>
                          ) : (
                            <span className="admin-muted-completed">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No winners found for this filter.</p>
          )
        ) : null}
      </article>
    </AdminShell>
  );
}
