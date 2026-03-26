import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../utils/api";
import "../styles/AdminCharities.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  image_url: "",
  active: true,
};

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const fetchCharities = async () => {
    const response = await api.get("/api/charities");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchCharities();
        if (!alive) return;
        setCharities(rows);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to fetch charities.");
        setCharities([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (charity) => {
    setEditingId(charity.id);
    setForm({
      name: charity.name || "",
      description: charity.description || "",
      category: charity.category || "",
      image_url: charity.image_url || "",
      active: typeof charity.active === "boolean" ? charity.active : true,
    });
    setModalOpen(true);
    setError("");
    setSuccess("");
  };

  const saveCharity = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        image_url: form.image_url,
        active: Boolean(form.active),
      };

      if (editingId) {
        await api.put(`/api/admin/charities/${editingId}`, payload);
        setSuccess("Charity updated successfully.");
      } else {
        await api.post("/api/admin/charities", payload);
        setSuccess("Charity created successfully.");
      }

      const rows = await fetchCharities();
      setCharities(rows);
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save charity.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCharity = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this charity?");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await api.delete(`/api/admin/charities/${id}`);
      const rows = await fetchCharities();
      setCharities(rows);
      setSuccess("Charity deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete charity.");
    }
  };

  return (
    <AdminShell overline="Admin Charities" title="Charities" subtitle="Manage active charities and platform impact options.">
      <article className="admin-card">
        <div className="admin-actions">
          <h2>All Charities</h2>
          <button type="button" className="admin-btn" onClick={openAdd}>Add Charity</button>
        </div>

        {loading ? <div className="admin-spinner-wrap"><span className="admin-spinner" /></div> : null}
        {!loading && success ? <div className="admin-success admin-message-spacing">{success}</div> : null}
        {!loading && error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error ? (
          charities.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Active Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.map((charity) => (
                    <tr key={charity.id}>
                      <td>{charity.name || "N/A"}</td>
                      <td>{charity.category || "N/A"}</td>
                      <td>
                        <span className={`admin-badge ${charity.active ? "success" : "pending"}`}>
                          {charity.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-inline-actions">
                          <button type="button" className="admin-btn-lite" onClick={() => openEdit(charity)}>Edit</button>
                          <button type="button" className="admin-btn-danger" onClick={() => deleteCharity(charity.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No charities found.</p>
          )
        ) : null}
      </article>

      {modalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">{editingId ? "Edit Charity" : "Add Charity"}</h3>
              <button type="button" className="admin-btn-lite" onClick={() => setModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="admin-content admin-content-no-top">
              <input className="admin-input" placeholder="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <textarea className="admin-textarea" placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              <input className="admin-input" placeholder="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
              <input className="admin-input" placeholder="Image URL" value={form.image_url} onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))} />
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={Boolean(form.active)} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
                Active
              </label>
            </div>

            <div className="admin-modal-actions">
              <button type="button" className="admin-btn-lite" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button type="button" className="admin-btn" onClick={saveCharity} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
