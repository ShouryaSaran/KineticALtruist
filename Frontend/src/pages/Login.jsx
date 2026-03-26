import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/Login.css";

function getHomePath(user) {
  const role = (user?.role || "").toString().trim().toLowerCase();
  return role === "admin" || role === "superadmin" || role === "super_admin" ? "/admin" : "/dashboard";
}

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      const resolvedUser = await login(email, password);
      navigate(getHomePath(resolvedUser), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to sign in.");
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

            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Continue playing, winning, and giving back</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  id="login-email"
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
              <div className="auth-field-row">
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <button type="button" className="auth-forgot">
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {error ? (
            <div className="auth-error">
              {error}
            </div>
          ) : null}

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-copy">or continue with</span>
            <span className="auth-divider-line" />
          </div>

          <button type="button" className="auth-google">
            <span className="auth-google-dot">•</span>
            Sign in with Google
          </button>

          <p className="auth-switch">
            New to the platform? <Link to="/signup" className="auth-link">Create an account</Link>
          </p>

          <p className="auth-secure">🟢 Secure & Encrypted</p>
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
