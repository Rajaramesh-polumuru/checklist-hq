import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Run } from '@/types/database'

interface RunTimerProps {
  run: Run
  initialDurationMs?: number
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  className?: string
  showControls?: boolean
  compact?: boolean
}

/**
 * Format milliseconds to HH:MM:SS or MM:SS
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function RunTimer({
  run,
  initialDurationMs = 0,
  onPause,
  onResume,
  className,
  showControls = true,
  compact = false,
}: RunTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(initialDurationMs)
  const [isLoading, setIsLoading] = useState(false)

  const isPaused = run.status === 'paused'
  const isActive = run.status === 'active'
  const isCompleted = run.status === 'completed'

  // Track elapsed time when active
  useEffect(() => {
    if (!isActive) {
      // If paused or completed, just set the initial duration
      setElapsedMs(initialDurationMs)
      return
    }

    // Set initial duration
    setElapsedMs(initialDurationMs)

    // Start timer
    const startTime = Date.now()
    const interval = setInterval(() => {
      setElapsedMs(initialDurationMs + (Date.now() - startTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, initialDurationMs])

  // Handle pause
  const handlePause = useCallback(async () => {
    if (isLoading || !isActive) return

    setIsLoading(true)
    try {
      await onPause()
    } finally {
      setIsLoading(false)
    }
  }, [isActive, isLoading, onPause])

  // Handle resume
  const handleResume = useCallback(async () => {
    if (isLoading || !isPaused) return

    setIsLoading(true)
    try {
      await onResume()
    } finally {
      setIsLoading(false)
    }
  }, [isPaused, isLoading, onResume])

  // Compact display (just time)
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm', className)}>
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn(
          'font-mono tabular-nums',
          isPaused && 'text-muted-foreground',
          isActive && 'text-foreground'
        )}>
          {formatTime(elapsedMs)}
        </span>
        {isPaused && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            PAUSED
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Timer Display */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
        isPaused && 'bg-warning/10 text-warning',
        isActive && 'bg-primary/10 text-primary',
        isCompleted && 'bg-success/10 text-success'
      )}>
        <Clock className="h-4 w-4" />
        <span className="font-mono text-lg font-semibold tabular-nums">
          {formatTime(elapsedMs)}
        </span>
      </div>

      {/* Pause/Resume Controls */}
      {showControls && !isCompleted && (
        <div className="flex items-center gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
              Pause
            </Button>
          )}
          {isPaused && (
            <Button
              variant="default"
              size="sm"
              onClick={handleResume}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Resume
            </Button>
          )}
        </div>
      )}

      {/* Status Badge */}
      {isPaused && (
        <Badge variant="warning" className="text-xs">
          Paused
        </Badge>
      )}
    </div>
  )
}

// Utility functions are only used internally
