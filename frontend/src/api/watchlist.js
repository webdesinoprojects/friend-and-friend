import api from "./api";
import { normalizeProvider } from "../data/providerCatalog";
import {
  createQueryKey,
  fetchQuery,
  getQueryData,
  invalidateQueries,
} from "../utils/queryCache";

export function getCachedWatchlist(params = {}) {
  return getQueryData(createQueryKey("watchlist", params), { items: [], pagination: null });
}

export function listWatchlist(params = {}, options = {}) {
  return fetchQuery(
    createQueryKey("watchlist", params),
    async () => {
      const response = await api.get("/watchlist", { params });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      return {
        items: rows.map((provider, index) => normalizeProvider(provider, index)),
        pagination: response.data?.pagination || null,
      };
    },
    { staleTime: 30_000, ...options }
  );
}

export async function getWatchlistStatus(providerId) {
  const response = await api.get(`/watchlist/${providerId}`);
  return Boolean(response.data?.saved);
}

export async function saveToWatchlist(providerId) {
  const response = await api.put(`/watchlist/${providerId}`);
  invalidateQueries("watchlist:");
  return Boolean(response.data?.saved);
}

export async function removeFromWatchlist(providerId) {
  const response = await api.delete(`/watchlist/${providerId}`);
  invalidateQueries("watchlist:");
  return Boolean(response.data?.saved);
}

export async function setWatchlistStatus(providerId, shouldSave) {
  return shouldSave
    ? saveToWatchlist(providerId)
    : removeFromWatchlist(providerId);
}
