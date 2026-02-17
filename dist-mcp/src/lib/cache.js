/**
 * Lightweight, generic, in-memory cache.
 *
 * Features
 *   • Per-entry TTL (default configurable at construction)
 *   • staleWhileRevalidate – returns stale data instantly while a fresh
 *     fetch runs in the background, so UIs feel snappy.
 *   • invalidate(key) / invalidateAll() for mutation-driven busting.
 *   • Zero external deps.
 */
export class MemoryCache {
    store = new Map();
    defaultTTL;
    constructor(defaultTTLms = 60_000) {
        this.defaultTTL = defaultTTLms;
    }
    /** Write a value; ttlMs overrides the instance default. */
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
        });
    }
    /** Read a value.  Returns undefined if missing or expired. */
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    /** True if the key exists and has NOT expired. */
    has(key) {
        return this.get(key) !== undefined;
    }
    /** Remove one key. */
    invalidate(key) {
        this.store.delete(key);
    }
    /** Remove every key that starts with `prefix`. */
    invalidatePattern(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix))
                this.store.delete(key);
        }
    }
    /** Nuke everything. */
    invalidateAll() {
        this.store.clear();
    }
    /** How many live (non-expired) entries are in the cache right now. */
    get size() {
        let count = 0;
        const now = Date.now();
        for (const entry of this.store.values()) {
            if (now <= entry.expiresAt)
                count++;
        }
        return count;
    }
}
// ──────────────────────────────────────────────
// Stale-while-revalidate helper
// ──────────────────────────────────────────────
/**
 * Wraps an async fetcher with stale-while-revalidate semantics.
 *
 * • First call (cold cache) – awaits the fetcher, caches the result, returns it.
 * • Subsequent calls within TTL – returns cached value instantly.
 * • Call after TTL – returns stale value instantly AND kicks off a background
 *   revalidation so the *next* call gets fresh data.
 *
 * @param cache   The MemoryCache instance to use.
 * @param key     Cache key.
 * @param fetcher The async function that actually hits the DB / API.
 * @param ttlMs   How long (ms) before the entry is considered stale.
 */
export async function staleWhileRevalidate(cache, key, fetcher, ttlMs = 60_000) {
    const cached = cache.get(key);
    if (cached !== undefined) {
        // Still fresh → return immediately, no background work.
        return cached;
    }
    // Check if there's a stale entry we can return while we revalidate.
    // We store a second "stale" copy that lives 10× longer.
    const staleKey = `__stale__${key}`;
    const stale = cache.get(staleKey);
    if (stale !== undefined) {
        // Fire-and-forget revalidation.
        fetcher()
            .then(fresh => {
            cache.set(key, fresh, ttlMs);
            cache.set(staleKey, fresh, ttlMs * 10);
        })
            .catch(() => { });
        return stale;
    }
    // Cold cache – must await.
    const fresh = await fetcher();
    cache.set(key, fresh, ttlMs);
    cache.set(staleKey, fresh, ttlMs * 10);
    return fresh;
}
// ──────────────────────────────────────────────
// App-wide singleton caches (pre-tuned TTLs)
// ──────────────────────────────────────────────
/** Org-level data: members, teams, repos.  Invalidated on mutations. */
export const orgCache = new MemoryCache(120_000); // 2 min
/** Analytics aggregates – expensive queries, stale is fine. */
export const analyticsCache = new MemoryCache(300_000); // 5 min
/** Audit logs – append-only, short TTL so new entries surface fast. */
export const auditCache = new MemoryCache(30_000); // 30 s
/** User's own repos / activity – moderate freshness. */
export const userCache = new MemoryCache(60_000); // 1 min
//# sourceMappingURL=cache.js.map