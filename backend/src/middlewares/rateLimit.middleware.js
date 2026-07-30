const buckets = new Map();

function createRateLimit({ windowMs = 15 * 60 * 1000, max = 300, keyPrefix = "api" } = {}) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const identity = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${identity}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, max - bucket.count);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait and try again.",
      });
    }

    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    return next();
  };
}

module.exports = createRateLimit;
