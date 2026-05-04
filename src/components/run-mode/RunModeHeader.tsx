import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SyncIndicator } from '@/components/SyncIndicator'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import MoreVerticalIcon from '@hugeicons/core-free-icons/MoreVerticalIcon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import PauseIcon from '@hugeicons/core-free-icons/PauseIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import DashboardBrowsingIcon from '@hugeicons/core-free-icons/DashboardBrowsingIcon'
import { cn } from '@/lib/utils'
import type { Repository, Run } from '@/types/database'

interface RunModeHeaderProps {
  repository: Repository | null
  run: Run | null
  completedItems: number
  totalItems: number
  progressPercent: number
  isComplete: boolean
  completing: boolean
  isPauseLoading: boolean
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onRestart: () => void
  onSwitchView: () => void
  /** Persist a new run name. Should resolve once the server has confirmed. */
  onRename?: (newName: string) => Promise<void>
  syncConnected: boolean
  otherDevices: Array<{
    device_id: string
    device_name: string | null
    user_id: string
    last_seen_at: string
    isCurrentDevice: boolean
  }>
  lastSyncedAt: Date | null
  syncError: string | null
}

export function RunModeHeader({
  repository,
  run,
  completedItems,
  totalItems,
  progressPercent,
  isComplete,
  completing,
  isPauseLoading,
  onPause,
  onResume,
  onComplete,
  onRestart,
  onSwitchView,
  onRename,
  syncConnected,
  otherDevices,
  lastSyncedAt,
  syncError,
}: RunModeHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  const handleStartRenaming = () => {
    setEditName(run?.name || repository?.title || '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!run || isSavingName) return
    const trimmed = editName.trim()
    if (!trimmed) return
    // No-op if unchanged.
    if (trimmed === (run.name || '')) {
      setIsEditingName(false)
      return
    }
    if (!onRename) {
      // Caller didn't wire up persistence — close the input rather than
      // pretending to save.
      setIsEditingName(false)
      return
    }
    setIsSavingName(true)
    try {
      await onRename(trimmed)
      setIsEditingName(false)
    } catch (err) {
      console.error('Error renaming run:', err)
      // Leave the input open so the user can retry.
    } finally {
      setIsSavingName(false)
    }
  }

  const handleCancelRenaming = () => {
    setIsEditingName(false)
  }

  return (
    <>
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {/* Back button */}
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
            <Link to={repository ? `/app/repo/${repository.id}` : '/app'}>
              <Icon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </Link>
          </Button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSavingName}
                  className="h-8 w-[200px] sm:w-[300px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelRenaming()
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                  onClick={handleSaveName}
                  disabled={isSavingName || !editName.trim()}
                >
                  <Icon icon={isSavingName ? Loading02Icon : Tick01Icon} className={cn('h-4 w-4', isSavingName && 'animate-spin')} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleCancelRenaming}
                >
                  <Icon icon={Cancel01Icon} className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={handleStartRenaming}>
                <h1 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                  {run?.name || repository?.title || 'Checklist Run'}
                </h1>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                  aria-label="Rename run"
                >
                  <Icon icon={PencilEdit02Icon} size="xs" />
                </button>
              </div>
            )}
          </div>

          {/* Sync indicator */}
          {!isComplete && (
            <SyncIndicator
              isConnected={syncConnected}
              otherDevices={otherDevices}
              lastSyncedAt={lastSyncedAt}
              syncError={syncError}
              compact
            />
          )}

          {/* Progress count */}
          <div className="flex items-center gap-1 text-sm shrink-0">
            <span className="font-bold text-primary tabular-nums">{completedItems}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground tabular-nums">{totalItems}</span>
          </div>

          {/* Primary action */}
          {isComplete ? (
            <Button onClick={onRestart} variant="outline" size="sm" className="gap-2 shrink-0">
              <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
              <span className="hidden sm:inline">Run Again</span>
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              disabled={completing || completedItems < totalItems}
              size="sm"
              className="gap-2 shrink-0"
            >
              {completing ? (
                <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
              ) : (
                <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Complete</span>
            </Button>
          )}

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Icon icon={MoreVerticalIcon} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {run && !isComplete && (
                <>
                  {run.status === 'paused' ? (
                    <DropdownMenuItem onClick={onResume} disabled={isPauseLoading}>
                      <Icon icon={isPauseLoading ? Loading02Icon : PlayIcon} className={cn("h-4 w-4 mr-2", isPauseLoading && "animate-spin")} />
                      Resume
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onPause} disabled={isPauseLoading}>
                      <Icon icon={isPauseLoading ? Loading02Icon : PauseIcon} className={cn("h-4 w-4 mr-2", isPauseLoading && "animate-spin")} />
                      Pause
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onSwitchView}>
                <Icon icon={DashboardBrowsingIcon} className="h-4 w-4 mr-2" />
                Detailed View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Thin progress bar — matches the editor's progress bar convention
          (single-color subtle gradient on the brand primary). When the run
          is fully complete we shade to success so the bar reads as "done". */}
      <div
        className="h-1 bg-muted/50"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            isComplete
              ? 'bg-success'
              : 'bg-gradient-to-r from-primary/80 to-primary',
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </>
  )
}
