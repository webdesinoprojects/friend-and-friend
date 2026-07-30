class TimedCache {
  constructor({ ttlMs = 60_000, maxEntries = 500 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.values = new Map();
  }

  get(key) {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.createdAt >= this.ttlMs) {
      this.values.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    if (!this.values.has(key) && this.values.size >= this.maxEntries) {
      this.values.delete(this.values.keys().next().value);
    }
    this.values.set(key, { value, createdAt: Date.now() });
    return value;
  }

  delete(key) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }

  get size() {
    return this.values.size;
  }
}

module.exports = TimedCache;
