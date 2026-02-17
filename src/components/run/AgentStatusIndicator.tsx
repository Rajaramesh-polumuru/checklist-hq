/**
 * Agent Status Indicator
 * Shows the current state of AI-powered execution
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import {
  Loading02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  BrainIcon,
  RefreshIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { AgentRunnerStatus } from '@/hooks/useAgentRunner';

interface AgentStatusIndicatorProps {
  status: AgentRunnerStatus;
  onExecute?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

export function AgentStatusIndicator({
  status,
  onExecute,
  onRetry,
  compact = false,
}: AgentStatusIndicatorProps) {
  if (status.status === 'idle' && !status.message) {
    return null; // Don't show anything if idle with no message
  }

  return (
    <div className={cn(
      'flex items-center gap-2',
      compact ? 'text-sm' : 'text-base'
    )}>
      {/* Status badge */}
      {status.status === 'processing' && (
        <Badge variant="default" className="gap-1.5 animate-pulse">
          <Icon icon={Loading02Icon} className="h-3.5 w-3.5 animate-spin" />
          {!compact && <span>Thinking...</span>}
        </Badge>
      )}

      {status.status === 'success' && (
        <Badge variant="success" className="gap-1.5">
          <Icon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />
          {!compact && <span>Done via AI</span>}
        </Badge>
      )}

      {status.status === 'error' && (
        <Badge variant="destructive" className="gap-1.5">
          <Icon icon={AlertCircleIcon} className="h-3.5 w-3.5" />
          {!compact && <span>Agent Failed</span>}
        </Badge>
      )}

      {status.status === 'idle' && status.message && (
        <Badge variant="outline" className="gap-1.5">
          <Icon icon={BrainIcon} className="h-3.5 w-3.5" />
          {!compact && <span>Ready</span>}
        </Badge>
      )}

      {/* Status message */}
      {!compact && status.message && (
        <span className={cn(
          'text-sm',
          status.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {status.message}
        </span>
      )}

      {/* Action buttons */}
      {status.status === 'idle' && status.message && onExecute && (
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

      {status.status === 'error' && onRetry && (
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
  status: AgentRunnerStatus['status'];
}) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-1">
      {status === 'processing' && (
        <Icon icon={Loading02Icon} className="h-3 w-3 text-primary animate-spin" />
      )}
      {status === 'success' && (
        <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 text-success" />
      )}
      {status === 'error' && (
        <Icon icon={AlertCircleIcon} className="h-3 w-3 text-destructive" />
      )}
    </div>
  );
}
