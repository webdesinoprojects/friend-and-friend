import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoleRoute({ role, children }) {
  const location = useLocation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const sync = () => setNow(Date.now());
    window.addEventListener("buddybook:auth-changed", sync);
    return () => window.removeEventListener("buddybook:auth-changed", sync);
  }, []);
  const token = localStorage.getItem("buddybook_token") || localStorage.getItem("token");
  const user = readUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.kycStatus && user.kycStatus !== "VERIFIED") {
    return <Navigate to="/application-review" replace />;
  }

  const actualRole = String(user.role || "").toUpperCase();
  const expectedRole = String(role || "").toUpperCase();
  const disabled = Boolean(user.accountDisabled && user.disabledUntil && new Date(user.disabledUntil).getTime() > now);
  const settingsPath = actualRole === "PROVIDER" ? "/app/provider/settings" : "/app/user/settings";

  if (disabled && location.pathname !== settingsPath) {
    return <Navigate to={settingsPath} replace />;
  }

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
