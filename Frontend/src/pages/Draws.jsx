import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Draws.css";
import {
  BarChart3,
  CircleHelp,
  CreditCard,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Timer,
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
  if (Array.isArray(value)) return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function Draws() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [latestDraw, setLatestDraw] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);
  const [userScores, setUserScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [latestRes, historyRes, scoresRes] = await Promise.all([
          api.get("/api/draws/latest").catch((err) => {
            if (err?.response?.status === 404) return { data: { data: null } };
            throw err;
          }),
          api.get("/api/draws"),
          api.get("/api/scores"),
        ]);

        if (!alive) return;

        const latest = latestRes.data?.data ?? null;
        const history = Array.isArray(historyRes.data?.data) ? historyRes.data.data : [];
        const scores = Array.isArray(scoresRes.data?.data) ? scoresRes.data.data : [];

        setLatestDraw(latest);
        setDrawHistory(history);
        setUserScores(scores.slice(0, 5));
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load draw data.");
        setLatestDraw(null);
        setDrawHistory([]);
        setUserScores([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const latestNumbers = useMemo(() => parseNumbers(latestDraw?.numbers), [latestDraw]);
  const latestSet = useMemo(() => new Set(latestNumbers), [latestNumbers]);

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
          <nav className="draws-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={`mobile-${item.to}`} className={`draws-mobile-link ${location.pathname === item.to ? "active" : ""}`} to={item.to}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="overline">Published Draws</p>
          <h1 className="title">Draw Results</h1>
          <p className="subtitle">View latest winning numbers, prize tiers, and draw history.</p>

          {loading ? <div className="spinner-wrap"><span className="spinner" /></div> : null}
          {!loading && error ? <div className="error">{error}</div> : null}

          {!loading ? (
            <section className="grid">
              <div>
                <article className="panel">
                  <h2>Latest Draw</h2>
                  {latestDraw ? (
                    <div className="latest-card">
                      <div className="latest-meta">
                        <span>Date: {formatDate(latestDraw.draw_date || latestDraw.date)}</span>
                        <span>Status: <span className="status">{(latestDraw.status || (latestDraw.published ? "published" : "draft")).toString()}</span></span>
                      </div>

                      <div className="balls">
                        {latestNumbers.map((num) => (
                          <span key={`latest-${num}`} className="ball">{num}</span>
                        ))}
                      </div>

                      <div className="tiers">
                        <div className="tier">
                          <p>Jackpot</p>
                          <strong>{formatCurrency(latestDraw.jackpot_amount)}</strong>
                        </div>
                        <div className="tier">
                          <p>4 Match</p>
                          <strong>{formatCurrency(latestDraw.four_match_amount)}</strong>
                        </div>
                        <div className="tier">
                          <p>3 Match</p>
                          <strong>{formatCurrency(latestDraw.three_match_amount)}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="empty">No draws have been run yet</p>
                  )}
                </article>

                <article className="panel panel-history">
                  <h2>Draw History</h2>
                  {drawHistory.length ? (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Numbers</th>
                            <th>Jackpot</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drawHistory.map((draw, index) => {
                            const numbers = parseNumbers(draw.numbers);
                            return (
                              <tr key={draw.id || `draw-${index}`}>
                                <td>{formatDate(draw.draw_date || draw.date)}</td>
                                <td>
                                  <div className="balls balls-tight">
                                    {numbers.map((num) => (
                                      <span key={`${draw.id || index}-${num}`} className="ball ball-history">
                                        {num}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td>{formatCurrency(draw.jackpot_amount)}</td>
                                <td>
                                  <span className="status">{(draw.status || (draw.published ? "published" : "draft")).toString()}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty">No draws have been run yet</p>
                  )}
                </article>
              </div>

              <aside className="panel">
                <h2>Your Numbers</h2>
                {userScores.length ? (
                  <div className="numbers-list">
                    {userScores.map((score, idx) => {
                      const scoreValue = Number(score.score) || 0;
                      const matched = latestSet.has(scoreValue);
                      return (
                        <div key={score.id || `score-${idx}`} className={`number-item ${matched ? "match" : ""}`}>
                          <span>Score {idx + 1}</span>
                          <strong>{scoreValue}</strong>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty">No scores available yet.</p>
                )}
              </aside>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
