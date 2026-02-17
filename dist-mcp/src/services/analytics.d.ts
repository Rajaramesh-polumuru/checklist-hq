export interface OrgAnalytics {
    totalRuns: number;
    completedRuns: number;
    activeRepos: number;
    activeMembers: number;
    completionRate: number;
    dailyRuns: DayBucket[];
    dailyActions: DayBucket[];
    runsByRepo: RepoStat[];
    actionBreakdown: ActionStat[];
}
export interface DayBucket {
    date: string;
    count: number;
}
export interface RepoStat {
    repositoryId: string;
    title: string;
    runs: number;
    completedRuns: number;
}
export interface ActionStat {
    action: string;
    count: number;
}
export interface UserRunStats {
    total_runs: number;
    runs_this_month: number;
    runs_this_week: number;
    completed_runs: number;
    completion_rate: number;
    active_runs: number;
    paused_runs: number;
    total_time_spent_seconds: number;
    avg_duration_seconds: number;
}
export interface RepoRunStats {
    total_runs: number;
    completed_runs: number;
    unique_users: number;
    avg_duration_seconds: number;
    avg_completion_rate: number;
}
export interface ItemAnalytics {
    item_id: string;
    item_text: string;
    total_completions: number;
    avg_time_to_complete_seconds: number;
    avg_completion_order: number;
}
/**
 * Pull everything the analytics dashboard needs in ~4 parallel queries.
 */
export declare function getOrgAnalytics(organizationId: string): Promise<OrgAnalytics>;
export declare function getUserRunStats(): Promise<UserRunStats>;
export declare function getRepoRunStats(repoId: string): Promise<RepoRunStats>;
export declare function getItemAnalytics(repoId: string): Promise<ItemAnalytics[]>;
export declare function formatDuration(seconds: number): string;
export declare function formatCompletionRate(rate: number): string;
//# sourceMappingURL=analytics.d.ts.map