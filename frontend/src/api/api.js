import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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

export default api;
