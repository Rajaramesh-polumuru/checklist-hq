import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChecklistEditor } from '@/components/ChecklistEditor'
import { VersionHistory } from '@/components/VersionHistory'
import { DiffView } from '@/components/DiffView'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useChecklistStore } from '@/stores/checklist-store'
import { useAuthStore } from '@/stores/auth-store'
import { useDebounce } from '@/hooks/useDebounce'
import { AUTO_SAVE } from '@/lib/constants'
import { ArrowLeft, Save, Play, Globe, Lock, Loader2, Check, History, Pencil, Keyboard } from 'lucide-react'
import type { ChecklistContent, Repository, Commit } from '@/types/database'
import {
  createRepositoryWithCommit,
  getRepository,
  getLatestCommit,
  saveRepositoryChanges,
  updateRepository,
  restoreToCommit,
} from '@/services/repository'

export function Editor() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { content, setContent, isDirty, resetDirty } = useChecklistStore()

  // Repository state
  const [repository, setRepository] = useState<Repository | null>(null)
  const [latestCommit, setLatestCommit] = useState<Commit | null>(null)
  const [title, setTitle] = useState('Untitled Checklist')
  const [isPublic, setIsPublic] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Version history state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [compareCommits, setCompareCommits] = useState<{ commit1: Commit; commit2: Commit } | null>(null)

  // Keyboard shortcuts state
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Input ref for title
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Debounced content for auto-save
  const debouncedContent = useDebounce(content, AUTO_SAVE.debounceMs)

  const isNew = repoId === 'new' || !repoId

  // Check for unsaved changes
  const hasMetadataChanges = repository ? (title !== repository.title || isPublic !== repository.is_public) : false

  // Load existing repository
  useEffect(() => {
    async function loadRepository() {
      if (isNew) {
        // Initialize with empty content for new checklist
        const emptyContent: ChecklistContent = {
          version: '1.0',
          items: {},
        }
        setContent(emptyContent)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch repository
        const repo = await getRepository(repoId!)
        if (!repo) {
          setError('Checklist not found')
          setLoading(false)
          return
        }

        setRepository(repo)
        setTitle(repo.title)
        setIsPublic(repo.is_public)

        // Fetch latest commit
        const commit = await getLatestCommit(repoId!)
        if (commit) {
          setLatestCommit(commit)
          setContent(commit.content)
        } else {
          // No commits yet, start with empty content
          setContent({ version: '1.0', items: {} })
        }
      } catch (err) {
        console.error('Error loading repository:', err)
        setError('Failed to load checklist')
      } finally {
        setLoading(false)
      }
    }

    loadRepository()
  }, [repoId, isNew, setContent])

  // Auto-save functionality with proper debouncing
  useEffect(() => {
    if (!isDirty || isNew || !repository) return

    // Trigger save after content has been debounced
    handleSave(true) // true = auto-save (silent)
  }, [debouncedContent]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!user) {
      setError('You must be logged in to save')
      return
    }

    // Don't show saving indicator for auto-save if already saving
    if (saving) return

    setSaving(true)
    setSaveStatus('saving')

    try {
      if (isNew) {
        // Create new repository with initial commit
        const { repository: newRepo, commit } = await createRepositoryWithCommit({
          ownerId: user.id,
          title,
          isPublic,
          content,
        })

        setRepository(newRepo)
        setLatestCommit(commit)
        resetDirty()
        setSaveStatus('saved')

        // Navigate to the new repository URL
        navigate(`/app/repo/${newRepo.id}`, { replace: true })
      } else if (repository) {
        // Update existing repository
        const updates: Promise<any>[] = []

        // 1. Update metadata if changed
        if (title !== repository.title || isPublic !== repository.is_public) {
          updates.push(
            updateRepository(repository.id, {
              title,
              is_public: isPublic,
            }).then(updatedRepo => setRepository(updatedRepo))
          )
        }

        // 2. Create new commit if content changed
        if (isDirty) {
          updates.push(
            saveRepositoryChanges({
              repoId: repository.id,
              content,
              message: isAutoSave ? 'Auto-save' : 'Manual save',
              parentCommitId: latestCommit?.id,
            }).then(commit => {
              setLatestCommit(commit)
              resetDirty()
            })
          )
        }

        await Promise.all(updates)
        setSaveStatus('saved')
      }

      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save checklist')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [user, isNew, title, isPublic, content, repository, latestCommit, navigate, resetDirty, isDirty])

  const handleStartRun = async () => {
    if (!repository) {
      // Save first if new, then navigate to run
      await handleSave()
      return
    }
    // Navigate to run mode - it will create a new run automatically
    navigate(`/app/run/start/${repository.id}`)
  }

  const handleBack = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    navigate('/app')
  }

  // Version history handlers
  const handleViewVersion = (commit: Commit) => {
    if (!repository) return
    setHistoryOpen(false)
    navigate(`/app/repo/${repository.id}/version/${commit.id}`)
  }

  const handleRestoreVersion = async (commit: Commit) => {
    if (!repository) return

    const confirmRestore = window.confirm(
      `Are you sure you want to restore to this version? This will create a new version with the content from "${commit.message || 'this commit'}".`
    )
    if (!confirmRestore) return

    try {
      setSaving(true)
      const newCommit = await restoreToCommit({
        repoId: repository.id,
        commitId: commit.id,
        latestCommitId: latestCommit?.id,
      })

      setLatestCommit(newCommit)
      setContent(newCommit.content)
      resetDirty()
      setHistoryOpen(false)
    } catch (err) {
      console.error('Error restoring version:', err)
      setError('Failed to restore version')
    } finally {
      setSaving(false)
    }
  }

  const handleCompareVersions = (commit1: Commit, commit2: Commit) => {
    setCompareCommits({ commit1, commit2 })
    setHistoryOpen(false)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts on "?"
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        // Only if not focused on an input
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShowShortcuts(true)
        }
      }

      // Save on Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!saving && (isDirty || hasMetadataChanges)) {
          handleSave(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saving, isDirty, hasMetadataChanges, handleSave])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error && !repository && !isNew) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate('/app')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="group flex items-center gap-2">
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none bg-transparent h-auto p-0 focus-visible:ring-0 w-64 px-2 py-1 rounded hover:bg-accent/50 transition-colors"
                placeholder="Checklist title..."
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 text-muted-foreground"
                onClick={() => titleInputRef.current?.focus()}
                title="Rename checklist"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>

            {/* Save status indicator */}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            )}

            {/* Unsaved changes indicator */}
            {!isNew && !loading && !saving && saveStatus !== 'saved' && (isDirty || hasMetadataChanges) && (
              <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPublic(!isPublic)}
              className="gap-2"
            >
              {isPublic ? (
                <>
                  <Globe className="h-4 w-4" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Private
                </>
              )}
            </Button>

            {/* Keyboard Shortcuts Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="gap-2"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden lg:inline">Shortcuts</span>
            </Button>

            {/* Version History Button */}
            {!isNew && repository && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || (!isNew && !isDirty && !hasMetadataChanges)}
              className={isDirty || hasMetadataChanges ? "border-primary text-primary hover:bg-primary/5" : ""}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
            </Button>

            <Button
              size="sm"
              onClick={handleStartRun}
              disabled={Object.keys(content.items).length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </div>
        </div>
      </header>

      {/* Error banner - Now with ARIA live region */}
      <ErrorBanner error={error} onDismiss={() => setError(null)} priority="polite" />

      {/* Editor */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <ChecklistEditor />
      </main>

      {/* Version History Panel */}
      {repository && (
        <VersionHistory
          repoId={repository.id}
          currentCommitId={latestCommit?.id}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onViewVersion={handleViewVersion}
          onRestoreVersion={handleRestoreVersion}
          onCompareVersions={handleCompareVersions}
        />
      )}

      {/* Diff View Modal */}
      {compareCommits && (
        <DiffView
          commit1={compareCommits.commit1}
          commit2={compareCommits.commit2}
          isOpen={true}
          onClose={() => setCompareCommits(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
