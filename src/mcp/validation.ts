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
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    if (recentRequests.length >= this.limit) {
      return false; // Rate limit exceeded
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter((ts) => now - ts < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Global rate limiter: 100 requests per minute per user
export const rateLimiter = new RateLimiter(100, 60 * 1000);

/**
 * Check rate limit for a user
 */
export function checkRateLimit(authContext: AuthContext): boolean {
  return rateLimiter.check(authContext.userId);
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Remove null bytes and control characters
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key) as string] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate repository ID
 */
export function validateRepoId(repoId: unknown): string {
  if (typeof repoId !== 'string' || !isValidUuid(repoId)) {
    throw new Error('Invalid repo_id: must be a valid UUID');
  }
  return repoId;
}

/**
 * Validate run ID
 */
export function validateRunId(runId: unknown): string {
  if (typeof runId !== 'string' || !isValidUuid(runId)) {
    throw new Error('Invalid run_id: must be a valid UUID');
  }
  return runId;
}

/**
 * Validate item ID
 */
export function validateItemId(itemId: unknown): string {
  if (typeof itemId !== 'string' || itemId.length === 0) {
    throw new Error('Invalid item_id: must be a non-empty string');
  }
  return itemId;
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: unknown): string {
  if (typeof query !== 'string') {
    throw new Error('Invalid query: must be a string');
  }

  if (query.length > 200) {
    throw new Error('Invalid query: maximum length is 200 characters');
  }

  return query.trim();
}

/**
 * Validate limit parameter
 */
export function validateLimit(limit: unknown, max: number = 100): number {
  if (typeof limit === 'undefined') {
    return 20; // Default
  }

  if (typeof limit !== 'number' || limit < 1) {
    throw new Error('Invalid limit: must be a positive number');
  }

  return Math.min(limit, max);
}
