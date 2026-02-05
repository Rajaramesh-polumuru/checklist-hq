import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading02Icon, Delete02Icon, Clock01Icon, RefreshIcon, SecurityCheckIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import {
  getRetentionPolicy,
  getRetentionPreview,
  upsertRetentionPolicy,
  runCleanupNow,
  type RetentionPolicy,
  type RetentionPreview,
} from '@/services/retention'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Allowed day-values for the dropdowns (0 = forever). */
const DAY_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
  { label: 'Forever', value: 0 },
]

function DaySelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="border rounded-md bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-[140px]"
    >
      {DAY_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

/** One row: icon, label, description, select, preview count */
function PolicyRow({
  icon: Icon,
  label,
  desc,
  value,
  onChange,
  previewCount,
  color = 'text-indigo-600',
  bg = 'bg-indigo-100',
}: {
  icon: any
  label: string
  desc: string
  value: number
  onChange: (v: number) => void
  previewCount: number
  color?: string
  bg?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon icon={Icon} className={`h-4 w-4 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <DaySelect value={value} onChange={onChange} />
        {previewCount > 0 && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
            {previewCount.toLocaleString()} to delete
          </span>
        )}
        {previewCount === 0 && (
          <span className="text-xs text-muted-foreground w-[90px] text-right">All clean</span>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

export function RetentionSettings({ organizationId }: { organizationId: string }) {
  // current persisted values (null = never saved → use defaults)
  const [policy, setPolicy] = useState<RetentionPolicy | null>(null)
  const [preview, setPreview] = useState<RetentionPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastClean, setLastClean] = useState<string | null>(null)   // ISO timestamp of last manual run

  // local draft (mirrors policy; user edits land here before save)
  const [draft, setDraft] = useState({
    auditLogDays: 90,
    runHistoryDays: 180,
    jobHistoryDays: 30,
    webhookLogDays: 60,
  })

  // ── load ──────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [p, pv] = await Promise.all([
        getRetentionPolicy(organizationId),
        getRetentionPreview(organizationId),
      ])
      setPolicy(p)
      setPreview(pv)
      if (p) {
        setDraft({
          auditLogDays: p.audit_log_days,
          runHistoryDays: p.run_history_days,
          jobHistoryDays: p.job_history_days,
          webhookLogDays: p.webhook_log_days,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => { reload() }, [reload])

  // ── handlers ──────────────────────────────
  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      await upsertRetentionPolicy({
        organizationId,
        ...draft,
      })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setError(null)
    setCleaning(true)
    try {
      await runCleanupNow(organizationId)
      setLastClean(new Date().toISOString())
      await reload()   // refresh preview counts
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cleanup failed')
    } finally {
      setCleaning(false)
    }
  }

  // ── whether draft differs from persisted ──
  const dirty = !policy ||
    draft.auditLogDays !== policy.audit_log_days ||
    draft.runHistoryDays !== policy.run_history_days ||
    draft.jobHistoryDays !== policy.job_history_days ||
    draft.webhookLogDays !== policy.webhook_log_days

  // ── render ────────────────────────────────
  if (loading) {
    return <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin text-muted-foreground mx-auto py-4" />
  }

  const totalToDelete =
    (preview?.audit_logs_to_delete ?? 0) +
    (preview?.runs_to_delete ?? 0) +
    (preview?.jobs_to_delete ?? 0)

  return (
    <div className="space-y-4">

      {/* ── header ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon icon={Clock01Icon} className="h-4 w-4 text-indigo-600" />
          Data Retention
        </h3>
        <div className="flex items-center gap-2">
          {totalToDelete > 0 && (
            <Button size="sm" variant="destructive" onClick={handleRunNow} disabled={cleaning}>
              {cleaning
                ? <><Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-1" /> Cleaning…</>
                : <><Icon icon={Delete02Icon} className="h-3 w-3 mr-1" /> Run cleanup now</>
              }
            </Button>
          )}
          <button onClick={reload} className="text-muted-foreground hover:text-foreground">
            <Icon icon={RefreshIcon} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── error ───────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* ── last run notice ─────────────────── */}
      {lastClean && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          ✓ Cleanup ran at {new Date(lastClean).toLocaleString()}
        </div>
      )}

      {/* ── policy rows ─────────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <PolicyRow
            icon={SecurityCheckIcon}
            label="Audit Logs"
            desc="Security & compliance activity trail"
            value={draft.auditLogDays}
            onChange={v => setDraft(d => ({ ...d, auditLogDays: v }))}
            previewCount={preview?.audit_logs_to_delete ?? 0}
            color="text-indigo-600"
            bg="bg-indigo-100"
          />
          <PolicyRow
            icon={RefreshIcon}
            label="Run History"
            desc="Completed checklist-run records"
            value={draft.runHistoryDays}
            onChange={v => setDraft(d => ({ ...d, runHistoryDays: v }))}
            previewCount={preview?.runs_to_delete ?? 0}
            color="text-violet-600"
            bg="bg-violet-100"
          />
          <PolicyRow
            icon={Clock01Icon}
            label="Job History"
            desc="Completed background-job records"
            value={draft.jobHistoryDays}
            onChange={v => setDraft(d => ({ ...d, jobHistoryDays: v }))}
            previewCount={preview?.jobs_to_delete ?? 0}
            color="text-sky-600"
            bg="bg-sky-100"
          />
        </CardContent>
      </Card>

      {/* ── save ────────────────────────────── */}
      {dirty && (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={reload}>Discard</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-1" /> Saving…</> : 'Save Policy'}
          </Button>
        </div>
      )}

      {/* ── schedule note ─────────────────── */}
      <p className="text-xs text-muted-foreground">
        Cleanup runs automatically every night at 02:00 UTC.  You can also trigger it manually above.
      </p>
    </div>
  )
}
