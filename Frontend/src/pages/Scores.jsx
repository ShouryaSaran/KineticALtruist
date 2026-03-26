import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Scores.css";
import {
  BarChart3,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Search,
  Timer,
  Trash2,
  Trophy,
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

const RULES = [
  "Use the Stableford format for all entries.",
  "Point range strictly 1 to 45 points.",
  "Max 5 scores per user at any time.",
  "Oldest scores automatically rotate out.",
  "Verification required for Charity Draws.",
];

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toPlayedDate(score) {
  return score?.played_at ?? score?.date ?? score?.created_at ?? null;
}

export default function Scores() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchScores = useCallback(async () => {
    try {
      const response = await api.get("/api/scores");
      const payload = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setScores(payload);
    } catch {
      setScores([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/scores");
        if (!alive) return;
        const payload = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setScores(payload);
      } catch {
        if (!alive) return;
        setScores([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const sortedScores = useMemo(() => {
    return [...scores].sort((a, b) => new Date(toPlayedDate(b) || 0) - new Date(toPlayedDate(a) || 0));
  }, [scores]);

  const validate = () => {
    if (!scoreInput.trim() || !dateInput) {
      return "Score and date are required.";
    }

    const value = Number(scoreInput);
    if (!Number.isFinite(value) || value < 1 || value > 45) {
      return "Score must be a number between 1 and 45.";
    }

    const selected = new Date(dateInput);
    if (Number.isNaN(selected.getTime())) {
      return "Please provide a valid date.";
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      return "Date must not be in the future.";
    }

    return "";
  };

  const submitScore = async () => {
    if (submitting) return;

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/api/scores", {
        score: Number(scoreInput),
        date: dateInput,
      });

      // Immediately add the new score to the state
      const newScore = response.data?.data || response.data;
      if (newScore && typeof newScore === 'object') {
        setScores(prev => [newScore, ...prev]);
      } else {
        // If response structure is different, fetch all scores
        await fetchScores();
      }

      setScoreInput("");
      setDateInput("");
      setSuccess("Score added successfully!");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to add score.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteScore = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this score?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/scores/${id}`);
      await fetchScores();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete score.");
    }
  };

  const signOut = async () => {
    if (typeof logout === "function") {
      await logout();
    }
    navigate("/login");
  };

  return (
    <div className="scores-page">
<div className="scores-shell">
        <aside className="scores-sidebar">
          <div className="scores-brand">
            <div className="scores-brand-row">
              <span className="scores-bolt">⚡</span>
              <div>
                <p className="scores-brand-name">KineticAltruist</p>
                <p className="scores-brand-sub">High-Performance Giving</p>
              </div>
            </div>
          </div>

          <nav className="scores-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} className={`scores-nav-link ${active ? "active" : ""}`} to={item.to}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="scores-sidebar-spacer" />

          <button type="button" className="scores-entry-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            New Entry
          </button>

          <p className="scores-support">
            <CircleHelp size={16} />
            Support
          </p>

          <button type="button" className="scores-signout" onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </aside>

        <main className="scores-main">
          <nav className="scores-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={`mobile-${item.to}`} className={`scores-mobile-link ${active ? "active" : ""}`} to={item.to}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <header className="scores-topbar">
            <div>
              <p className="scores-overline">Performance Tracking</p>
              <h1 className="scores-title">My Scores</h1>
              <p className="scores-subtitle">Track your last 5 Stableford scores for precision impact.</p>
            </div>

            <div className="scores-search" aria-label="Search">
              <Search size={14} />
              <input type="text" value="" readOnly placeholder="Search..." />
            </div>
          </header>

          <section className="scores-content">
            <div>
              <article className="scores-panel scores-panel-form">
                <h2 className="scores-form-title">
                  <span className="scores-form-icon">
                    <BarChart3 size={16} />
                  </span>
                  Add New Score
                </h2>

                <div className="scores-form-grid">
                  <div>
                    <label className="scores-field-label" htmlFor="scoreInput">STABLEFORD SCORE</label>
                    <input
                      id="scoreInput"
                      type="number"
                      min={1}
                      max={45}
                      placeholder="38"
                      className="scores-input"
                      value={scoreInput}
                      onChange={(event) => setScoreInput(event.target.value)}
                    />
                    <p className="scores-range-note">Points range: 1 - 45</p>
                  </div>

                  <div>
                    <label className="scores-field-label" htmlFor="dateInput">DATE PLAYED</label>
                    <input
                      id="dateInput"
                      type="date"
                      className="scores-input"
                      value={dateInput}
                      onChange={(event) => setDateInput(event.target.value)}
                    />
                  </div>
                </div>

                <button type="button" className="scores-submit" onClick={submitScore} disabled={submitting}>
                  {submitting ? <span className="scores-spinner" /> : null}
                  Submit Score
                </button>

                <p className="scores-note">Note: You can store up to 5 scores. The oldest entry will be replaced.</p>

                {error ? <div className="scores-message error">{error}</div> : null}
                {success ? <div className="scores-message success">{success}</div> : null}
              </article>

              <article className="scores-panel scores-panel-table">
                <div className="scores-table-head">
                  <h3 className="scores-table-title">Your Scores</h3>
                  <span className="scores-count">{`${sortedScores.length}/5 ENTRIES`}</span>
                </div>

                {loading ? (
                  <div className="scores-empty">Loading scores...</div>
                ) : sortedScores.length ? (
                  <div className="scores-table-wrap">
                    <table className="scores-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedScores.map((item, index) => (
                          <tr key={item.id || `${index}-${item.created_at || "score"}`}>
                            <td className="scores-index">#{index + 1}</td>
                            <td className="scores-date">{formatDate(toPlayedDate(item))}</td>
                            <td className="scores-value">{Number(item.score) || 0}</td>
                            <td><span className="scores-status">PENDING</span></td>
                            <td>
                              <button
                                type="button"
                                className="scores-delete"
                                aria-label="Delete score"
                                onClick={() => deleteScore(item.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="scores-empty">No scores yet. Add your first score above!</div>
                )}
              </article>
            </div>

            <aside className="scores-side">
              <article className="scores-rules">
                <h3>
                  <BarChart3 size={18} />
                  Scoring Rules
                </h3>

                <ul>
                  {RULES.map((rule) => (
                    <li key={rule}>
                      <CheckCircle2 size={14} />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="scores-image-card">
                <img src="https://picsum.photos/seed/golf-course/400/200" alt="Golf course" />
                <div className="scores-image-content">
                  <h4>Impact Ready?</h4>
                  <p>
                    Your entries calculate your Kinetic Score, directly influencing your weighting in the upcoming
                    precision philanthropy draw.
                  </p>
                </div>
              </article>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
