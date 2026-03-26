import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/Signup.css";

function getHomePath(user) {
  const role = (user?.role || "").toString().trim().toLowerCase();
  return role === "admin" || role === "superadmin" || role === "super_admin" ? "/admin" : "/dashboard";
}

export default function Signup() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charity, setCharity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate(getHomePath(user), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!fullName || !email || !password || !charity) {
      setError("Please complete all fields.");
      return;
    }

    try {
      setLoading(true);
      const resolvedUser = await signup(email, password, fullName);
      navigate(getHomePath(resolvedUser), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <aside className="auth-floating-card left" aria-hidden="true">
          <p className="auth-float-title">Impact Growth</p>
          <div className="auth-growth-chart">
            <span className="auth-growth-bar b1" />
            <span className="auth-growth-bar b2" />
            <span className="auth-growth-bar b3" />
            <span className="auth-growth-bar b4" />
            <span className="auth-growth-bar b5" />
          </div>
          <p className="auth-float-copy">Global reforestation impact increased by 12% this month.</p>
        </aside>

        <aside className="auth-floating-card right" aria-hidden="true">
          <p className="auth-float-title">Prize Winners</p>
          <div className="auth-winner-item">
            <span className="auth-avatar" />
            <div>
              <p className="auth-winner-name">Alex M.</p>
              <p className="auth-winner-prize">Won Premium Club Set</p>
            </div>
          </div>
          <div className="auth-winner-item">
            <span className="auth-avatar alt" />
            <div>
              <p className="auth-winner-name">Sarah J.</p>
              <p className="auth-winner-prize">Won Golf Getaway</p>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-center">
            <div className="auth-brand">
              <span className="auth-bolt">⚡</span>
              <p className="auth-brand-text">KineticAltruist</p>
            </div>

            <h1 className="auth-title">Get Started</h1>
            <p className="auth-subtitle">Join, win monthly rewards, and support a cause</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signup-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="auth-input password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="auth-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-charity" className="auth-label">
                Choose a charity to support
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🏁</span>
                <select
                  id="signup-charity"
                  value={charity}
                  onChange={(event) => setCharity(event.target.value)}
                  className="auth-select"
                >
                  <option value="">Select a cause</option>
                  <option value="junior-golf">Junior Golf Foundation</option>
                  <option value="greenways">Greenways Restoration Fund</option>
                  <option value="mental-health">Athlete Mental Health Alliance</option>
                  <option value="clean-water">Clean Water Initiative</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {error ? (
            <div className="auth-error">
              {error}
            </div>
          ) : null}

          <p className="auth-switch">
            Already have an account? <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-footer">
        <button type="button">Privacy Policy</button>
        <button type="button">Terms of Service</button>
        <button type="button">Help Center</button>
      </div>
    </div>
  );
}
