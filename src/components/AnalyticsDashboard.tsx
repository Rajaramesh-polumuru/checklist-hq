import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading02Icon, TradeUpIcon, ChartBarLineIcon, UserGroupIcon, CheckmarkCircle01Icon, PlayIcon, Activity01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { getOrgAnalytics, type OrgAnalytics, type DayBucket, type ActionStat, type RepoStat } from '@/services/analytics'

// ──────────────────────────────────────────────
// Micro-components
// ──────────────────────────────────────────────

/** Metric card with icon, value, label, optional delta */
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-primary',
  bg = 'bg-primary/10',
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
  color?: string
  bg?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon icon={Icon} className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/** Zero-dep SVG sparkline */
function Sparkline({
  data,
  width = 100,
  height = 40,
  color = '#6366f1',
  fill = true,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}) {
  if (data.length < 2) return null

  const max = Math.max(...data, 1)
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - (v / max) * (height - 4) - 2
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`

  // closed area for gradient fill
  const areaPath = fill
    ? `${linePath} L ${width},${height} L 0,${height} Z`
    : ''

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill="url(#sparkGrad)" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Full-width area chart with day labels */
function AreaChart({
  buckets,
  color,
  label,
  height = 120,
}: {
  buckets: DayBucket[]
  color: string
  label: string
  height?: number
}) {
  const width = 700 // logical; SVG scales via viewBox
  const values = buckets.map(b => b.count)
  const max = Math.max(...values, 1)
  const stepX = width / (buckets.length - 1 || 1)
  const padY = 24

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = padY + (height - padY - 8) - (v / max) * (height - padY - 8)
    return { x, y, v }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  // pick ~6 evenly-spaced x-axis labels
  const labelStep = Math.max(1, Math.floor(buckets.length / 6))
  const xLabels = buckets
    .map((b, i) => ({ label: b.date.slice(5), i }))
    .filter((_, i) => i % labelStep === 0 || i === buckets.length - 1)

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full" style={{ maxHeight: height + 20 }}>
        <defs>
          <linearGradient id={`areaGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padY + (height - padY - 8) * (1 - frac)
          return (
            <g key={frac}>
              <line x1="0" y1={y} x2={width} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x="4" y={y - 4} fontSize="9" fill="#9ca3af">{Math.round(max * frac)}</text>
            </g>
          )
        })}

        {/* area + line */}
        <path d={areaPath} fill={`url(#areaGrad-${label})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* dots on data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}

        {/* x-axis labels */}
        {xLabels.map(({ label: lbl, i }) => (
          <text key={i} x={i * stepX} y={height + 16} fontSize="9" fill="#9ca3af" textAnchor="middle">{lbl}</text>
        ))}
      </svg>
    </div>
  )
}

/** Horizontal bar (percentage-based) */
function HBar({ pct, color = 'bg-indigo-500' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

// ──────────────────────────────────────────────
// Main dashboard
// ──────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  'organization.created': 'bg-blue-500',
  'organization.updated': 'bg-amber-500',
  'organization.deleted': 'bg-red-500',
  'repository.created': 'bg-emerald-500',
  'repository.updated': 'bg-sky-500',
  'run.started': 'bg-violet-500',
  'run.completed': 'bg-green-500',
  'member.invited': 'bg-pink-500',
  'team.created': 'bg-orange-500',
  'permission.changed': 'bg-rose-500',
}

export function AnalyticsDashboard({ organizationId }: { organizationId: string }) {
  const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrgAnalytics(organizationId)
      .then(setAnalytics)
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [organizationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analytics) {
    return <p className="text-sm text-muted-foreground text-center py-10">No analytics data available.</p>
  }

  const a = analytics

  return (
    <div className="space-y-6">

      {/* ── top-line metric cards ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={PlayIcon} label="Total Runs" value={a.totalRuns} sub="last 30 d" color="text-violet-600" bg="bg-violet-100" />
        <MetricCard icon={CheckmarkCircle01Icon} label="Completed" value={a.completedRuns} sub={`${a.completionRate}% rate`} color="text-green-600" bg="bg-green-100" />
        <MetricCard icon={TradeUpIcon} label="Completion Rate" value={`${a.completionRate}%`} color="text-emerald-600" bg="bg-emerald-100" />
        <MetricCard icon={ChartBarLineIcon} label="Active Repos" value={a.activeRepos} color="text-blue-600" bg="bg-blue-100" />
        <MetricCard icon={UserGroupIcon} label="Members" value={a.activeMembers} color="text-sky-600" bg="bg-sky-100" />
      </div>

      {/* ── area charts row ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={PlayIcon} className="h-4 w-4 text-violet-500" /> Runs (30 d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart buckets={a.dailyRuns} color="#7c3aed" label="runs" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={Activity01Icon} className="h-4 w-4 text-indigo-500" /> Activity (30 d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart buckets={a.dailyActions} color="#4f46e5" label="activity" />
          </CardContent>
        </Card>
      </div>

      {/* ── bottom row: repos + action breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* runs by repo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={ChartBarLineIcon} className="h-4 w-4 text-blue-500" /> Runs by Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {a.runsByRepo.length === 0 ? (
              <p className="text-xs text-muted-foreground">No runs yet.</p>
            ) : (
              a.runsByRepo.slice(0, 8).map((repo: RepoStat) => {
                const pct = a.totalRuns ? (repo.runs / a.totalRuns) * 100 : 0
                return (
                  <div key={repo.repositoryId} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[60%]">{repo.title}</span>
                      <span className="text-muted-foreground">{repo.runs} runs · {repo.completedRuns} done</span>
                    </div>
                    <HBar pct={pct} />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* action breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={Activity01Icon} className="h-4 w-4 text-indigo-500" /> Activity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {a.actionBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity logged yet.</p>
            ) : (() => {
              const total = a.actionBreakdown.reduce((s: number, x: ActionStat) => s + x.count, 0)
              return a.actionBreakdown.slice(0, 8).map((item: ActionStat) => {
                const pct = total ? (item.count / total) * 100 : 0
                return (
                  <div key={item.action} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${ACTION_COLORS[item.action] || 'bg-gray-400'}`} />
                        <span className="font-medium">{item.action}</span>
                      </span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <HBar pct={pct} color={ACTION_COLORS[item.action] || 'bg-gray-400'} />
                  </div>
                )
              })
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── inline sparkline summary row ─────────── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-muted-foreground mb-1">Run trend (30 d)</p>
              <Sparkline data={a.dailyRuns.map(d => d.count)} width={160} height={36} color="#7c3aed" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-muted-foreground mb-1">Activity trend (30 d)</p>
              <Sparkline data={a.dailyActions.map(d => d.count)} width={160} height={36} color="#4f46e5" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-muted-foreground mb-1">Completion rate</p>
              <div className="flex items-end gap-1 h-[36px]">
                {[a.completedRuns, a.totalRuns - a.completedRuns].map((v, i) => (
                  <div
                    key={i}
                    className={`w-6 rounded-t ${i === 0 ? 'bg-green-500' : 'bg-gray-200'}`}
                    style={{ height: `${a.totalRuns ? (v / a.totalRuns) * 100 : 50}%` }}
                  />
                ))}
                <span className="text-xs font-bold text-emerald-700 ml-2">{a.completionRate}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
