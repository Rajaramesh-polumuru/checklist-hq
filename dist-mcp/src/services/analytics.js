import { supabase } from '@/lib/supabase';
// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────
/**
 * Pull everything the analytics dashboard needs in ~4 parallel queries.
 */
export async function getOrgAnalytics(organizationId) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
    const isoThirty = thirtyDaysAgo.toISOString();
    // ── 1. Org repos (we need IDs for the run queries) ────────
    const { data: repoRows } = await supabase
        .from('repositories')
        .select('id, title')
        .eq('organization_id', organizationId);
    const repos = (repoRows || []);
    const repoIds = repos.map(r => r.id);
    // ── 2. Runs in this org (last 30 days) ─────────────────────
    let runs = [];
    if (repoIds.length) {
        const { data } = await supabase
            .from('runs')
            .select('id, repo_id, status, started_at, completed_at')
            .in('repo_id', repoIds)
            .gte('started_at', isoThirty)
            .order('started_at', { ascending: true });
        runs = (data || []);
    }
    // ── 3. Audit-log actions in this org (last 30 days) ────────
    const { data: auditRows } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', isoThirty)
        .order('created_at', { ascending: true });
    const audits = (auditRows || []);
    // ── 4. Distinct active members (from org_members) ──────────
    const { data: memberRows } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId);
    const activeMembers = (memberRows || []).length;
    // ══════════════════════════════════════════════════════════
    // DERIVE
    // ══════════════════════════════════════════════════════════
    const totalRuns = runs.length;
    const completedRuns = runs.filter(r => r.status === 'completed').length;
    const completionRate = totalRuns ? Math.round((completedRuns / totalRuns) * 100) : 0;
    // daily buckets ─ runs
    const dailyRuns = bucket30(runs.map(r => r.started_at));
    // daily buckets ─ audit actions
    const dailyActions = bucket30(audits.map(a => a.created_at));
    // runs per repo
    const repoMap = new Map();
    for (const repo of repos) {
        repoMap.set(repo.id, { title: repo.title, runs: 0, completedRuns: 0 });
    }
    for (const run of runs) {
        const entry = repoMap.get(run.repo_id);
        if (entry) {
            entry.runs++;
            if (run.status === 'completed')
                entry.completedRuns++;
        }
    }
    const runsByRepo = Array.from(repoMap.entries())
        .map(([id, v]) => ({ repositoryId: id, ...v }))
        .sort((a, b) => b.runs - a.runs);
    // action breakdown
    const actionCount = new Map();
    for (const a of audits) {
        actionCount.set(a.action, (actionCount.get(a.action) || 0) + 1);
    }
    const actionBreakdown = Array.from(actionCount.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);
    return {
        totalRuns,
        completedRuns,
        activeRepos: repos.length,
        activeMembers,
        completionRate,
        dailyRuns,
        dailyActions,
        runsByRepo,
        actionBreakdown,
    };
}
export async function getUserRunStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        throw new Error('Not authenticated');
    const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id);
    if (error)
        throw error;
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthRuns = runs?.filter(r => new Date(r.started_at) >= oneMonthAgo) || [];
    const weekRuns = runs?.filter(r => new Date(r.started_at) >= oneWeekAgo) || [];
    const completed = runs?.filter(r => r.status === 'completed') || [];
    const totalTime = completed.reduce((acc, r) => acc + (r.total_active_time_seconds || 0), 0);
    return {
        total_runs: runs?.length || 0,
        runs_this_month: monthRuns.length,
        runs_this_week: weekRuns.length,
        completed_runs: completed.length,
        completion_rate: (runs?.length || 0) > 0 ? (completed.length / (runs?.length || 1)) * 100 : 0,
        active_runs: runs?.filter(r => r.status === 'active').length || 0,
        paused_runs: runs?.filter(r => r.status === 'paused').length || 0,
        total_time_spent_seconds: totalTime,
        avg_duration_seconds: completed.length > 0 ? totalTime / completed.length : 0,
    };
}
export async function getRepoRunStats(repoId) {
    const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('repo_id', repoId);
    if (error)
        throw error;
    const completed = runs?.filter(r => r.status === 'completed') || [];
    const uniqueUsers = new Set(runs?.map(r => r.user_id).filter(Boolean)).size;
    const totalTime = completed.reduce((acc, r) => acc + (r.total_active_time_seconds || 0), 0);
    // Calculate average completion rate for all runs (how much of the checklist was done)
    // This is a bit complex as we don't have the item count easily, but we can average the length of progress entries
    // For now let's assume if it's status=completed it's 100%, otherwise we'd need more info.
    const avgCompRate = (runs?.length || 0) > 0 ? (completed.length / (runs?.length || 1)) * 100 : 0;
    return {
        total_runs: runs?.length || 0,
        completed_runs: completed.length,
        unique_users: uniqueUsers,
        avg_duration_seconds: completed.length > 0 ? totalTime / completed.length : 0,
        avg_completion_rate: avgCompRate
    };
}
export async function getItemAnalytics(repoId) {
    // Get all runs for this repo to aggregate item performance
    const { data: runs, error } = await supabase
        .from('runs')
        .select('*, commits(content)')
        .eq('repo_id', repoId);
    if (error)
        throw error;
    const itemStats = new Map();
    runs?.forEach(run => {
        const progress = (run.progress || {});
        const content = run.commits?.content?.items || {};
        Object.entries(progress).forEach(([itemId, p]) => {
            if (p.completed) {
                const existing = itemStats.get(itemId) || {
                    id: itemId,
                    text: content[itemId]?.text || 'Unknown Item',
                    completions: 0,
                    totalTime: 0,
                    totalOrder: 0
                };
                existing.completions++;
                // Calculate time since run started as a proxy if we don't have individual timestamps
                const startTime = new Date(run.started_at).getTime();
                const completionTime = p.timestamp ? new Date(p.timestamp).getTime() : startTime;
                existing.totalTime += (completionTime - startTime) / 1000;
                itemStats.set(itemId, existing);
            }
        });
    });
    return Array.from(itemStats.values()).map(s => ({
        item_id: s.id,
        item_text: s.text,
        total_completions: s.completions,
        avg_time_to_complete_seconds: s.totalTime / s.completions,
        avg_completion_order: 0 // placeholder
    })).sort((a, b) => b.total_completions - a.total_completions);
}
// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
/** Build 30-day buckets from an array of ISO date strings */
function bucket30(dates) {
    const buckets = new Map();
    // pre-fill every day
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets.set(toYMD(d), 0);
    }
    for (const iso of dates) {
        const key = iso.slice(0, 10); // YYYY-MM-DD
        if (buckets.has(key)) {
            buckets.set(key, buckets.get(key) + 1);
        }
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
function toYMD(d) {
    return d.toISOString().slice(0, 10);
}
export function formatDuration(seconds) {
    if (seconds < 60)
        return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}
export function formatCompletionRate(rate) {
    return `${Math.round(rate)}% success rate`;
}
//# sourceMappingURL=analytics.js.map