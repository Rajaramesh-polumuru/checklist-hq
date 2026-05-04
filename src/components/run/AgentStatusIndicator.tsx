/**
 * Agent Status Indicator
 * Shows the current state of AI-powered execution
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import BrainIcon from '@hugeicons/core-free-icons/BrainIcon'
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import ThumbsUpIcon from '@hugeicons/core-free-icons/ThumbsUpIcon'
import { cn } from '@/lib/utils';
import type { OrchestratorStatus } from '@/hooks/useRunOrchestrator';

interface AgentStatusIndicatorProps {
  status: OrchestratorStatus;
  onExecute?: () => void;
  onRetry?: () => void;
  onApprove?: () => void;
  compact?: boolean;
}

export function AgentStatusIndicator({
  status,
  onExecute,
  onRetry,
  onApprove,
  compact = false,
}: AgentStatusIndicatorProps) {
  if (status.state === 'idle' && !status.message) {
    return null; // Don't show anything if idle with no message
  }

  return (
    <div className={cn(
      'flex items-center gap-2',
      compact ? 'text-sm' : 'text-base'
    )}>
      {/* Status badge */}
      {status.state === 'executing' && (
        <Badge variant="default" className="gap-1.5 animate-pulse">
          <Icon icon={Loading02Icon} className="h-3.5 w-3.5 animate-spin" />
          {!compact && <span>Thinking...</span>}
        </Badge>
      )}

      {status.state === 'success' && (
        <Badge variant="success" className="gap-1.5">
          <Icon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />
          {!compact && <span>Done via AI</span>}
        </Badge>
      )}

      {status.state === 'awaiting_approval' && (
        <Badge variant="warning" className="gap-1.5">
          <Icon icon={BrainIcon} className="h-3.5 w-3.5" />
          {!compact && <span>Review Needed</span>}
        </Badge>
      )}

      {status.state === 'error' && (
        <Badge variant="destructive" className="gap-1.5">
          <Icon icon={AlertCircleIcon} className="h-3.5 w-3.5" />
          {!compact && <span>Agent Failed</span>}
        </Badge>
      )}

      {status.state === 'idle' && status.message && (
        <Badge variant="outline" className="gap-1.5">
          <Icon icon={BrainIcon} className="h-3.5 w-3.5" />
          {!compact && <span>Ready</span>}
        </Badge>
      )}

      {/* Status message */}
      {!compact && status.message && (
        <span className={cn(
          'text-sm',
          status.state === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {status.message}
        </span>
      )}

      {/* Action buttons */}
      {status.state === 'idle' && status.message && onExecute && (
        <Button
          onClick={onExecute}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Icon icon={PlayIcon} className="h-4 w-4" />
          Execute
        </Button>
      )}

      {status.state === 'awaiting_approval' && onApprove && (
        <Button
          onClick={onApprove}
          size="sm"
          variant="default"
          className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
        >
          <Icon icon={ThumbsUpIcon} className="h-4 w-4" />
          Approve
        </Button>
      )}

      {status.state === 'error' && onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Icon icon={RefreshIcon} className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Compact variant for use in run items
 */
export function AgentStatusBadge({
  status,
}: {
  status: OrchestratorStatus['state'];
}) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-1">
      {status === 'executing' && (
        <Icon icon={Loading02Icon} className="h-3 w-3 text-primary animate-spin" />
      )}
      {status === 'success' && (
        <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 text-success" />
      )}
      {status === 'awaiting_approval' && (
        <Icon icon={ThumbsUpIcon} className="h-3 w-3 text-warning" />
      )}
      {status === 'error' && (
        <Icon icon={AlertCircleIcon} className="h-3 w-3 text-destructive" />
      )}
    </div>
  );
}
