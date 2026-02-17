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
export declare class MemoryCache<T = unknown> {
    private store;
    private defaultTTL;
    constructor(defaultTTLms?: number);
    /** Write a value; ttlMs overrides the instance default. */
    set(key: string, value: T, ttlMs?: number): void;
    /** Read a value.  Returns undefined if missing or expired. */
    get(key: string): T | undefined;
    /** True if the key exists and has NOT expired. */
    has(key: string): boolean;
    /** Remove one key. */
    invalidate(key: string): void;
    /** Remove every key that starts with `prefix`. */
    invalidatePattern(prefix: string): void;
    /** Nuke everything. */
    invalidateAll(): void;
    /** How many live (non-expired) entries are in the cache right now. */
    get size(): number;
}
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
export declare function staleWhileRevalidate<T>(cache: MemoryCache<T>, key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T>;
/** Org-level data: members, teams, repos.  Invalidated on mutations. */
export declare const orgCache: MemoryCache<unknown>;
/** Analytics aggregates – expensive queries, stale is fine. */
export declare const analyticsCache: MemoryCache<unknown>;
/** Audit logs – append-only, short TTL so new entries surface fast. */
export declare const auditCache: MemoryCache<unknown>;
/** User's own repos / activity – moderate freshness. */
export declare const userCache: MemoryCache<unknown>;
//# sourceMappingURL=cache.d.ts.map