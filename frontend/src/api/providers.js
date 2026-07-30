import api from './api';
import { normalizeProvider } from '../data/providerCatalog';
import {
  createQueryKey,
  fetchQuery,
  getQueryData,
  invalidateQueries,
} from '../utils/queryCache';

const PROVIDER_CACHE_KEY = 'buddybook_explore_providers_cache';
const MY_PROVIDER_CACHE_KEY = 'buddybook_my_provider_profile_cache';
const providerImageCache = new Map();

export function getCachedProviders() {
  return readProviderCache();
}

export function getCachedProvider(id) {
  return getCachedProviders().find((provider) => provider.id === id) || null;
}

export async function listProviders(params = {}) {
  const requestParams = { imageMode: 'first', ...params };
  return fetchQuery(
    createQueryKey('providers:list', requestParams),
    async () => {
      try {
        const res = await api.get('/providers', {
          params: requestParams,
          // Provider rows include image metadata and can take a few seconds on a
          // cold database connection. Do not discard a healthy slower response.
          timeout: 15000,
        });
        const rows = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        const normalized = rows.map((item, index) => normalizeProvider(item, index));
        writeProviderCache(normalized);
        return normalized;
      } catch {
        return getCachedProviders();
      }
    },
    { staleTime: 60_000 }
  );
}

export async function createProvider(payload) {
  const res = await api.post('/providers', payload);
  invalidateQueries('providers:');
  const provider = normalizeProvider(res.data?.data || res.data);
  rememberProvider(provider);
  return provider;
}

export function getCachedMyProviderProfile() {
  return getQueryData('providers:me', readMyProviderCache());
}

export function getMyProviderProfile(options = {}) {
  return fetchQuery(
    'providers:me',
    async () => {
      const cached = readMyProviderCache();
      try {
        const res = await api.get('/providers/me/profile');
        const payload = {
          provider: res.data?.data || null,
          stats: res.data?.stats || null,
        };
        writeMyProviderCache(payload);
        return payload;
      } catch (error) {
        if ([401, 403].includes(error?.response?.status)) {
          return { provider: null, stats: null };
        }
        return {
          provider: cached?.provider || null,
          stats: cached?.stats || null,
        };
      }
    },
    { staleTime: 60_000, ...options }
  );
}

export async function saveMyProviderProfile(payload) {
  const res = await api.put('/providers/me/profile', payload);
  invalidateQueries('providers:');
  const provider = normalizeProvider(res.data?.data || res.data);
  rememberProvider(provider);
  return {
    provider,
    rawProvider: res.data?.data || null,
    stats: res.data?.stats || null,
    message: res.data?.message,
  };
}

export async function uploadProviderImages(files) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('images', file);
  });

  const res = await api.post('/providers/images', formData, {
    timeout: 60000,
  });

  return Array.isArray(res.data?.images) ? res.data.images : [];
}

export async function updateMyProviderProfilePhoto(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.patch('/providers/me/profile-photo', formData, { timeout: 60000 });
  invalidateQueries('providers:');
  clearProviderCaches();
  return res.data;
}

export async function getProvider(id) {
  const res = await api.get(`/providers/${id}`, { timeout: 15000 });
  const provider = normalizeProvider(res.data?.data || res.data?.provider || res.data);
  rememberProvider(provider);
  return provider;
}

export function clearProviderCaches() {
  localStorage.removeItem(PROVIDER_CACHE_KEY);
  sessionStorage.removeItem(MY_PROVIDER_CACHE_KEY);
  providerImageCache.clear();
  invalidateQueries('providers:');
}

export async function getProviderImages(id) {
  if (providerImageCache.has(id)) return providerImageCache.get(id);

  const res = await api.get(`/providers/${id}/images`, {
    timeout: 15000,
  });

  const images = Array.isArray(res.data?.images) ? res.data.images : [];
  providerImageCache.set(id, images);
  return images;
}

function readProviderCache() {
  try {
    const rows = JSON.parse(localStorage.getItem(PROVIDER_CACHE_KEY) || '[]');
    if (!Array.isArray(rows)) return [];

    const cleaned = rows.filter(isRealProvider).map(stripImagesForCache);
    if (cleaned.length !== rows.length || rows.some(hasCachedImages)) {
      writeProviderCache(cleaned);
    }

    return cleaned;
  } catch {
    return [];
  }
}

function readMyProviderCache() {
  try {
    return JSON.parse(sessionStorage.getItem(MY_PROVIDER_CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeMyProviderCache(value) {
  try {
    sessionStorage.setItem(MY_PROVIDER_CACHE_KEY, JSON.stringify(value || null));
  } catch {
    // Session storage can be unavailable in privacy-restricted browsers.
  }
}

function writeProviderCache(rows) {
  try {
    localStorage.setItem(
      PROVIDER_CACHE_KEY,
      JSON.stringify((Array.isArray(rows) ? rows : []).map(stripImagesForCache))
    );
  } catch {
    // Storage can fail in private mode; backend data will still render live.
  }
}

function rememberProvider(provider) {
  if (!isRealProvider(provider)) return;

  const current = readProviderCache();
  const next = new Map(current.map((item) => [item.id, item]));
  next.set(provider.id, stripImagesForCache(provider));
  writeProviderCache(Array.from(next.values()));
}

function isRealProvider(provider) {
  return provider?.id && !String(provider.id).startsWith('demo-');
}

function hasCachedImages(provider) {
  return (
    String(provider?.image || '').startsWith('data:image/') ||
    (Array.isArray(provider?.images) &&
      provider.images.some((image) => String(image || '').startsWith('data:image/')))
  );
}

function stripImagesForCache(provider) {
  if (!provider) return provider;
  return {
    ...provider,
    image: String(provider.image || '').startsWith('data:image/') ? '' : provider.image,
    images: Array.isArray(provider.images)
      ? provider.images.filter((image) => !String(image || '').startsWith('data:image/'))
      : [],
  };
}
