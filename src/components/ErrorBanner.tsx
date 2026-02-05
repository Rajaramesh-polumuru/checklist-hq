import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface ErrorBannerProps {
  error: string | null
  onDismiss: () => void
  className?: string
  /**
   * ARIA live region politeness level
   * - 'assertive': Interrupts screen reader immediately (use for critical errors)
   * - 'polite': Waits for screen reader to finish current announcement (default)
   */
  priority?: 'assertive' | 'polite'
}

/**
 * Accessible error banner component
 *
 * Features:
 * - ARIA live region for screen reader announcements
 * - Role="alert" for critical errors
 * - Dismissible with keyboard support
 * - Consistent styling with design system
 *
 * @example
 * <ErrorBanner
 *   error={error}
 *   onDismiss={() => setError(null)}
 *   priority="assertive"
 * />
 */
export function ErrorBanner({
  error,
  onDismiss,
  className,
  priority = 'polite',
}: ErrorBannerProps) {
  if (!error) return null

  return (
    <div
      role="alert"
      aria-live={priority}
      aria-atomic="true"
      className={cn(
        'bg-destructive/10 border-b border-destructive/20 px-4 py-3',
        'flex items-center justify-between gap-4',
        className
      )}
    >
      <p className="text-sm text-destructive flex-1">{error}</p>
      <button
        onClick={onDismiss}
        className={cn(
          'text-destructive hover:text-destructive/80',
          'focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2',
          'rounded-sm p-1 transition-colors',
          'min-w-[44px] min-h-[44px] flex items-center justify-center'
        )}
        aria-label="Dismiss error"
      >
        <Icon icon={Cancel01Icon} className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  )
}

/**
 * Success banner component (same API as ErrorBanner but for success messages)
 */
export function SuccessBanner({
  message,
  onDismiss,
  className,
}: {
  message: string | null
  onDismiss: () => void
  className?: string
}) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'bg-success/10 border-b border-success/20 px-4 py-3',
        'flex items-center justify-between gap-4',
        className
      )}
    >
      <p className="text-sm text-success flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className={cn(
          'text-success hover:text-success/80',
          'focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2',
          'rounded-sm p-1 transition-colors',
          'min-w-[44px] min-h-[44px] flex items-center justify-center'
        )}
        aria-label="Dismiss message"
      >
        <Icon icon={Cancel01Icon} className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  )
}
