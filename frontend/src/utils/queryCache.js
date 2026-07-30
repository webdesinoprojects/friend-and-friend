const queryCache = new Map();
const SESSION_CACHE_PREFIX = "buddybook_page_cache_v1:";
const SESSION_CACHE_MAX_AGE = 5 * 60 * 1000;
const PERSISTED_QUERY_PREFIXES = [
  "bookings:",
  "chats:",
  "notifications:",
  "providers:me",
  "reports:",
  "watchlist:",
];

function stableKey(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableKey).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableKey(value[key])}`)
    .join(",")}}`;
}

export function createQueryKey(name, params = {}) {
  return `${name}:${stableKey(params)}`;
}

export function getQueryData(key, fallback = null) {
  const cached = queryCache.get(key);
  return cached?.data !== undefined ? cached.data : fallback;
}

export function hasQueryData(key) {
  return queryCache.get(key)?.data !== undefined;
}

export function setQueryData(key, data) {
  queryCache.set(key, { data, updatedAt: Date.now(), promise: null });
  persistQueryCache();
  return data;
}

export function fetchQuery(key, fetcher, { staleTime = 30_000, force = false } = {}) {
  const cached = queryCache.get(key);
  const fresh = cached?.data !== undefined && Date.now() - cached.updatedAt < staleTime;

  if (!force && fresh) return Promise.resolve(cached.data);
  if (cached?.promise) return cached.promise;

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      queryCache.set(key, { data, updatedAt: Date.now(), promise: null });
      persistQueryCache();
      return data;
    })
    .catch((error) => {
      if (cached?.data !== undefined) return cached.data;
      throw error;
    })
    .finally(() => {
      const current = queryCache.get(key);
      if (current?.promise === promise) {
        queryCache.set(key, { ...current, promise: null });
      }
    });

  queryCache.set(key, {
    data: cached?.data,
    updatedAt: cached?.updatedAt || 0,
    promise,
  });
  return promise;
}

export function invalidateQueries(prefix) {
  for (const key of queryCache.keys()) {
    if (!prefix || key.startsWith(prefix)) queryCache.delete(key);
  }
  persistQueryCache();
}

export function clearQueryCache() {
  queryCache.clear();
  removePersistedQueryCache();
}

function isPersistedQuery(key) {
  return PERSISTED_QUERY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function readCurrentUserId() {
  if (typeof localStorage === "undefined") return "";
  try {
    const user = JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
    return String(user?.id || user?._id || "");
  } catch {
    return "";
  }
}

function currentStorageKey() {
  const userId = readCurrentUserId();
  return userId ? `${SESSION_CACHE_PREFIX}${userId}` : "";
}

function persistQueryCache() {
  if (typeof sessionStorage === "undefined") return;
  const storageKey = currentStorageKey();
  if (!storageKey) return;

  const entries = [];
  for (const [key, entry] of queryCache.entries()) {
    if (!isPersistedQuery(key) || entry?.data === undefined) continue;
    entries.push([key, { data: entry.data, updatedAt: entry.updatedAt || Date.now() }]);
  }

  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), entries }));
  } catch {
    // Memory caching still works when storage is unavailable or full.
  }
}

function removePersistedQueryCache() {
  if (typeof sessionStorage === "undefined") return;
  const storageKey = currentStorageKey();
  if (!storageKey) return;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore privacy-mode storage failures.
  }
}

function hydrateQueryCache() {
  if (typeof sessionStorage === "undefined") return;
  const storageKey = currentStorageKey();
  if (!storageKey) return;

  try {
    const payload = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (!payload || Date.now() - Number(payload.savedAt || 0) > SESSION_CACHE_MAX_AGE) {
      sessionStorage.removeItem(storageKey);
      return;
    }
    for (const [key, entry] of Array.isArray(payload.entries) ? payload.entries : []) {
      if (!isPersistedQuery(key) || entry?.data === undefined) continue;
      queryCache.set(key, {
        data: entry.data,
        updatedAt: Number(entry.updatedAt || payload.savedAt || 0),
        promise: null,
      });
    }
  } catch {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore privacy-mode storage failures.
    }
  }
}

hydrateQueryCache();
