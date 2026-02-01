import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChecklistEditor } from '@/components/ChecklistEditor'
import { VersionHistory } from '@/components/VersionHistory'
import { DiffView } from '@/components/DiffView'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { ShareSettingsModal } from '@/components/ShareSettingsModal'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useChecklistStore } from '@/stores/checklist-store'
import { useAuthStore } from '@/stores/auth-store'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsMobile } from '@/hooks/useMobile'
import { AUTO_SAVE } from '@/lib/constants'
import {
  ArrowLeft,
  Save,
  Play,
  Globe,
  Lock,
  Loader2,
  History,
  Pencil,
  Keyboard,
  GitFork,
  ListChecks,
  Cloud,
  CloudOff,
  Share2,
  MoreVertical
} from 'lucide-react'
import type { ChecklistContent, Repository, Commit } from '@/types/database'
import {
  createRepositoryWithCommit,
  getRepository,
  getLatestCommit,
  saveRepositoryChanges,
  updateRepository,
  restoreToCommit,
  deleteRepository,
} from '@/services/repository'

export function Editor() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { content, setContent, isDirty, resetDirty } = useChecklistStore()
  const isMobile = useIsMobile()

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  // Share modal state
  const [shareOpen, setShareOpen] = useState(false)

  // Input ref for title
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Debounced content for auto-save
  const debouncedContent = useDebounce(content, AUTO_SAVE.debounceMs)

  const isNew = repoId === 'new' || !repoId

  // Check for unsaved changes
  const hasMetadataChanges = repository ? (title !== repository.title || isPublic !== repository.is_public) : false

  // Item count
  const itemCount = Object.keys(content.items).length

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
        <div className="text-center animate-fade-in">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ListChecks className="h-6 w-6 text-primary" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading checklist...</p>
        </div>
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
      {/* Header - Mobile optimized */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className={`container mx-auto px-4 flex items-center justify-between ${isMobile ? 'h-12' : 'h-14'}`}>
          {/* Left side: Back + Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={`shrink-0 ${isMobile ? 'h-10 w-10' : ''}`}
            >
              <ArrowLeft className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>

            {/* Brand - hide on mobile */}
            {!isMobile && (
              <>
                <Link to="/app" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GitFork className="h-3.5 w-3.5 text-primary" />
                  </div>
                </Link>
                <div className="h-4 w-px bg-border hidden sm:block" />
              </>
            )}

            {/* Title - wider on mobile */}
            <div className="group flex items-center gap-1 flex-1 min-w-0">
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`font-semibold border-none bg-transparent h-auto p-0 focus-visible:ring-0 px-2 py-1 rounded hover:bg-accent/50 transition-colors min-w-0 ${isMobile ? 'text-base flex-1' : 'text-base w-44 sm:w-56'
                  }`}
                placeholder="Checklist title..."
              />
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0"
                  onClick={() => titleInputRef.current?.focus()}
                  title="Rename checklist"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Status indicators - desktop only */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {saveStatus === 'saved' && (
                  <Badge variant="success" className="gap-1 text-xs animate-fade-in">
                    <Cloud className="h-3 w-3" />
                    Saved
                  </Badge>
                )}
                {saveStatus === 'saving' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </Badge>
                )}
                {saveStatus === 'error' && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <CloudOff className="h-3 w-3" />
                    Error
                  </Badge>
                )}
                {!isNew && !loading && !saving && saveStatus === 'idle' && (isDirty || hasMetadataChanges) && (
                  <Badge variant="warning" className="text-xs">
                    Unsaved
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop-only actions */}
            {!isMobile && (
              <>
                {/* Item count */}
                <span className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>

                {/* Share Button */}
                {!isNew && repository && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShareOpen(true)}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Share</span>
                  </Button>
                )}

                {/* Privacy toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  title={isPublic ? 'Public: Anyone can view' : 'Private: Only you can access'}
                >
                  {isPublic ? (
                    <>
                      <Globe className="h-4 w-4 text-success" />
                      <span className="hidden sm:inline text-xs">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Private</span>
                    </>
                  )}
                </Button>

                {/* Keyboard Shortcuts */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShortcuts(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>

                {/* Version History */}
                {!isNew && repository && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHistoryOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Version history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}

                <div className="h-4 w-px bg-border mx-1" />
              </>
            )}

            {/* Mobile overflow menu */}
            {isMobile && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="h-10 w-10 text-muted-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-xl shadow-lg py-2 min-w-[180px] animate-fade-in">
                      <button
                        onClick={() => { setIsPublic(!isPublic); setMobileMenuOpen(false) }}
                        className="w-full px-4 py-3 text-left text-base hover:bg-accent flex items-center gap-3"
                      >
                        {isPublic ? <Globe className="h-5 w-5 text-success" /> : <Lock className="h-5 w-5" />}
                        {isPublic ? 'Make Private' : 'Make Public'}
                      </button>
                      {!isNew && repository && (
                        <>
                          <button
                            onClick={() => { setShareOpen(true); setMobileMenuOpen(false) }}
                            className="w-full px-4 py-3 text-left text-base hover:bg-accent flex items-center gap-3"
                          >
                            <Share2 className="h-5 w-5" />
                            Share
                          </button>
                          <button
                            onClick={() => { setHistoryOpen(true); setMobileMenuOpen(false) }}
                            className="w-full px-4 py-3 text-left text-base hover:bg-accent flex items-center gap-3"
                          >
                            <History className="h-5 w-5" />
                            Version History
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Save button - always visible but compact on mobile */}
            <Button
              variant="outline"
              size={isMobile ? "icon" : "sm"}
              onClick={() => handleSave(false)}
              disabled={saving || (!isNew && !isDirty && !hasMetadataChanges)}
              className={`${isMobile ? 'h-10 w-10' : ''} ${isDirty || hasMetadataChanges ? "border-primary text-primary hover:bg-primary/5" : ""}`}
            >
              {saving ? (
                <Loader2 className={`animate-spin ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              ) : (
                <>
                  <Save className={isMobile ? "h-5 w-5" : "mr-1.5 h-4 w-4"} />
                  {!isMobile && <span className="hidden sm:inline">{isNew ? 'Create' : 'Save'}</span>}
                </>
              )}
            </Button>

            {/* Run button - always visible */}
            <Button
              size={isMobile ? "icon" : "sm"}
              onClick={handleStartRun}
              disabled={itemCount === 0}
              className={isMobile ? 'h-10 w-10' : ''}
            >
              <Play className={isMobile ? "h-5 w-5" : "mr-1.5 h-4 w-4"} />
              {!isMobile && <span className="hidden sm:inline">Run</span>}
            </Button>
          </div>
        </div>
      </header>

      {/* Error banner - Now with ARIA live region */}
      <ErrorBanner error={error} onDismiss={() => setError(null)} priority="polite" />

      {/* Editor */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
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

      {/* Share Settings Modal */}
      {repository && (
        <ShareSettingsModal
          repository={{ ...repository, is_public: isPublic }}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          onVisibilityChange={async (newIsPublic) => {
            setIsPublic(newIsPublic)
            await updateRepository(repository.id, { is_public: newIsPublic })
            setRepository({ ...repository, is_public: newIsPublic })
          }}
          onDelete={async () => {
            await deleteRepository(repository.id)
            navigate('/app')
          }}
        />
      )}
    </div>
  )
}
