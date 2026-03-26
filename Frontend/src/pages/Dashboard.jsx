import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import {
  BarChart3,
  CreditCard,
  CircleHelp,
  HandHeart,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  PlusCircle,
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

const EMPTY_COUNTDOWN = "00:00:00";

function toCurrency(value) {
  const safe = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

function toDateLabel(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function arrayFromResponse(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function objectFromResponse(data, key) {
  if (!data || Array.isArray(data)) return null;
  if (key && data[key] && !Array.isArray(data[key])) return data[key];

  if (data.data && !Array.isArray(data.data) && typeof data.data === "object") {
    if (key && data.data[key] && !Array.isArray(data.data[key])) return data.data[key];
    return data.data;
  }

  return data;
}

function toCountdown(targetDate) {
  if (!targetDate) return EMPTY_COUNTDOWN;
  const targetMs = new Date(targetDate).getTime();
  if (Number.isNaN(targetMs)) return EMPTY_COUNTDOWN;

  const diff = Math.max(0, targetMs - Date.now());
  const seconds = Math.floor(diff / 1000);
  const hh = String(Math.floor((seconds / 3600) % 24)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [scores, setScores] = useState([]);
  const [charity, setCharity] = useState(null);
  const [draw, setDraw] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;

    const fetchCharityForMount = async () => {
      try {
        const response = await api.get("/api/charities/user");
        return objectFromResponse(response.data, "charity");
      } catch {
        return null;
      }
    };

    const load = async () => {
      setLoading(true);

      const [scoresData, charityData, drawData, subscriptionData, winningsData] = await Promise.all([
        (async () => {
          try {
            const response = await api.get("/api/scores");
            return arrayFromResponse(response.data, "scores");
          } catch {
            return [];
          }
        })(),
        fetchCharityForMount(),
        (async () => {
          try {
            const response = await api.get("/api/draws/latest");
            return objectFromResponse(response.data, "draw");
          } catch {
            return null;
          }
        })(),
        (async () => {
          try {
            const response = await api.get("/api/subscriptions/me");
            return objectFromResponse(response.data, "data");
          } catch {
            return null;
          }
        })(),
        (async () => {
          try {
            const response = await api.get("/api/winnings/me");
            return arrayFromResponse(response.data, "winnings");
          } catch {
            return [];
          }
        })(),
      ]);

      if (!isMounted) return;

      setScores(scoresData);
      setCharity(charityData);
      setDraw(drawData);
      setSubscription(subscriptionData);
      setWinnings(winningsData);
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [location]);

  const drawDate = draw?.draw_date ?? draw?.drawDate ?? draw?.scheduled_for ?? null;
  const countdown = useMemo(() => toCountdown(drawDate || nowTick), [drawDate, nowTick]);

  useEffect(() => {
    if (!drawDate) return undefined;

    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [drawDate]);

  const recentScores = useMemo(() => {
    return [...scores]
      .sort((a, b) => new Date(b?.created_at ?? b?.date ?? 0) - new Date(a?.created_at ?? a?.date ?? 0))
      .slice(0, 3);
  }, [scores]);

  const totalWinnings = useMemo(() => {
    return winnings.reduce((sum, item) => sum + (Number(item?.prize_amount) || 0), 0);
  }, [winnings]);

  const drawCount = useMemo(() => {
    const ids = winnings
      .map((item) => item?.draw_id ?? item?.drawId)
      .filter((value) => value !== undefined && value !== null);
    return ids.length ? new Set(ids).size : winnings.length;
  }, [winnings]);

  const scoreCount = scores.length;
  const scoreProgress = Math.min(100, Math.round((scoreCount / 5) * 100));
  const progressStep = Math.min(100, Math.max(0, Math.round(scoreProgress / 20) * 20));
  const scoreProgressClass = `is-${progressStep}`;

  const subscriptionState = (subscription?.status ?? subscription?.is_active ?? "").toString().toLowerCase();
  const subscriptionActive = subscriptionState === "active" || subscriptionState === "true";

  const billingType = (subscription?.plan ?? "monthly")
    .toString()
    .toUpperCase();

  const subscriptionAmount =
    Number(subscription?.amount ?? subscription?.price ?? subscription?.monthly_price ?? 0) || 0;

  const charityPercentage =
    Number(
      charity?.contribution_percentage ??
        charity?.percentage ??
        charity?.charity_percentage ??
        charity?.contributionRate ??
        10
    ) || 0;

  const charityImpact = (subscriptionAmount * charityPercentage) / 100;
  const charityImage = charity?.image_url || "https://picsum.photos/seed/kinetic-charity/160/160";

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <aside className="dash-sidebar">
          <div className="dash-brand">
            <div className="dash-brand-row">
              <span className="dash-bolt">⚡</span>
              <div>
                <p className="dash-brand-name">KineticAltruist</p>
                <p className="dash-brand-sub">High-Performance Giving</p>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} className={`dash-nav-link ${active ? "active" : ""}`} to={item.to}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="dash-sidebar-spacer" />

          <button className="dash-entry-btn" onClick={() => navigate("/scores")}>New Entry</button>

          <p className="dash-support">
            <CircleHelp size={16} />
            Support
          </p>

          <button className="dash-signout" onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </aside>

        <main className="dash-main">
          <nav className="dash-mobile-top-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={`mobile-top-${item.to}`} className={`dash-mobile-top-link ${active ? "active" : ""}`} to={item.to}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <header className="dash-topbar">
            <div>
              <p className="dash-overview">Dashboard Overview</p>
              <h1 className="dash-welcome">Welcome back, {user?.name || "Player"} 👋</h1>
            </div>

            <div className="dash-next-pill">
              <span className="dash-next-icon">
                <Timer size={16} />
              </span>
              <div>
                <p className="dash-next-label">Next Draw In</p>
                <p className="dash-next-time">{drawDate ? countdown : "No Draw"}</p>
              </div>
            </div>
          </header>

          {loading ? (
            <section className="dash-stat-grid">
              {[0, 1, 2, 3].map((item) => (
                <article className="dash-card" key={item}>
                  <div className="dash-pulse dash-pulse-line" />
                  <div className="dash-pulse dash-pulse-value" />
                  <div className="dash-pulse dash-pulse-sub" />
                </article>
              ))}
            </section>
          ) : (
            <section className="dash-stat-grid">
              <article className="dash-card">
                <div className="dash-card-row">
                  <p className="dash-card-label">Subscription</p>
                  {subscription ? <span className="dash-pill">{billingType === "YEARLY" ? "YEARLY" : "MONTHLY"}</span> : null}
                </div>

                {subscription && subscriptionActive ? (
                  <>
                    <p className="dash-value active">Active</p>
                    <p className="dash-subtext">
                      Next billing: {toDateLabel(subscription?.next_billing_date ?? subscription?.nextBillingDate)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className={`dash-value ${subscription ? "inactive" : "no-plan"}`}>
                      {subscription ? "Inactive" : "No active plan"}
                    </p>
                    <p className="dash-subtext">
                      Next billing: {toDateLabel(subscription?.next_billing_date ?? subscription?.nextBillingDate)}
                    </p>
                    <button className="dash-subscribe-btn" onClick={() => navigate('/subscribe')}>Subscribe Now</button>
                  </>
                )}
              </article>

              <article className="dash-card">
                <div className="dash-card-row">
                  <p className="dash-card-label">Scores Entered</p>
                </div>
                <p className="dash-value">
                  {scoreCount}
                  <span className="dim">/5</span>
                </p>
                <div className="dash-progress">
                  <div className={`dash-progress-fill ${scoreProgressClass}`} />
                </div>
              </article>

              <article className="dash-card">
                <div className="dash-card-row">
                  <p className="dash-card-label">Total Winnings</p>
                </div>
                <p className="dash-value">{toCurrency(totalWinnings)}</p>
                <p className="dash-subtext">Qualified for {drawCount} draws</p>
              </article>

              <article className="dash-card impact">
                <div className="dash-card-row">
                  <p className="dash-card-label">Charity Impact</p>
                  <span className="dash-impact-up">+12%</span>
                </div>
                <p className="dash-value">{toCurrency(charityImpact)}</p>
                <p className="dash-subtext">Total contributed</p>
              </article>
            </section>
          )}

          <section className="dash-content">
            <article className="dash-panel">
              <div className="dash-panel-head">
                <h2 className="dash-panel-title">Recent Scores</h2>
                <button className="dash-link-btn" onClick={() => navigate("/scores")}>
                  <PlusCircle size={14} />
                  Add New Score
                </button>
              </div>

              {recentScores.length ? (
                <>
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScores.map((score, index) => {
                          const statusText = (score?.status || score?.verification_status || "pending").toString();
                          const verified = statusText.toLowerCase() === "verified";

                          return (
                            <tr key={score?.id ?? `${score?.course_name || "score"}-${index}`}>
                              <td className="dash-date">{toDateLabel(score?.played_at ?? score?.date ?? score?.created_at)}</td>
                              <td>{score?.course_name ?? score?.course ?? "Unknown Course"}</td>
                              <td className="score">{Number(score?.score) || 0}</td>
                              <td>
                                <span className={`dash-status ${verified ? "verified" : "pending"}`}>
                                  {verified ? "VERIFIED" : "PENDING"}
                                </span>
                              </td>
                              <td>
                                <button className="dash-more" aria-label="Open menu">
                                  <MoreVertical size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="dash-panel-foot">
                    <button className="dash-view-all" onClick={() => navigate("/scores")}>View All Scores</button>
                  </div>
                </>
              ) : (
                <div className="dash-empty">
                  No scores yet. Add your first score!
                  <div>
                    <button className="dash-empty-btn" onClick={() => navigate("/scores")}>Add Score</button>
                  </div>
                </div>
              )}
            </article>

            <div className="dash-right">
              <article className="dash-panel dash-charity">
                <div className="dash-charity-head">
                  <h2 className="dash-panel-title">My Charity</h2>
                  <Link className="dash-change-link" to="/charity">Change</Link>
                </div>

                {charity ? (
                  <>
                    <div className="dash-charity-main">
                      <img className="dash-charity-img" src={charityImage} alt={charity?.name || "Charity"} />
                      <div>
                        <p className="dash-charity-name">{charity?.name ?? "Selected Charity"}</p>
                        <span className="dash-charity-type">{charity?.category ?? "Environment"}</span>
                      </div>
                    </div>

                    <div className="dash-charity-stats">
                      <div className="dash-charity-row">
                        <span>Contribution Rate</span>
                        <strong>{charityPercentage}% of sub</strong>
                      </div>
                      <div className="dash-charity-row">
                        <span>Total Generated</span>
                        <strong>{toCurrency(charityImpact)}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="dash-charity-empty">
                    <p>No charity selected</p>
                    <button className="dash-charity-btn" onClick={() => navigate("/charity")}>Select a charity</button>
                  </div>
                )}
              </article>

              <article className="dash-upcoming">
                <div className="dash-upcoming-head">
                  <h3>Upcoming Draw</h3>
                  <Timer size={16} />
                </div>

                {draw ? (
                  <>
                    <div className="dash-upcoming-pool">
                      <div className="dash-upcoming-row">
                        <span>Jackpot Pool</span>
                        <span>{countdown}</span>
                      </div>
                      <div className="dash-upcoming-value">{toCurrency(draw?.jackpot_pool ?? draw?.jackpot ?? 0)}</div>
                    </div>

                    <div className="dash-upcoming-table">
                      <div className="dash-upcoming-head-row">
                        <span>Match Category</span>
                        <span>Current Prize</span>
                      </div>
                      <div className="dash-upcoming-data-row">
                        <span>4-Match Performance</span>
                        <strong>{toCurrency(draw?.four_match_amount ?? 0)}</strong>
                      </div>
                      <div className="dash-upcoming-data-row">
                        <span>3-Match Performance</span>
                        <strong>{toCurrency(draw?.three_match_amount ?? 0)}</strong>
                      </div>
                    </div>

                    <button className="dash-boost-btn" onClick={() => navigate("/scores")}>Boost Entries</button>
                  </>
                ) : (
                  <p className="dash-no-draw">No upcoming draw scheduled</p>
                )}
              </article>
            </div>
          </section>
        </main>
      </div>

      <nav className="dash-mobile-nav">
        <div className="dash-mobile-grid">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`dash-mobile-link ${active ? "active" : ""}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
