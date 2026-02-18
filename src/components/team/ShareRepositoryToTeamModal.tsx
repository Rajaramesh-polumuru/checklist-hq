import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@/components/ui/icon'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import { Input } from '@/components/ui/input'
import { getOrganizationRepositories } from '@/services/repository'
import { addRepositoryToTeam, getTeamRepositories } from '@/services/team'
import type { Repository } from '@/types/database'
import { toast } from 'sonner'

interface ShareRepositoryToTeamModalProps {
  teamId: string
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onRepositoryAdded: () => void
}

export function ShareRepositoryToTeamModal({
  teamId,
  organizationId,
  isOpen,
  onClose,
  onRepositoryAdded,
}: ShareRepositoryToTeamModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [existingRepoIds, setExistingRepoIds] = useState<Set<string>>(new Set())
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [permission, setPermission] = useState<'read' | 'write' | 'admin'>('read')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen) return

    async function loadData() {
      setLoading(true)
      try {
        const [allRepos, teamRepos] = await Promise.all([
          getOrganizationRepositories(organizationId),
          getTeamRepositories(teamId),
        ])

        setRepositories(allRepos)
        setExistingRepoIds(new Set(teamRepos.map(r => r.id)))
        setSelectedRepos(new Set())
        setSearch('')
      } catch (error) {
        console.error('Failed to load repositories:', error)
        toast.error('Failed to load repositories')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, organizationId, teamId])

  const availableRepos = repositories.filter(
    repo => !existingRepoIds.has(repo.id)
  )

  const filteredRepos = availableRepos.filter(
    repo => repo.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleRepo = (repoId: string) => {
    setSelectedRepos(prev => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedRepos.size === 0) {
      toast.error('Please select at least one repository')
      return
    }

    setSubmitting(true)
    try {
      // Add each selected repository to the team
      await Promise.all(
        Array.from(selectedRepos).map(repoId =>
          addRepositoryToTeam(teamId, repoId, permission)
        )
      )

      toast.success(
        selectedRepos.size === 1
          ? 'Repository shared with team'
          : `${selectedRepos.size} repositories shared with team`
      )
      onRepositoryAdded()
      onClose()
    } catch (error) {
      console.error('Failed to share repositories:', error)
      toast.error('Failed to share repositories')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Repository with Team</DialogTitle>
          <DialogDescription>
            Select repositories from your organization to share with this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Permission Level */}
          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select value={permission} onValueChange={(v) => setPermission(v as 'read' | 'write' | 'admin')}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Read</span>
                    <span className="text-xs text-muted-foreground">Can view and run checklists</span>
                  </div>
                </SelectItem>
                <SelectItem value="write">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Write</span>
                    <span className="text-xs text-muted-foreground">Can edit and create commits</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">Full control including settings</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Icon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="sm" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Repository List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {availableRepos.length === 0
                  ? 'All repositories are already shared with this team'
                  : 'No repositories found'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredRepos.map(repo => (
                  <label
                    key={repo.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedRepos.has(repo.id)}
                      onCheckedChange={() => handleToggleRepo(repo.id)}
                    />
                    <Icon icon={GitForkIcon} className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{repo.title}</div>
                      {repo.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {repo.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedRepos.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedRepos.size} repository{selectedRepos.size !== 1 ? 'ies' : ''} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedRepos.size === 0}
          >
            {submitting ? (
              <>
                <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin mr-2" />
                Sharing...
              </>
            ) : (
              `Share ${selectedRepos.size > 0 ? selectedRepos.size : ''} Repository${selectedRepos.size !== 1 ? 'ies' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
