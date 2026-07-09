import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const isAdminRoute = String(config.url || "").startsWith("/admin");
  const token = isAdminRoute
    ? localStorage.getItem("buddybook_admin_token")
    : localStorage.getItem("buddybook_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const isAdmin = String(error?.config?.url || "").startsWith("/admin");
      if (isAdmin) {
        localStorage.removeItem("buddybook_admin_token");
        localStorage.removeItem("buddybook_admin_user");
      } else {
        localStorage.removeItem("buddybook_token");
        localStorage.removeItem("buddybook_auth_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
