import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loading02Icon,
  PlusSignIcon,
  Delete02Icon,
  SecurityCheckIcon,
  Globe02Icon,
  Alert02Icon,
  ToggleOffIcon,
  ToggleOnIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import {
  getIPAllowlist,
  addIPEntry,
  toggleIPEntry,
  deleteIPEntry,
  getEnforcementEnabled,
  setEnforcementEnabled,
  getMyPublicIP,
  type IPAllowlistEntry,
} from '@/services/ipAllowlist'

// ──────────────────────────────────────────────

interface IPAllowlistSettingsProps {
  organizationId: string
}

export function IPAllowlistSettings({ organizationId }: IPAllowlistSettingsProps) {
  const [entries, setEntries] = useState<IPAllowlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [enforced, setEnforced] = useState(false)
  const [myIP, setMyIP] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // form
  const [cidr, setCidr] = useState('')
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // ── load ──────────────────────────────────

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [list, isEnforced, ip] = await Promise.all([
        getIPAllowlist(organizationId),
        getEnforcementEnabled(organizationId),
        getMyPublicIP(),
      ])
      setEntries(list)
      setEnforced(isEnforced)
      setMyIP(ip)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => { reload() }, [reload])

  // ── handlers ──────────────────────────────

  const handleAdd = async () => {
    setError(null)
    setAdding(true)
    try {
      await addIPEntry({ organizationId, cidr: cidr.trim(), label: label.trim() || undefined })
      setCidr('')
      setLabel('')
      setShowForm(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add entry')
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleIPEntry(id, !currentActive)
      setEntries(prev => prev.map(e => (e.id === id ? { ...e, is_active: !currentActive } : e)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this IP entry?')) return
    try {
      await deleteIPEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const handleEnforceToggle = async () => {
    setError(null)
    try {
      await setEnforcementEnabled(organizationId, !enforced)
      setEnforced(prev => !prev)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle enforcement')
    }
  }

  // convenience: "add my IP" shortcut
  const handleAddMyIP = async () => {
    if (!myIP || myIP === 'unknown') return
    setError(null)
    setAdding(true)
    try {
      await addIPEntry({ organizationId, cidr: `${myIP}/32`, label: 'My current IP' })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  // ── render ────────────────────────────────

  if (loading) {
    return <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin text-muted-foreground mx-auto py-4" />
  }

  return (
    <div className="space-y-4">

      {/* ── header + enforcement toggle ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon icon={SecurityCheckIcon} className="h-4 w-4 text-indigo-600" />
          IP Allowlisting
        </h3>

        <button
          onClick={handleEnforceToggle}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${enforced ? 'text-indigo-700' : 'text-muted-foreground'}`}
        >
          {enforced
            ? <Icon icon={ToggleOnIcon} className="h-5 w-5 text-indigo-600" />
            : <Icon icon={ToggleOffIcon} className="h-5 w-5 text-gray-300" />
          }
          {enforced ? 'Enforced' : 'Off'}
        </button>
      </div>

      {/* ── error banner ────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Icon icon={Alert02Icon} className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── enforcement warning ─────────── */}
      {enforced && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <Icon icon={Alert02Icon} className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Enforcement is ON</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Only IPs in the allowlist can access this organisation's data via API. Be sure your network is listed.
            </p>
          </div>
        </div>
      )}

      {/* ── my IP indicator ─────────────── */}
      <div className="flex items-center justify-between bg-muted/40 border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon icon={Globe02Icon} className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Your current IP</span>
          <span className="text-xs font-mono font-semibold">{myIP || '…'}</span>
          {myIP && myIP !== 'unknown' && entries.some(e => e.is_active && e.cidr === `${myIP}/32`) && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">✓ Allowed</Badge>
          )}
        </div>
        {myIP && myIP !== 'unknown' && !entries.some(e => e.cidr === `${myIP}/32`) && (
          <Button size="sm" variant="outline" onClick={handleAddMyIP} disabled={adding}>
            {adding ? <Icon icon={Loading02Icon} className="h-3 w-3 animate-spin" /> : <><Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" /> Add my IP</>}
          </Button>
        )}
      </div>

      {/* ── entry list ──────────────────── */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-2.5 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                {/* active toggle */}
                <button onClick={() => handleToggle(entry.id, entry.is_active)} className="flex-shrink-0">
                  {entry.is_active
                    ? <Icon icon={ToggleOnIcon} className="h-5 w-5 text-indigo-500" />
                    : <Icon icon={ToggleOffIcon} className="h-5 w-5 text-gray-300" />
                  }
                </button>
                <div>
                  <span className="text-sm font-mono font-medium">{entry.cidr}</span>
                  {entry.label && <span className="text-xs text-muted-foreground ml-2">{entry.label}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground hover:text-red-600 transition-colors">
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── add form ────────────────────── */}
      {showForm ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">IP / CIDR <span className="text-red-500">*</span></label>
                <Input
                  value={cidr}
                  onChange={e => setCidr(e.target.value)}
                  placeholder="10.0.0.0/24"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Label</label>
                <Input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Corporate HQ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} disabled={adding || !cidr.trim()}>
                {adding ? <Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-1" /> : <Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" />}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Icon icon={PlusSignIcon} className="h-3 w-3 mr-2" /> Add IP / CIDR Range
        </Button>
      )}

      {/* ── empty hint ──────────────────── */}
      {entries.length === 0 && !showForm && (
        <p className="text-xs text-center text-muted-foreground">
          No entries yet. Add at least one before enabling enforcement.
        </p>
      )}
    </div>
  )
}
