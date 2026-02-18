import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import SecurityCheckIcon from '@hugeicons/core-free-icons/SecurityCheckIcon'
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon'
import { Icon } from '@/components/ui/icon'
import {
  requestDataExport,
  requestAccountDeletion,
  cancelGdprRequest,
  getGdprRequests,
  pollGdprRequest,
  triggerExport,
  type GdprDataRequest,
  type GdprRequestStatus,
} from '@/services/gdpr'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const STATUS_LABEL: Record<GdprRequestStatus, string> = {
  pending: 'Pending',
  processing: 'Processing…',
  completed: 'Ready',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<GdprRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function StatusIcon({ status }: { status: GdprRequestStatus }) {
  switch (status) {
    case 'completed':
      return <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-600" />
    case 'failed':
      return <Icon icon={AlertCircleIcon} className="h-4 w-4 text-red-500" />
    case 'processing':
      return <Icon icon={Loading02Icon} className="h-4 w-4 text-blue-600 animate-spin" />
    default:
      return <Icon icon={Clock01Icon} className="h-4 w-4 text-gray-400" />
  }
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : '—'
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function GDPRTools() {
  const [requests, setRequests] = useState<GdprDataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')

  // UI state machines
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pollingId, setPollingId] = useState<string | null>(null)

  // ── initial load ────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(await getGdprRequests())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // ── poll active request until terminal ──────
  useEffect(() => {
    if (!pollingId) return
    const timer = setInterval(async () => {
      try {
        const updated = await pollGdprRequest(pollingId)
        setRequests(prev =>
          prev.map(r => (r.id === pollingId ? updated : r))
        )
        if (['completed', 'failed', 'cancelled'].includes(updated.status)) {
          setPollingId(null)
        }
      } catch { /* keep polling */ }
    }, 3000) // every 3 s
    return () => clearInterval(timer)
  }, [pollingId])

  // ── handlers ────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    try {
      const id = await requestDataExport(reason || undefined)
      await triggerExport(id)          // kick off the Edge Function
      setPollingId(id)                 // start polling
      setReason('')
      await reload()
    } catch (e) {
      alert((e instanceof Error ? e.message : '') || 'Failed to request export')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await requestAccountDeletion(reason || undefined)
      setReason('')
      setConfirmDelete(false)
      await reload()
      alert(
        'Your deletion request has been submitted. ' +
        'An admin will review and process it within 30 days.'
      )
    } catch (e) {
      alert((e instanceof Error ? e.message : '') || 'Failed to request deletion')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelGdprRequest(id)
      await reload()
    } catch (e) {
      alert((e instanceof Error ? e.message : '') || 'Could not cancel')
    }
  }

  // ── render ──────────────────────────────────
  const hasPending = requests.some(r =>
    r.status === 'pending' || r.status === 'processing'
  )

  return (
    <div className="space-y-6">
      {/* ── header ──────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Icon icon={SecurityCheckIcon} className="h-4 w-4 text-sky-600" />
        <h3 className="text-sm font-semibold">Privacy & Data Rights</h3>
      </div>

      {/* ── export card ─────────────────────────── */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div>
            <p className="text-sm font-medium">Export Your Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download a complete copy of everything you've created — repositories,
              runs, history, and audit trail — in one JSON file.
            </p>
          </div>

          <Textarea
            placeholder="Reason (optional)…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            className="text-sm"
            disabled={hasPending}
          />

          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting || hasPending}
          >
            {exporting ? (
              <><Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-2" /> Requesting…</>
            ) : (
              <><Icon icon={Download01Icon} className="h-3 w-3 mr-2" /> Export My Data</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── delete card ─────────────────────────── */}
      <Card className="border-red-200 bg-red-50/40">
        <CardContent className="pt-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-red-700">Delete My Account</p>
            <p className="text-xs text-red-600/80 mt-0.5">
              Permanently removes your account, all repositories, runs, and
              personal data. This cannot be undone.
            </p>
          </div>

          {!confirmDelete ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={hasPending}
            >
              <Icon icon={Delete02Icon} className="h-3 w-3 mr-2" />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3 border border-red-300 dark:border-red-800 rounded-lg p-3 bg-card">
              <p className="text-xs text-red-700 font-medium">
                Are you sure? Type your reason and confirm.
              </p>
              <Textarea
                placeholder="Why are you leaving? (optional)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? (
                    <><Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-2" /> Submitting…</>
                  ) : (
                    'Confirm Deletion'
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── request history ───────────────────── */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Request History
            </p>
            <button onClick={reload} className="text-muted-foreground hover:text-foreground">
              <Icon icon={RefreshIcon} className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin text-muted-foreground mx-auto py-2" />
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <StatusIcon status={req.status} />
                  <div>
                    <span className="font-medium capitalize">{req.request_type}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'completed' && req.download_url && (
                    <a
                      href={req.download_url}
                      download={`checklist-hq-export-${req.id.slice(0, 8)}.json`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Icon icon={Download01Icon} className="h-3 w-3" /> Download
                    </a>
                  )}

                  {req.status === 'completed' && req.download_expires_at && (
                    <span className="text-xs text-muted-foreground">
                      expires {fmtDate(req.download_expires_at)}
                    </span>
                  )}

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-xs text-muted-foreground hover:text-red-600"
                    >
                      Cancel
                    </button>
                  )}

                  {req.status === 'failed' && req.error_message && (
                    <span className="text-xs text-red-600">{req.error_message}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
