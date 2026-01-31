import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChecklistEditor } from '@/components/ChecklistEditor'
import { useChecklistStore } from '@/stores/checklist-store'
import { useAuthStore } from '@/stores/auth-store'
import { ArrowLeft, Save, Play, Globe, Lock, Loader2, Check } from 'lucide-react'
import type { ChecklistContent, Repository, Commit } from '@/types/database'
import {
  createRepositoryWithCommit,
  getRepository,
  getLatestCommit,
  saveRepositoryChanges,
  updateRepository,
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

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isNew = repoId === 'new' || !repoId

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

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || isNew || !repository) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save (2 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true) // true = auto-save (silent)
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isDirty, content, isNew, repository])

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
        // First, update repository metadata if changed
        if (title !== repository.title || isPublic !== repository.is_public) {
          const updatedRepo = await updateRepository(repository.id, {
            title,
            is_public: isPublic,
          })
          setRepository(updatedRepo)
        }

        // Create new commit with changes
        const commit = await saveRepositoryChanges({
          repoId: repository.id,
          content,
          message: isAutoSave ? 'Auto-save' : 'Manual save',
          parentCommitId: latestCommit?.id,
        })

        setLatestCommit(commit)
        resetDirty()
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
  }, [user, isNew, title, isPublic, content, repository, latestCommit, navigate, resetDirty])

  const handleStartRun = () => {
    if (!repository) {
      // Save first if new
      handleSave()
      return
    }
    // TODO: Create a new run and navigate to run mode
    console.log('Starting run for:', repository.id)
  }

  const handleBack = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    navigate('/app')
  }

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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none bg-transparent h-auto p-0 focus-visible:ring-0 w-64"
              placeholder="Checklist title..."
            />
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || (!isDirty && !isNew)}
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

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-sm text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Editor */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <ChecklistEditor />
      </main>
    </div>
  )
}
