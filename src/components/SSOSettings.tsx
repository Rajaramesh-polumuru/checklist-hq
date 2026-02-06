import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading02Icon, SecurityCheckIcon, CheckmarkCircle01Icon, AlertCircleIcon, Delete02Icon, PlusSignIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import {
  getSSOConfig,
  upsertSSOConfig,
  deleteSSOConfig,
  type SSOConfiguration,
} from '@/services/sso'

interface SSOSettingsProps {
  organizationId: string
}

export function SSOSettings({ organizationId }: SSOSettingsProps) {
  // ── state ───────────────────────────────────
  const [config, setConfig] = useState<SSOConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form fields
  const [idpEntityId, setIdpEntityId] = useState('')
  const [idpSsoUrl, setIdpSsoUrl] = useState('')
  const [idpCertificate, setIdpCertificate] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [domains, setDomains] = useState<string[]>([])

  // ── load ────────────────────────────────────
  useEffect(() => {
    getSSOConfig(organizationId)
      .then(cfg => {
        setConfig(cfg)
        if (cfg) {
          setIdpEntityId(cfg.idp_entity_id)
          setIdpSsoUrl(cfg.idp_sso_url)
          setIdpCertificate(cfg.idp_certificate)
          setDomains(cfg.domains)
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load SSO config'))
      .finally(() => setLoading(false))
  }, [organizationId])

  // ── handlers ────────────────────────────────

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase().replace(/^\./, '')
    if (d && !domains.includes(d)) {
      setDomains(prev => [...prev, d])
    }
    setDomainInput('')
  }

  const removeDomain = (d: string) => setDomains(prev => prev.filter(x => x !== d))

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const saved = await upsertSSOConfig({
        organizationId,
        idpEntityId,
        idpSsoUrl,
        idpCertificate,
        domains,
      })
      setConfig(saved)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remove SSO configuration? Members will need to sign in another way.')) return
    setDeleting(true)
    try {
      await deleteSSOConfig(organizationId)
      setConfig(null)
      setShowForm(false)
      setDomains([])
      setIdpEntityId('')
      setIdpSsoUrl('')
      setIdpCertificate('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // ── render ──────────────────────────────────
  if (loading) {
    return <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin text-muted-foreground mx-auto py-4" />
  }

  return (
    <div className="space-y-4">
      {/* ── header ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon icon={SecurityCheckIcon} className="h-4 w-4 text-indigo-600" />
          Single Sign-On (SAML 2.0)
        </h3>
        {!config && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" /> Configure SSO
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <Icon icon={AlertCircleIcon} className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── active config summary ─────────── */}
      {config && !showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.is_active ? (
                  <Icon icon={CheckmarkCircle01Icon} className="h-5 w-5 text-green-600" />
                ) : (
                  <Icon icon={AlertCircleIcon} className="h-5 w-5 text-amber-500" />
                )}
                <span className="text-sm font-semibold">
                  {config.is_active ? 'SSO Active' : 'SSO Pending'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {config.is_verified ? 'Verified' : 'Awaiting first login'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
                  <Icon icon={Delete02Icon} className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">IdP Entity ID</span>
                <p className="font-mono truncate">{config.idp_entity_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">SSO URL</span>
                <p className="font-mono truncate">{config.idp_sso_url}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Domains</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {config.domains.map(d => (
                    <span key={d} className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs px-2 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SP metadata that the IdP needs */}
            <div className="bg-muted/40 rounded-lg p-3 space-y-1 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Service Provider Metadata (paste into your IdP)
              </p>
              <p className="text-xs font-mono break-all">
                <span className="text-muted-foreground">ACS URL: </span>
                {window.location.origin}/auth/saml/acs
              </p>
              <p className="text-xs font-mono break-all">
                <span className="text-muted-foreground">Entity ID: </span>
                {window.location.origin}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── create / edit form ─────────────── */}
      {showForm && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="pt-5 space-y-4">
            {/* IdP Entity ID */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">IdP Entity ID <span className="text-red-500">*</span></label>
              <Input
                value={idpEntityId}
                onChange={e => setIdpEntityId(e.target.value)}
                placeholder="https://idp.example.com"
              />
            </div>

            {/* IdP SSO URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">IdP Single Sign-On URL <span className="text-red-500">*</span></label>
              <Input
                value={idpSsoUrl}
                onChange={e => setIdpSsoUrl(e.target.value)}
                placeholder="https://idp.example.com/sso"
              />
            </div>

            {/* Certificate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">IdP X.509 Certificate <span className="text-red-500">*</span></label>
              <textarea
                className="w-full border rounded-md bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={4}
                value={idpCertificate}
                onChange={e => setIdpCertificate(e.target.value)}
                placeholder={"MIIBxT...\n(PEM body only — no BEGIN/END headers)"}
              />
            </div>

            {/* Domains */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Email Domains <span className="text-red-500">*</span>
                <span className="text-muted-foreground font-normal ml-1">(users with these domains will see "Sign in with SSO")</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomain() } }}
                  placeholder="example.com"
                  className="flex-1"
                />
                <Button size="sm" variant="outline" type="button" onClick={addDomain}>
                  <Icon icon={PlusSignIcon} className="h-3 w-3" />
                </Button>
              </div>
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {domains.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded">
                      {d}
                      <button onClick={() => removeDomain(d)} className="hover:text-red-600">
                        <Icon icon={Cancel01Icon} className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !idpEntityId || !idpSsoUrl || !idpCertificate || domains.length === 0}
              >
                {saving ? <><Icon icon={Loading02Icon} className="h-3 w-3 animate-spin mr-2" />Saving…</> : (config ? 'Update SSO' : 'Enable SSO')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── empty state ─────────────────────── */}
      {!config && !showForm && (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="py-8 text-center">
            <Icon icon={SecurityCheckIcon} className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm text-muted-foreground">No SSO configured</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect a SAML 2.0 identity provider so your team can sign in with their corporate credentials.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              <Icon icon={SecurityCheckIcon} className="h-3 w-3 mr-2" /> Set Up SSO
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
