/**
 * MCP Validation Utilities
 *
 * Rate limiting, input sanitization, and security checks for MCP operations.
 */
import type { AuthContext } from './types.js';
/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar
 */
declare class RateLimiter {
    private requests;
    private readonly limit;
    private readonly windowMs;
    constructor(limit: number, windowMs: number);
    check(key: string): boolean;
    private cleanup;
}
export declare const rateLimiter: RateLimiter;
/**
 * Check rate limit for a user
 */
export declare function checkRateLimit(authContext: AuthContext): boolean;
/**
 * Sanitize user input to prevent injection attacks
 */
export declare function sanitizeInput(input: unknown): unknown;
/**
 * Validate UUID format
 */
export declare function isValidUuid(uuid: string): boolean;
/**
 * Validate repository ID
 */
export declare function validateRepoId(repoId: unknown): string;
/**
 * Validate run ID
 */
export declare function validateRunId(runId: unknown): string;
/**
 * Validate item ID
 */
export declare function validateItemId(itemId: unknown): string;
/**
 * Validate search query
 */
export declare function validateSearchQuery(query: unknown): string;
/**
 * Validate limit parameter
 */
export declare function validateLimit(limit: unknown, max?: number): number;
export {};
//# sourceMappingURL=validation.d.ts.map