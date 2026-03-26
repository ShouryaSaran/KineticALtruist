import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/ProtectedRoute.css";

function isAdminUser(user) {
  const role = (user?.role || "").toString().trim().toLowerCase();
  return role === "admin" || role === "superadmin" || role === "super_admin";
}

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
