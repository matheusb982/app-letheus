/**
 * In-memory rate limiter for Server Actions.
 * Tracks attempts per key (e.g., email) with a sliding window.
 *
 * For multi-instance deployments, replace with Redis-based solution
 * (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.firstAttempt > DEFAULT_WINDOW_MS) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfter = Math.ceil((entry.firstAttempt + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  entry.attempts++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}
