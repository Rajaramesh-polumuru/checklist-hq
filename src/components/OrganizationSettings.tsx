import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loading02Icon, Delete02Icon, Alert01Icon, FloppyDiskIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { updateOrganization, deleteOrganization } from '@/services/organization'
import type { Organization } from '@/types/database'

import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorBanner, SuccessBanner } from '@/components/ErrorBanner'
import { WebhookManager } from '@/components/WebhookManager'
import { SlackIntegration } from '@/components/SlackIntegration'
import { SSOSettings } from '@/components/SSOSettings'
import { IPAllowlistSettings } from '@/components/IPAllowlistSettings'
import { RetentionSettings } from '@/components/RetentionSettings'
import { AuditLogViewer } from '@/components/AuditLogViewer'

interface OrganizationSettingsProps {
  org: Organization
  onUpdate: (updatedOrg: Organization) => void
}

export function OrganizationSettings({ org, onUpdate }: OrganizationSettingsProps) {
  const navigate = useNavigate()

  // Edit State
  const [name, setName] = useState(org.name)
  const [description, setDescription] = useState(org.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updated = await updateOrganization(org.id, {
        name,
        description: description || null
      })
      onUpdate(updated)
      setSaveSuccess('Organization updated successfully')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== org.slug) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteOrganization(org.id)
      navigate('/app') // Redirect to dashboard
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete organization')
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ErrorBanner error={saveError || deleteError} onDismiss={() => { setSaveError(null); setDeleteError(null) }} />
      <SuccessBanner message={saveSuccess} onDismiss={() => setSaveSuccess(null)} />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your organization's profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (URL)</label>
                <Input
                  value={org.slug}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Slugs cannot be changed after creation.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving || (name === org.name && description === (org.description || ''))}>
                {isSaving ? <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" /> : <Icon icon={FloppyDiskIcon} className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Manage webhooks and external connections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3 text-sm">Webhooks</h4>
            <WebhookManager orgId={org.id} />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 text-sm">Slack</h4>
            <SlackIntegration orgId={org.id} />
          </div>
        </CardContent>
      </Card>

      {/* SSO */}
      <Card>
        <CardHeader>
          <CardTitle>Single Sign-On</CardTitle>
          <CardDescription>Connect a SAML 2.0 identity provider for enterprise authentication.</CardDescription>
        </CardHeader>
        <CardContent>
          <SSOSettings organizationId={org.id} />
        </CardContent>
      </Card>

      {/* IP Allowlisting */}
      <Card>
        <CardHeader>
          <CardTitle>IP Allowlisting</CardTitle>
          <CardDescription>Restrict API access to approved IP addresses and CIDR ranges.</CardDescription>
        </CardHeader>
        <CardContent>
          <IPAllowlistSettings organizationId={org.id} />
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>Configure how long historical data is kept before automatic deletion.</CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionSettings organizationId={org.id} />
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Security & Compliance</CardTitle>
          <CardDescription>Activity logs for audit trails and compliance reporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogViewer organizationId={org.id} />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Icon icon={Alert01Icon} className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
            <div>
              <h4 className="font-medium">Delete Organization</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this organization, all teams, and all repositories.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-semibold text-foreground"> {org.name} </span>
              organization and remove all data associated with it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              Please type <strong>{org.slug}</strong> to confirm.
            </div>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={org.slug}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== org.slug || isDeleting}
            >
              {isDeleting ? <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
