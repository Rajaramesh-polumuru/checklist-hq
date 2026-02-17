/**
 * Centralized date formatting utilities
 * Eliminates duplicate implementations across Dashboard, RunMode, and RunItem
 */
/**
 * Format a date string as relative time (e.g., "2 hours ago", "yesterday")
 * Used in: Dashboard, RunMode, VersionHistory
 */
export declare function formatRelativeTime(dateString: string): string;
/**
 * Format a date string as compact relative time (e.g., "2h", "3d")
 * Used in: RunItem for completion timestamps
 */
export declare function formatCompactTime(dateString: string): string;
/**
 * Format a date string for display in UI
 * Used for absolute dates in headers, cards, etc.
 */
export declare function formatDate(dateString: string): string;
/**
 * Format a date string with time
 */
export declare function formatDateTime(dateString: string): string;
//# sourceMappingURL=date-utils.d.ts.map