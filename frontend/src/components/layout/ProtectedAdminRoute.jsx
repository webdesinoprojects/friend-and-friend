import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api";

export default function ProtectedAdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, admin: null });
  useEffect(() => {
    let mounted = true;
    api.get("/admin/me", { suppressGlobalError: true })
      .then(({ data }) => {
        if (!mounted) return;
        const admin = data?.admin || null;
        if (admin) localStorage.setItem("PPlusOne_admin_user", JSON.stringify(admin));
        setState({ loading: false, admin });
      })
      .catch(() => {
        localStorage.removeItem("PPlusOne_admin_user");
        if (mounted) setState({ loading: false, admin: null });
      });
    return () => { mounted = false; };
  }, []);

  if (state.loading) return <div className="min-h-screen bg-[#fbfbfa] p-8 text-sm font-black">Verifying admin session...</div>;
  if (!state.admin?.id || state.admin?.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
