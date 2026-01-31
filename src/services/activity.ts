import { supabase } from '@/lib/supabase'

export interface ActivityItem {
    id: string
    type: 'run_started' | 'run_completed' | 'repo_created' | 'repo_forked'
    title: string
    timestamp: string
    link: string
    details?: string
}

export async function getUserActivity(userId: string): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = []

    // 1. Fetch recent runs (started or completed)
    const { data: runs, error: runsError } = await supabase
        .from('runs')
        .select(`
      id,
      repo_id,
      started_at,
      completed_at,
      status,
      repositories (title)
    `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(20)

    if (runsError) throw runsError

    // Process runs
    runs?.forEach((run: any) => {
        // Run Started
        activities.push({
            id: `run_started_${run.id}`,
            type: 'run_started',
            title: `Started "${run.repositories?.title}"`,
            timestamp: run.started_at,
            link: `/app/run/${run.id}`,
        })

        // Run Completed
        if (run.completed_at && run.status === 'completed') {
            activities.push({
                id: `run_completed_${run.id}`,
                type: 'run_completed',
                title: `Completed "${run.repositories?.title}"`,
                timestamp: run.completed_at,
                link: `/app/run/${run.id}`, // Or history?
            })
        }
    })

    // 2. Fetch created/forked repos
    const { data: repos, error: reposError } = await supabase
        .from('repositories')
        .select(`
      id,
      title,
      created_at,
      origin_repo_id,
      upstream_repo_id
    `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (reposError) throw reposError

    // Process repos
    repos?.forEach((repo) => {
        if (repo.upstream_repo_id) {
            activities.push({
                id: `repo_forked_${repo.id}`,
                type: 'repo_forked',
                title: `Forked "${repo.title}"`,
                timestamp: repo.created_at,
                link: `/app/repo/${repo.id}`,
            })
        } else {
            activities.push({
                id: `repo_created_${repo.id}`,
                type: 'repo_created',
                title: `Created "${repo.title}"`,
                timestamp: repo.created_at,
                link: `/app/repo/${repo.id}`,
            })
        }
    })

    // Sort by timestamp desc
    return activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50)
}
