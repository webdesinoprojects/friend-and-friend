import api from "./api";
import { fetchQuery, getQueryData, invalidateQueries, setQueryData } from "../utils/queryCache";

const CURRENT_USER_KEY = "auth:me";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("PPlusOne_auth_user") || "null");
  } catch {
    return null;
  }
}

export function getCachedCurrentUser() {
  return getQueryData(CURRENT_USER_KEY, readStoredUser());
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem("PPlusOne_auth_user", JSON.stringify(user));
  return setQueryData(CURRENT_USER_KEY, user || null);
}

export function getCurrentUser(options = {}) {
  return fetchQuery(
    CURRENT_USER_KEY,
    async () => {
      const response = await api.get("/auth/me");
      const user =
        response.data?.user || response.data?.data?.user || response.data?.data || null;
      if (user) localStorage.setItem("PPlusOne_auth_user", JSON.stringify(user));
      return user;
    },
    { staleTime: 60_000, ...options }
  );
}

export function invalidateCurrentUser() {
  invalidateQueries("auth:");
}
