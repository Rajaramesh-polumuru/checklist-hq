/**
 * Run Context Store
 * Manages cross-checklist data flow and outputs.
 * 
 * Persisted in the `metadata` JSONB column of the `runs` table.
 */

import type { Run } from '@/types/database';

export class RunContext {
  private data: Record<string, unknown>;

  constructor(run: Run) {
    this.data = (run.metadata?.context as Record<string, unknown>) || {};
  }

  /**
   * Set a context value
   */
  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  /**
   * Get a context value
   */
  get(key: string): unknown {
    // Support nested keys like "server.ip"
    const keys = key.split('.');
    let current: any = this.data;
    
    for (const k of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[k];
    }
    
    return current;
  }

  /**
   * Get all context
   */
  getAll(): Record<string, unknown> {
    return { ...this.data };
  }

  /**
   * Serialize for DB storage
   */
  toJSON(): Record<string, unknown> {
    return { context: this.data };
  }
}
