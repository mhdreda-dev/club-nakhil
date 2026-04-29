import { Redis } from "@upstash/redis";

/**
 * Centralized Redis cache (Upstash REST).
 *
 * Single source of truth for all caching. Designed so the rest of the codebase
 * never imports `@upstash/redis` directly — that lets us swap providers, add
 * tag-based invalidation, or disable caching from one file.
 *
 * Behavior:
 *   - If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing, the
 *     module degrades to a no-op: `getOrSet` always falls through to the
 *     factory, `invalidate` does nothing. The app keeps working.
 *   - Any Redis error is caught and logged. Reads fall back to the factory;
 *     writes/deletes are best-effort. The cache is NEVER allowed to break a
 *     request.
 *   - HIT / MISS / ERROR logging is emitted only when NODE_ENV !== "production".
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const IS_DEV = process.env.NODE_ENV !== "production";

const globalForRedis = globalThis as unknown as {
  __upstashRedis: Redis | null | undefined;
};

function getClient(): Redis | null {
  if (globalForRedis.__upstashRedis !== undefined) {
    return globalForRedis.__upstashRedis;
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    if (IS_DEV) {
      console.warn(
        "[cache] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing — running in no-op mode",
      );
    }
    globalForRedis.__upstashRedis = null;
    return null;
  }

  globalForRedis.__upstashRedis = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });
  return globalForRedis.__upstashRedis;
}

function devLog(event: "HIT" | "MISS" | "ERROR" | "INVALIDATE", key: string, extra?: unknown) {
  if (!IS_DEV) return;
  if (extra !== undefined) {
    console.log(`[cache:${event}] ${key}`, extra);
  } else {
    console.log(`[cache:${event}] ${key}`);
  }
}

/**
 * Read-through cache helper.
 *
 * On HIT: returns the cached value.
 * On MISS or any Redis error: invokes `factory`, writes the result back with
 * `ttlSeconds`, and returns it. The original request is never blocked by a
 * Redis problem.
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>,
): Promise<T> {
  const redis = getClient();
  if (!redis) {
    return factory();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      devLog("HIT", key);
      return cached;
    }
  } catch (error) {
    devLog("ERROR", key, error instanceof Error ? error.message : error);
    return factory();
  }

  devLog("MISS", key);
  const fresh = await factory();

  // Write-back is best-effort. If it fails, the next request will simply
  // recompute.
  try {
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch (error) {
    devLog("ERROR", key, error instanceof Error ? error.message : error);
  }

  return fresh;
}

/**
 * Best-effort delete. Accepts a single key or an array. Errors are swallowed
 * (with a dev-only log) — invalidation must never break a mutation.
 */
export async function invalidate(keys: string | string[]): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return;

  try {
    await redis.del(...list);
    devLog("INVALIDATE", list.join(", "));
  } catch (error) {
    devLog("ERROR", list.join(", "), error instanceof Error ? error.message : error);
  }
}

/**
 * Best-effort prefix invalidation. Uses SCAN to find matching keys and deletes
 * them in batches. Use sparingly — prefer explicit keys when possible.
 */
export async function invalidatePrefix(prefix: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    let cursor: string | number = 0;
    const matched: string[] = [];

    do {
      const result: [string | number, string[]] = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      cursor = result[0];
      matched.push(...result[1]);
    } while (cursor !== 0 && cursor !== "0");

    if (matched.length > 0) {
      await redis.del(...matched);
      devLog("INVALIDATE", `${prefix}* (${matched.length})`);
    }
  } catch (error) {
    devLog("ERROR", `${prefix}*`, error instanceof Error ? error.message : error);
  }
}

export const CACHE_TTL = {
  LEADERBOARD: 60 * 5,        // 5 minutes
  DASHBOARD: 60,               // 60 seconds
  UPCOMING_SESSIONS: 600,      // 10 minutes — same result for every member
  PROFILE_SUMMARY: 60,         // 60 seconds — header + sidebar payload, low PII
} as const;

export const CACHE_KEYS = {
  leaderboardTop: (limit: number) => `leaderboard:top:${limit}`,
  leaderboardMember: (memberId: string) => `leaderboard:member:${memberId}`,
  dashboardMember: (memberId: string) => `dashboard:member:${memberId}`,
  upcomingSessions: () => `upcoming-sessions`,
  // Used by getProfileHeader / getProfileSidebarSummary on every member-layout
  // render. Holds the same shape as findUserProfileSummary's narrow select —
  // only display name, avatar, city, bio, and a few member-profile metrics.
  // No emails, phone numbers, or addresses.
  profileSummary: (userId: string) => `profile:summary:${userId}`,
} as const;
