import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import {
  CircleHelp,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Draws", to: "/admin/draws", icon: Timer },
  { label: "Charities", to: "/admin/charities", icon: HandHeart },
  { label: "Winners", to: "/admin/winners", icon: Trophy },
];

function AdminShell({ overline, title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-page">
<div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand-row">
            <span className="admin-bolt">⚡</span>
            <div>
              <p className="admin-brand-name">KineticAltruist</p>
              <p className="admin-brand-sub">Admin Console</p>
            </div>
          </div>

          <nav className="admin-nav">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} className={`admin-nav-link ${active ? "active" : ""}`} to={item.to}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="admin-side-spacer" />

          <button className="admin-entry-btn" type="button" onClick={() => navigate("/dashboard")}>View User App</button>

          <p className="admin-support">
            <CircleHelp size={16} />
            Support
          </p>

          <button className="admin-signout" type="button" onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </aside>

        <main className="admin-main">
          <p className="admin-overline">{overline}</p>
          <h1 className="admin-title">{title}</h1>
          {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
          <section className="admin-content">{children}</section>
        </main>
      </div>
    </div>
  );
}

export { AdminShell };
export default AdminShell;
