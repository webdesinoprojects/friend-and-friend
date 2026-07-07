import api from './api';
import { normalizeProvider } from '../data/providerCatalog';

const PROVIDER_CACHE_KEY = 'buddybook_explore_providers_cache';
let backgroundRefresh = null;
const providerImageCache = new Map();

export function getCachedProviders() {
  return readProviderCache();
}

export function getCachedProvider(id) {
  return getCachedProviders().find((provider) => provider.id === id) || null;
}

export async function listProviders(params = {}) {
  try {
    const res = await api.get('/providers', {
      params: { imageMode: 'first', ...params },
      timeout: 1200,
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
    refreshProviderCache(params);
    return getCachedProviders();
  }
}

export async function createProvider(payload) {
  const res = await api.post('/providers', payload);
  const provider = normalizeProvider(res.data?.data || res.data);
  rememberProvider(provider);
  return provider;
}

export async function getMyProviderProfile() {
  const res = await api.get('/providers/me/profile');
  return {
    provider: res.data?.data || null,
    stats: res.data?.stats || null,
  };
}

export async function saveMyProviderProfile(payload) {
  const res = await api.put('/providers/me/profile', payload);
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

export async function getProvider(id) {
  const cached = getCachedProviders().find((provider) => provider.id === id);

  try {
    const res = await api.get(`/providers/${id}`, {
      timeout: 3000,
    });
    const provider = normalizeProvider(res.data?.data || res.data?.provider || res.data);
    rememberProvider(provider);
    return provider;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
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

function refreshProviderCache(params = {}) {
  if (backgroundRefresh) return backgroundRefresh;

  backgroundRefresh = api
    .get('/providers', {
      params: { imageMode: 'first', ...params },
      timeout: 20000,
    })
    .then((res) => {
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      const normalized = rows.map((item, index) => normalizeProvider(item, index));
      writeProviderCache(normalized);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('buddybook:providers-cache-updated'));
      }
      return normalized;
    })
    .catch(() => getCachedProviders())
    .finally(() => {
      backgroundRefresh = null;
    });

  return backgroundRefresh;
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
