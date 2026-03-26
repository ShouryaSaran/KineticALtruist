import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Winnings.css";
import {
  BarChart3,
  CircleHelp,
  CreditCard,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../utils/api";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Scores", to: "/scores", icon: BarChart3 },
  { label: "Charity", to: "/charity", icon: HandHeart },
  { label: "Draws", to: "/draws", icon: Timer },
  { label: "Winnings", to: "/winnings", icon: Trophy },
  { label: "Subscription", to: "/subscribe", icon: CreditCard },
];

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

export default function Winnings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofModal, setProofModal] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  const fetchWinnings = async () => {
    const response = await api.get("/api/winnings/me");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchWinnings();
        if (!alive) return;
        setWinnings(rows);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to fetch winnings.");
        setWinnings([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const totalWon = useMemo(() => winnings.reduce((sum, row) => sum + (Number(row?.prize_amount) || 0), 0), [winnings]);
  const pendingCount = useMemo(
    () => winnings.filter((row) => (row?.payout_status || "").toString().toLowerCase() === "pending").length,
    [winnings]
  );

  const submitProof = async () => {
    if (!proofModal?.id) return;
    if (!proofUrl.trim()) {
      setError("Proof URL is required.");
      return;
    }

    setProofSubmitting(true);
    setError("");

    try {
      await api.patch(`/api/winnings/${proofModal.id}/proof`, { proof_url: proofUrl.trim() });
      const rows = await fetchWinnings();
      setWinnings(rows);
      setProofModal(null);
      setProofUrl("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to upload proof.");
    } finally {
      setProofSubmitting(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="page">
<div className="shell">
        <aside className="sidebar">
          <div className="brand-row">
            <span className="bolt">⚡</span>
            <div>
              <p className="brand-name">KineticAltruist</p>
              <p className="brand-sub">High-Performance Giving</p>
            </div>
          </div>

          <nav className="nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} className={`nav-link ${location.pathname === item.to ? "active" : ""}`} to={item.to}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="side-spacer" />
          <button className="entry-btn" type="button" onClick={() => navigate("/scores")}>New Entry</button>

          <p className="support"><CircleHelp size={16} />Support</p>
          <button className="signout" type="button" onClick={signOut}><LogOut size={16} />Sign Out</button>
        </aside>

        <main className="main">
          <nav className="winnings-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={`mobile-${item.to}`} className={`winnings-mobile-link ${location.pathname === item.to ? "active" : ""}`} to={item.to}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="overline">Your Payouts</p>
          <h1 className="title">Winnings</h1>
          <p className="subtitle">Track prizes and submit proof for pending payouts.</p>

          <section className="stats">
            <article className="stat">
              <p>Total Won</p>
              <strong>{formatCurrency(totalWon)}</strong>
            </article>

            <article className="stat">
              <p>Pending Payouts</p>
              <strong>{pendingCount}</strong>
            </article>
          </section>

          <section className="panel">
            <h2>All Winnings</h2>

            {loading ? <div className="spinner-wrap"><span className="spinner" /></div> : null}
            {!loading && error ? <div className="error">{error}</div> : null}

            {!loading && !error ? (
              winnings.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Draw Date</th>
                        <th>Match Type</th>
                        <th>Prize Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winnings.map((row) => {
                        const status = (row?.payout_status || "pending").toString().toLowerCase();
                        const canUploadProof = status === "pending" || status === "rejected";
                        return (
                          <tr key={row.id}>
                            <td>{formatDate(row.draw_date || row.created_at)}</td>
                            <td>{(row.match_type || "").replace("_", " ").toUpperCase()}</td>
                            <td>{formatCurrency(row.prize_amount)}</td>
                            <td>
                              <span className={`badge ${status === "paid" ? "paid" : status === "approved" ? "paid" : "pending"}`}>{status}</span>
                            </td>
                            <td>
                              {canUploadProof ? (
                                <button
                                  type="button"
                                  className="proof-btn"
                                  onClick={() => {
                                    setProofModal(row);
                                    setProofUrl(row?.proof_url || "");
                                  }}
                                >
                                  Upload Proof
                                </button>
                              ) : (
                                <span className="winnings-completed">Completed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty">No winnings yet.</p>
              )
            ) : null}
          </section>
        </main>
      </div>

      {proofModal ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3>Upload Proof</h3>
              <button type="button" className="close-btn" onClick={() => setProofModal(null)}>
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              placeholder="https://example.com/proof"
              value={proofUrl}
              onChange={(event) => setProofUrl(event.target.value)}
            />

            <div className="modal-actions">
              <button type="button" className="btn-lite" onClick={() => setProofModal(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={submitProof} disabled={proofSubmitting}>
                {proofSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
