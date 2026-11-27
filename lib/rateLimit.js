// In-memory sliding-window rate limiter.
// Suitable for single-instance / dev / edge-local protection; swap backing store
// for Redis/Upstash in multi-instance production deployments.

const store = globalThis.__citemasRateLimitStore || new Map();
if (!globalThis.__citemasRateLimitStore) {
  globalThis.__citemasRateLimitStore = store;
}

const MAX_STORE_ENTRIES = 10_000;

function pruneStore(now) {
  if (store.size <= MAX_STORE_ENTRIES) return;
  for (const [k, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(k);
    }
  }
}

/**
 * Sliding-window rate limit check.
 * @param {string} key - Unique bucket key (e.g. `login:ip:1.2.3.4`)
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ ok: boolean, remaining: number, retryAfterSec: number }}
 */
export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    pruneStore(now);
    entry = { timestamps: [], expiresAt: now + windowMs };
    store.set(key, entry);
  }

  // Drop timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.expiresAt = now + windowMs;

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = Math.max(1000, oldest + windowMs - now);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    ok: true,
    remaining: Math.max(0, limit - entry.timestamps.length),
    retryAfterSec: 0,
  };
}

/**
 * Extract best-effort client IP from Next.js Request headers.
 * @param {Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req?.headers?.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req?.headers?.get('x-real-ip')?.trim() || 'unknown';
}
