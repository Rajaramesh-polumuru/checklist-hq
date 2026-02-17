import type { Repository } from '@/types/database';
export type ColorStatus = 'recently-used' | 'new' | 'popular' | 'forked' | 'public' | 'dormant' | 'default';
export interface ColorConfig {
    bg: string;
    text: string;
    gradient: string;
    label: string;
    description: React.ReactNode;
    icon: React.FC<any>;
    priority: number;
    border: string;
}
export declare const COLOR_LEGEND: Record<ColorStatus, ColorConfig>;
export declare function getRepoColorStatus(repo: Repository): ColorStatus;
/**
 * Check if a repository is new (created within last 7 days)
 */
export declare function isNew(repo: Repository): boolean;
/**
 * Check if a repository is stale (not updated in 60+ days)
 */
export declare function isStale(repo: Repository): boolean;
/**
 * Check if a repository is popular (has 10+ forks)
 */
export declare function isPopular(repo: Repository): boolean;
/**
 * Check if a repository was recently used (updated within 24 hours)
 */
export declare function isRecentlyUsed(repo: Repository): boolean;
/**
 * Stats Calculation Utilities
 */
export interface DashboardStats {
    total: number;
    public: number;
    private: number;
    forked: number;
    activeRuns: number;
    updatedToday: number;
    totalForks: number;
}
/**
 * Calculate comprehensive dashboard stats from repositories
 */
export declare function calculateStats(repositories: Repository[]): DashboardStats;
/**
 * Filtering Utilities
 */
export type VisibilityFilter = 'all' | 'public' | 'private';
export type TypeFilter = 'all' | 'original' | 'forked';
export type StatusFilter = 'all' | 'recent' | 'stale';
export interface FilterState {
    visibility: VisibilityFilter;
    type: TypeFilter;
    status: StatusFilter;
}
/**
 * Apply filters to repository list
 */
export declare function applyFilters(repositories: Repository[], filters: FilterState): Repository[];
/**
 * Sorting Utilities
 */
export type SortOption = 'updated' | 'created' | 'alpha' | 'forks';
/**
 * Sort repositories based on selected option
 */
export declare function sortRepositories(repositories: Repository[], sortBy: SortOption): Repository[];
/**
 * Get active filter count for UI display
 */
export declare function getActiveFilterCount(filters: FilterState): number;
/**
 * Reset filters to default state
 */
export declare function getDefaultFilters(): FilterState;
//# sourceMappingURL=dashboard-utils.d.ts.map