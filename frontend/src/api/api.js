import axios from "axios";
import { clearQueryCache, invalidateQueries } from "../utils/queryCache";

const localApiUrl = typeof window === "undefined"
  ? "http://127.0.0.1:5000/api"
  : `${window.location.protocol}//${window.location.hostname}:5000/api`;

const apiBaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_LOCAL_API_URL || localApiUrl
  : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let csrfTokenInMemory = "";
let csrfRequest = null;

api.interceptors.request.use(async (config) => {
  let csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("buddybook_csrf="))
    ?.split("=")
    .slice(1)
    .join("=") || csrfTokenInMemory;
  const unsafe = !["get", "head", "options"].includes(String(config.method || "get").toLowerCase());
  if (unsafe && !csrfToken) {
    csrfRequest ||= axios
      .get(`${apiBaseUrl}/auth/csrf`, { withCredentials: true })
      .then((response) => response.data?.csrfToken || "")
      .finally(() => { csrfRequest = null; });
    csrfToken = await csrfRequest;
    csrfTokenInMemory = csrfToken;
  }
  if (unsafe && csrfToken) {
    config.headers["X-CSRF-Token"] = decodeURIComponent(csrfToken);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (String(response?.config?.url || "") === "/auth/logout") clearQueryCache();
    const responseUrl = String(response?.config?.url || "");
    const responseMethod = String(response?.config?.method || "get").toLowerCase();
    if (responseUrl.startsWith("/admin") && !["get", "head", "options"].includes(responseMethod)) {
      invalidateQueries("admin:");
    }
    const nextCsrfToken = response.headers?.["x-csrf-token"];
    if (nextCsrfToken) csrfTokenInMemory = nextCsrfToken;
    return response;
  },
  (error) => {
    const nextCsrfToken = error?.response?.headers?.["x-csrf-token"];
    if (nextCsrfToken) csrfTokenInMemory = nextCsrfToken;
    const status = error?.response?.status;
    if ((!status || status >= 500) && !error?.config?.suppressGlobalError) {
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
      clearQueryCache();
      const isAdmin = String(error?.config?.url || "").startsWith("/admin");
      if (isAdmin) {
        localStorage.removeItem("buddybook_admin_user");
      } else {
        localStorage.removeItem("buddybook_auth_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
