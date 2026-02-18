import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ChartColumnIcon from '@hugeicons/core-free-icons/ChartColumnIcon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import AnalyticsUpIcon from '@hugeicons/core-free-icons/AnalyticsUpIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import Calendar01Icon from '@hugeicons/core-free-icons/Calendar01Icon'
import Timer01Icon from '@hugeicons/core-free-icons/Timer01Icon'
import Activity01Icon from '@hugeicons/core-free-icons/Activity01Icon'
import Target01Icon from '@hugeicons/core-free-icons/Target01Icon'
import { Icon } from '@/components/ui/icon'
import {
  getUserRunStats,
  getRepoRunStats,
  getItemAnalytics,
  formatDuration,
  formatCompletionRate,
} from '@/services/analytics'
import type { UserRunStats, RepoRunStats, ItemAnalytics } from '@/services/analytics'
import { getRepository } from '@/services/repository'
import type { Repository } from '@/types/database'

export default function RunAnalytics() {
  const { repoId } = useParams<{ repoId?: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserRunStats | null>(null)
  const [repoStats, setRepoStats] = useState<RepoRunStats | null>(null)
  const [itemAnalytics, setItemAnalytics] = useState<ItemAnalytics[]>([])
  const [repository, setRepository] = useState<Repository | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [repoId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Always load user stats
      const stats = await getUserRunStats()
      setUserStats(stats)

      // If viewing repo-specific analytics
      if (repoId) {
        const [repo, rStats, items] = await Promise.all([
          getRepository(repoId),
          getRepoRunStats(repoId),
          getItemAnalytics(repoId),
        ])
        setRepository(repo)
        setRepoStats(rStats)
        setItemAnalytics(items)
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AnalyticsSkeleton isRepoView={!!repoId} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={repoId ? `/app/repo/${repoId}` : '/app'}>
            <Button variant="ghost" size="icon">
              <Icon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Icon icon={ChartColumnIcon} className="h-6 w-6 text-primary" />
              {repository ? `${repository.title} Analytics` : 'Run Analytics'}
            </h1>
            <p className="text-muted-foreground">
              {repository
                ? 'Performance insights for this checklist'
                : 'Your overall run performance and statistics'}
            </p>
          </div>
        </div>

        {/* User Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Icon icon={Target01Icon} className="h-5 w-5" />}
              label="Total Runs"
              value={userStats.total_runs.toString()}
              subtext={`${userStats.runs_this_month} this month`}
            />
            <StatCard
              icon={<Icon icon={CheckmarkCircle02Icon} className="h-5 w-5" />}
              label="Completed"
              value={userStats.completed_runs.toString()}
              subtext={formatCompletionRate(userStats.completion_rate)}
              variant="success"
            />
            <StatCard
              icon={<Icon icon={Activity01Icon} className="h-5 w-5" />}
              label="Active / Paused"
              value={`${userStats.active_runs} / ${userStats.paused_runs}`}
              subtext="In progress"
              variant="warning"
            />
            <StatCard
              icon={<Icon icon={Timer01Icon} className="h-5 w-5" />}
              label="Total Time"
              value={formatDuration(userStats.total_time_spent_seconds)}
              subtext={`Avg: ${formatDuration(userStats.avg_duration_seconds)}`}
            />
          </div>
        )}

        {/* Weekly Activity */}
        {userStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Calendar01Icon} className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your run activity this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{userStats.runs_this_week}</p>
                  <p className="text-sm text-muted-foreground">Runs this week</p>
                </div>
                <div className="flex gap-1 items-end h-16">
                  {/* Simple bar chart visualization */}
                  {[...Array(7)].map((_, i) => {
                    // Mock data - in production, you'd get actual daily data
                    const height = Math.max(10, Math.random() * 100)
                    const isToday = i === 6
                    return (
                      <div
                        key={i}
                        className={`w-8 rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/30'
                          }`}
                        style={{ height: `${height}%` }}
                      />
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Repository-specific stats */}
        {repoId && repoStats && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon icon={AnalyticsUpIcon} className="h-5 w-5 text-primary" />
              Repository Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={<Icon icon={Target01Icon} className="h-5 w-5" />}
                label="Total Runs"
                value={repoStats.total_runs.toString()}
                subtext={`${repoStats.completed_runs} completed`}
              />
              <StatCard
                icon={<Icon icon={UserGroupIcon} className="h-5 w-5" />}
                label="Unique Users"
                value={repoStats.unique_users.toString()}
                subtext="Have run this checklist"
              />
              <StatCard
                icon={<Icon icon={Clock01Icon} className="h-5 w-5" />}
                label="Avg Duration"
                value={formatDuration(repoStats.avg_duration_seconds)}
                subtext={formatCompletionRate(repoStats.avg_completion_rate)}
              />
            </div>
          </>
        )}

        {/* Item Analytics */}
        {repoId && itemAnalytics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={ChartColumnIcon} className="h-5 w-5 text-primary" />
                Item Completion Analysis
              </CardTitle>
              <CardDescription>
                How quickly items are typically completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemAnalytics.slice(0, 10).map((item, index) => (
                  <div key={item.item_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[60%]">
                        {index + 1}. {item.item_text || 'Unnamed Item'}
                      </span>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{item.total_completions} completions</span>
                        <span>{formatDuration(item.avg_time_to_complete_seconds)}</span>
                      </div>
                    </div>
                    <Progress
                      value={
                        item.avg_completion_order
                          ? Math.min((item.avg_completion_order / itemAnalytics.length) * 100, 100)
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              {itemAnalytics.length > 10 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing top 10 of {itemAnalytics.length} items
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!userStats && !repoStats && (
          <Card className="text-center py-12">
            <CardContent>
              <Icon icon={ChartColumnIcon} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete some runs to see your analytics here.
              </p>
              <Link to="/app">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
  variant?: 'default' | 'success' | 'warning'
}

function StatCard({ icon, label, value, subtext, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>{icon}</div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton Loading State
function AnalyticsSkeleton({ isRepoView }: { isRepoView: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Card Skeleton */}
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        {/* Repo-specific skeleton */}
        {isRepoView && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
