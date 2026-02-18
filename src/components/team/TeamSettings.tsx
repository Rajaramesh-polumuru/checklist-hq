import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import { updateTeam, deleteTeam } from '@/services/team'
import type { Team } from '@/types/database'
import { useToast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'

interface TeamSettingsProps {
  team: Team
  onUpdate: (team: Team) => void
}

export function TeamSettings({ team, onUpdate }: TeamSettingsProps) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')
  const [visibility, setVisibility] = useState<'visible' | 'secret'>(team.visibility)
  const [defaultPermission, setDefaultPermission] = useState<'read' | 'write' | 'admin'>(team.default_permission)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const hasChanges = 
    name !== team.name ||
    description !== (team.description || '') ||
    visibility !== team.visibility ||
    defaultPermission !== team.default_permission

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanges) return

    setSaving(true)
    try {
      const updated = await updateTeam(team.id, {
        name,
        description: description || null,
        visibility,
        default_permission: defaultPermission,
      })
      onUpdate(updated)
      success('Team settings updated')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== team.name) return

    setDeleting(true)
    try {
      await deleteTeam(team.id)
      success('Team deleted')
      navigate(`/app/orgs/${team.organization_id}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete team')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update team name, description, and visibility settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering Team"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional team description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as 'visible' | 'secret')}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">
                    <div>
                      <div className="font-medium">Visible</div>
                      <div className="text-xs text-muted-foreground">Anyone in the organization can see this team</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="secret">
                    <div>
                      <div className="font-medium">Secret</div>
                      <div className="text-xs text-muted-foreground">Only team members can see this team</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Default Repository Permission</Label>
              <Select value={defaultPermission} onValueChange={(v) => setDefaultPermission(v as 'read' | 'write' | 'admin')}>
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div>
                      <div className="font-medium">Read</div>
                      <div className="text-xs text-muted-foreground">View repositories only</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div>
                      <div className="font-medium">Write</div>
                      <div className="text-xs text-muted-foreground">Edit and run checklists</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Full control including sharing</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default permission level for team members when accessing repositories
              </p>
            </div>

            <Button
              type="submit"
              disabled={!hasChanges || saving}
              className="active:scale-95 transition-transform"
            >
              {saving ? (
                <>
                  <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Deleting this team will remove all members and their access to team repositories.
              This action cannot be undone.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-transform"
                >
                  <Icon icon={AlertCircleIcon} className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the <strong>{team.name}</strong> team and remove all member access.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-4">
                  <Label htmlFor="confirm-delete">
                    Type <strong>{team.name}</strong> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={team.name}
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== team.name || deleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <>
                        <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Team'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
