import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Charity.css";
import {
  BarChart3,
  Check,
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

function normalizeArray(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeObject(data) {
  if (data && data.data && !Array.isArray(data.data)) return data.data;
  if (data && !Array.isArray(data)) return data;
  return null;
}

export default function Charity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [charities, setCharities] = useState([]);
  const [selectedCharityId, setSelectedCharityId] = useState(null);
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [charityRes, userCharityRes] = await Promise.all([
        api.get("/api/charities"),
        api.get("/api/charities/user").catch(() => ({ data: { data: null } })),
      ]);

      const allCharities = normalizeArray(charityRes.data);
      const selected = normalizeObject(userCharityRes.data);

      setCharities(allCharities);
      setSelectedCharityId(selected?.id ?? null);
      setPercentage(Number(selected?.contribution_percentage) || 10);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load charities.");
      setCharities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCharity = useMemo(() => {
    return charities.find((item) => item.id === selectedCharityId) || null;
  }, [charities, selectedCharityId]);

  const postSelection = async (charityId, pct, successMessage) => {
    setSaving(true);
    setError("");
    try {
      await api.post("/api/charities/select", {
        charity_id: charityId,
        percentage: pct,
      });

      const userCharityRes = await api.get("/api/charities/user").catch(() => ({ data: { data: null } }));
      const selected = normalizeObject(userCharityRes.data);
      setSelectedCharityId(selected?.id ?? null);
      setPercentage(Number(selected?.contribution_percentage) || 10);

      setToast({ type: "success", message: successMessage });
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to save charity selection.";
      setError(message);
      setToast({ type: "error", message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const onCardSelect = async (charityId) => {
    setSelectedCharityId(charityId);
    try {
      await postSelection(charityId, percentage, "Charity selection updated.");
    } catch {
      // Error is already handled in postSelection.
    }
  };

  const onSave = async () => {
    if (!selectedCharityId) {
      setError("Select a charity before saving.");
      return;
    }
    try {
      await postSelection(selectedCharityId, percentage, "Charity contribution settings saved.");
    } catch {
      // Error is already handled in postSelection.
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="page">
{toast ? <div className={`toast ${toast.type}`}>{toast.message}</div> : null}

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

          <p className="support">
            <CircleHelp size={16} />
            Support
          </p>

          <button className="signout" type="button" onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </aside>

        <main className="main">
          <nav className="charity-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={`mobile-${item.to}`} className={`charity-mobile-link ${location.pathname === item.to ? "active" : ""}`} to={item.to}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <header className="top">
            <p className="overline">Charity Selection</p>
            <h1>Choose Your Impact</h1>
            <p className="subtitle">Select where your subscription contribution will be directed.</p>
          </header>

          <section className="content">
            <div className="panel">
              {loading ? (
                <div className="spinner-wrap"><span className="spinner" /></div>
              ) : (
                <>
                  {error ? <div className="error charity-error-spacing">{error}</div> : null}

                  {charities.length ? (
                    <div className="cards">
                      {charities.map((charity) => {
                        const selected = charity.id === selectedCharityId;
                        return (
                          <article key={charity.id} className={`card ${selected ? "selected" : ""}`} onClick={() => onCardSelect(charity.id)}>
                            {selected ? (
                              <span className="checkmark">
                                <Check size={13} />
                              </span>
                            ) : null}

                            <img
                              src={charity.image_url || `https://picsum.photos/seed/charity-${charity.id || "x"}/400/220`}
                              alt={charity.name || "Charity"}
                            />
                            <div className="card-body">
                              <div className="card-head">
                                <h3>{charity.name || "Unnamed Charity"}</h3>
                                <span className="badge">{charity.category || "General"}</span>
                              </div>
                              <p>{charity.description || "No description available."}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="subtitle no-charities-subtitle">No charities available right now.</p>
                  )}

                  <div className="controls">
                    <div className="slider-line">
                      <span>Your Contribution: {percentage}% of subscription</span>
                      <strong>{selectedCharity ? selectedCharity.name : "No charity selected"}</strong>
                    </div>

                    <input
                      className="slider"
                      type="range"
                      min={10}
                      max={100}
                      value={percentage}
                      onChange={(event) => setPercentage(Number(event.target.value))}
                    />

                    <div className="actions">
                      <button type="button" className="save-btn" onClick={onSave} disabled={saving || !selectedCharityId}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
