import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  let admin = null;
  try {
    admin = JSON.parse(localStorage.getItem("buddybook_admin_user") || "null");
  } catch {
    admin = null;
  }

  if (!admin?.id || admin?.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}