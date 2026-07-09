import { Navigate } from "react-router-dom";

export default function ProtectedRoleRoute({ role, children }) {
  const token = localStorage.getItem("buddybook_token") || localStorage.getItem("token");
  const user = readUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const actualRole = String(user.role || "").toUpperCase();
  const expectedRole = String(role || "").toUpperCase();

  if (actualRole !== expectedRole) {
    if (actualRole === "PROVIDER") {
      return <Navigate to="/app/provider/dashboard" replace />;
    }
    if (actualRole === "USER") {
      return <Navigate to="/app/user/dashboard" replace />;
    }
    if (actualRole === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
