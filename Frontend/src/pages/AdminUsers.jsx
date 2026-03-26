import { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import api from "../utils/api";
import "../styles/AdminUsers.css";

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/api/admin/users");
        if (!alive) return;
        setUsers(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load users.");
        setUsers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  return (
    <AdminShell
      overline="Admin Users"
      title="Users"
      subtitle="Manage users and monitor access roles."
    >
      <article className="admin-card">
        <div className="admin-actions">
          <h2>All Users</h2>
          <input
            className="admin-input admin-users-search"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? <div className="admin-spinner-wrap"><span className="admin-spinner" /></div> : null}
        {!loading && error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error ? (
          filteredUsers.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Subscription Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name || "N/A"}</td>
                      <td>{item.email || "N/A"}</td>
                      <td>{(item.role || "user").toUpperCase()}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{(item.role || "user").toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No users match your search.</p>
          )
        ) : null}
      </article>
    </AdminShell>
  );
}
