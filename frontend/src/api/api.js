import axios from "axios";

const apiBaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_LOCAL_API_URL || "http://127.0.0.1:5000/api"
  : import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const isAdminRoute = String(config.url || "").startsWith("/admin");
  const token = isAdminRoute
    ? localStorage.getItem("buddybook_admin_token")
    : localStorage.getItem("buddybook_token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (!status || status >= 500) {
      const message = error?.response?.data?.message ||
        (!status ? "Cannot reach the server. Check your connection and try again." : "The server could not complete this request.");
      window.dispatchEvent(new CustomEvent("buddybook:toast", {
        detail: { id: Date.now(), message, type: "error" },
      }));
    }
    if (status === 423 && error?.response?.data?.accountDisabled) {
      try {
        const user = JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
        if (user) {
          const nextUser = { ...user, ...error.response.data };
          localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
          window.dispatchEvent(new Event("buddybook:auth-changed"));
          const settingsPath = nextUser.role === "PROVIDER" ? "/app/provider/settings" : "/app/user/settings";
          if (window.location.pathname !== settingsPath) window.location.assign(settingsPath);
        }
      } catch {
        // Keep the original API error if browser storage is unavailable.
      }
    }
    if (status === 401) {
      const isAdmin = String(error?.config?.url || "").startsWith("/admin");
      if (isAdmin) {
        localStorage.removeItem("buddybook_admin_token");
        localStorage.removeItem("buddybook_admin_user");
      } else {
        localStorage.removeItem("buddybook_token");
        localStorage.removeItem("token");
        localStorage.removeItem("buddybook_auth_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
