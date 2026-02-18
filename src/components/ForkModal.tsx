import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { forkRepository, forkRepositoryToTeam, getLatestCommit } from '@/services/repository'
import { getMyOrganizations } from '@/services/organization'
import { getOrganizationTeams } from '@/services/team'
import type { Repository, Commit, ChecklistItem, Organization, Team } from '@/types/database'

interface ForkModalProps {
  repository: Repository | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newRepoId: string, itemCount: number) => void
}

type ForkState = 'idle' | 'loading-preview' | 'ready' | 'forking' | 'success' | 'error'
type ForkTarget = 'personal' | 'team'

interface TeamWithOrg extends Team {
  organization?: Organization
}

export function ForkModal({ repository, isOpen, onClose, onSuccess }: ForkModalProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // State
  const [forkState, setForkState] = useState<ForkState>('idle')
  const [title, setTitle] = useState('')
  const [commit, setCommit] = useState<Commit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newRepoId, setNewRepoId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Fork target state
  const [forkTarget, setForkTarget] = useState<ForkTarget>('personal')
  const [teams, setTeams] = useState<TeamWithOrg[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [loadingTeams, setLoadingTeams] = useState(false)

  // Calculate item count
  const itemCount = commit?.content?.items ? Object.keys(commit.content.items).length : 0
  const headerCount = commit?.content?.items
    ? Object.values(commit.content.items).filter((item: ChecklistItem) => item.type === 'header').length
    : 0

  // Load user's organizations and teams
  const loadOrganizationsAndTeams = useCallback(async () => {
    if (!user) return

    try {
      setLoadingTeams(true)
      const orgs = await getMyOrganizations()

      // Load teams for all organizations
      const allTeams: TeamWithOrg[] = []
      for (const org of orgs) {
        if (org.role === 'owner' || org.role === 'admin' || org.role === 'member') {
          const orgTeams = await getOrganizationTeams(org.id)
          allTeams.push(...orgTeams.map(t => ({ ...t, organization: org })))
        }
      }
      setTeams(allTeams)

      if (allTeams.length > 0) {
        setSelectedTeamId(allTeams[0].id)
      }
    } catch (err) {
      console.error('Error loading organizations:', err)
    } finally {
      setLoadingTeams(false)
    }
  }, [user])

  // Load commit for preview
  const loadCommit = useCallback(async () => {
    if (!repository) return

    try {
      const latestCommit = await getLatestCommit(repository.id)
      console.log('[ForkModal] Loaded commit for preview:', {
        repoId: repository.id,
        commitId: latestCommit?.id,
        itemCount: latestCommit?.content?.items ? Object.keys(latestCommit.content.items).length : 0,
        content: latestCommit?.content,
      })

      if (!latestCommit || !latestCommit.content?.items || Object.keys(latestCommit.content.items).length === 0) {
        console.warn('[ForkModal] Source repository has no items to fork')
        setError('This template has no items to fork. Please try another template.')
        setForkState('error')
        return
      }

      setCommit(latestCommit)
      setForkState('ready')
    } catch (err) {
      console.error('Error loading commit:', err)
      setError('Failed to load checklist preview')
      setForkState('error')
    }
  }, [repository])

  // Reset state when modal opens/closes or repository changes
  useEffect(() => {
    if (isOpen && repository) {
      // Defer state updates to avoid synchronous render warnings
      const timer = setTimeout(() => {
        setForkState('loading-preview')
        setTitle(repository.title)
        setError(null)
        setNewRepoId(null)
        setProgress(0)
        setForkTarget('personal')
        setSelectedTeamId('')
        loadCommit()
        loadOrganizationsAndTeams()
      }, 0)
      return () => clearTimeout(timer)
    } else {
      // Defer reset too
      const timer = setTimeout(() => {
        setForkState('idle')
        setCommit(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, repository, loadCommit, loadOrganizationsAndTeams])

  // Handle fork
  const handleFork = async () => {
    if (!user) {
      onClose()
      navigate('/', { state: { returnTo: window.location.pathname } })
      return
    }

    if (!repository) return

    setForkState('forking')
    setError(null)
    setProgress(10)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90))
      }, 200)

      let repoId: string

      if (forkTarget === 'team' && selectedTeamId) {
        console.log('[ForkModal] Forking repository to team:', {
          sourceRepoId: repository.id,
          targetTeamId: selectedTeamId,
          newTitle: title !== repository.title ? title : undefined,
          originalItemCount: itemCount,
        })

        repoId = await forkRepositoryToTeam({
          sourceRepoId: repository.id,
          targetTeamId: selectedTeamId,
          newTitle: title !== repository.title ? title : undefined,
        })
      } else {
        console.log('[ForkModal] Forking repository to personal:', {
          sourceRepoId: repository.id,
          newOwnerId: user.id,
          newTitle: title !== repository.title ? title : undefined,
          originalItemCount: itemCount,
        })

        repoId = await forkRepository({
          sourceRepoId: repository.id,
          newOwnerId: user.id,
          newTitle: title !== repository.title ? title : undefined,
        })
      }

      console.log('[ForkModal] Fork successful, new repoId:', repoId)

      clearInterval(progressInterval)
      setProgress(100)
      setNewRepoId(repoId)
      setForkState('success')

      // Call success callback
      onSuccess?.(repoId, itemCount)
    } catch (err) {
      console.error('Error forking repository:', err)
      setError(err instanceof Error ? err.message : 'Failed to fork checklist')
      setForkState('error')
    }
  }

  // Navigate to the forked repo
  const handleGoToFork = () => {
    if (newRepoId) {
      onClose()
      if (forkTarget === 'team' && selectedTeamId) {
        const team = teams.find(t => t.id === selectedTeamId)
        if (team) {
          navigate(`/app/orgs/${team.organization_id}/teams/${team.id}`)
          return
        }
      }
      navigate(`/app/repo/${newRepoId}`)
    }
  }

  // Get top-level items for preview
  const getPreviewItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items)
      .filter((item: ChecklistItem) => item.parent === null)
      .sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order)
      .slice(0, 5)
  }

  // Get selected team info
  const getSelectedTeam = () => teams.find(t => t.id === selectedTeamId)

  if (!repository) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon icon={GitForkIcon} className="h-4 w-4 text-primary" />
            </div>
            {forkState === 'success' ? 'Fork Complete!' : 'Fork Checklist'}
          </DialogTitle>
          <DialogDescription>
            {forkState === 'success'
              ? 'Your fork has been created successfully.'
              : 'Create your own copy to customize and run.'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading Preview State */}
        {forkState === 'loading-preview' && (
          <div className="py-8 text-center">
            <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading checklist preview...</p>
          </div>
        )}

        {/* Ready State - Show Preview */}
        {forkState === 'ready' && (
          <div className="space-y-4">
            {/* Source Info */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon icon={CheckListIcon} className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{repository.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {itemCount} items
                    </Badge>
                    {headerCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {headerCount} sections
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Items */}
              {getPreviewItems().length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <ul className="space-y-1">
                    {getPreviewItems().map((item) => (
                      <li key={item.id} className="text-xs flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                        <span className={item.type === 'header' ? 'font-medium' : ''}>
                          {item.text || 'Untitled item'}
                        </span>
                      </li>
                    ))}
                    {itemCount > 5 && (
                      <li className="text-xs text-muted-foreground pl-3">
                        + {itemCount - 5} more items...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Arrow Divider */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Icon icon={Copy01Icon} className="h-4 w-4" />
              <Icon icon={ArrowRight01Icon} className="h-4 w-4" />
            </div>

            {/* Fork Target Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Fork to</Label>
              <RadioGroup
                value={forkTarget}
                onValueChange={(v: string) => setForkTarget(v as ForkTarget)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="personal"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    forkTarget === 'personal'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="personal" id="personal" className="sr-only" />
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon icon={UserIcon} className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Personal</p>
                    <p className="text-xs text-muted-foreground">Your account</p>
                  </div>
                </Label>

                <Label
                  htmlFor="team"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    forkTarget === 'team'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/50'
                  } ${teams.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RadioGroupItem
                    value="team"
                    id="team"
                    className="sr-only"
                    disabled={teams.length === 0}
                  />
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Icon icon={UserGroupIcon} className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Team</p>
                    <p className="text-xs text-muted-foreground">
                      {loadingTeams ? 'Loading...' : teams.length === 0 ? 'No teams' : `${teams.length} available`}
                    </p>
                  </div>
                </Label>
              </RadioGroup>

              {/* Team Selector */}
              {forkTarget === 'team' && teams.length > 0 && (
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Icon icon={UserGroupIcon} className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{team.name}</span>
                          {team.organization && (
                            <span className="text-xs text-muted-foreground">
                              ({team.organization.name})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* New Fork Info */}
            <div className="space-y-3">
              <div>
                <label htmlFor="fork-title" className="text-sm font-medium mb-1.5 block">
                  Your Fork Title
                </label>
                <Input
                  id="fork-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your fork"
                  className="h-10"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon icon={SparklesIcon} className="h-3.5 w-3.5 text-primary" />
                <span>
                  All {itemCount} items will be copied to{' '}
                  {forkTarget === 'team' && getSelectedTeam()
                    ? `"${getSelectedTeam()?.name}" team`
                    : 'your personal account'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Forking State */}
        {forkState === 'forking' && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon icon={GitForkIcon} className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="font-medium mb-1">Creating your fork...</p>
              <p className="text-sm text-muted-foreground">
                Copying {itemCount} items{' '}
                {forkTarget === 'team' && getSelectedTeam()
                  ? `to "${getSelectedTeam()?.name}" team`
                  : 'to your account'}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success State */}
        {forkState === 'success' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Icon icon={CheckmarkCircle02Icon} className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium text-lg mb-1">Fork Created!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Successfully copied {itemCount} items to "{title}"
              {forkTarget === 'team' && getSelectedTeam() && (
                <span className="block mt-1">
                  in <strong>{getSelectedTeam()?.name}</strong> team
                </span>
              )}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
              <Icon icon={CheckListIcon} className="h-4 w-4 text-primary" />
              <span>{itemCount} items ready to customize</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {forkState === 'error' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Icon icon={AlertCircleIcon} className="h-6 w-6 text-red-600" />
            </div>
            <p className="font-medium text-lg mb-1">Fork Failed</p>
            <p className="text-sm text-red-600 mb-4">
              {error || 'An unexpected error occurred'}
            </p>
            <Button variant="outline" size="sm" onClick={loadCommit}>
              Try Again
            </Button>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          {forkState === 'ready' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleFork}
                disabled={!title.trim() || (forkTarget === 'team' && !selectedTeamId)}
              >
                <Icon icon={GitForkIcon} className="mr-2 h-4 w-4" />
                Create Fork
              </Button>
            </>
          )}
          {forkState === 'success' && (
            <Button onClick={handleGoToFork} className="w-full sm:w-auto">
              <Icon icon={ArrowRight01Icon} className="mr-2 h-4 w-4" />
              Open My Fork
            </Button>
          )}
          {forkState === 'error' && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
