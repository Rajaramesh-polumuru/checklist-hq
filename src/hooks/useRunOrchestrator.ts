import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentExecutionEngine } from '@/lib/agent/execution-engine';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import type { ChecklistItem, RunProgress } from '@/types/database';

export interface OrchestratorStatus {
  state: 'idle' | 'executing' | 'awaiting_approval' | 'error' | 'success';
  itemId: string | null;
  message: string | null;
  output: Record<string, unknown> | null;
}

interface UseRunOrchestratorProps {
  enabled: boolean;
  currentItem: ChecklistItem | null;
  progress: RunProgress;
  onComplete: (itemId: string, output: Record<string, unknown>, durationMs?: number) => void;
  onError: (itemId: string, error: string) => void;
}

export function useRunOrchestrator({
  enabled,
  currentItem,
  progress,
  onComplete,
  onError,
}: UseRunOrchestratorProps) {
  const [status, setStatus] = useState<OrchestratorStatus>({
    state: 'idle',
    itemId: null,
    message: null,
    output: null,
  });

  const agentSettings = useAgentSettingsStore();
  const engineRef = useRef<AgentExecutionEngine | null>(null);

  // Initialize engine lazily
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AgentExecutionEngine();
    }
  }, []);

  /**
   * Execute an item via AI
   */
  const executeItem = useCallback(
    async (item: ChecklistItem) => {
      if (!engineRef.current) return;

      const startTime = Date.now();
      
      setStatus({
        state: 'executing',
        itemId: item.id,
        message: `Executing via AI...`,
        output: null,
      });

      try {
        // TODO: Pass actual context from previous items
        const context = "Context will be implemented in future update";
        
        const result = await engineRef.current.executeItem(item, context);

        if (!result.success) {
          throw new Error(result.error || 'Unknown execution error');
        }

        const durationMs = Date.now() - startTime;

        // Check verification requirement
        if (item.agent_config?.verification?.type === 'human_review') {
          setStatus({
            state: 'awaiting_approval',
            itemId: item.id,
            message: 'Waiting for verification',
            output: result.output || {},
          });
          return;
        }

        // Auto-complete
        setStatus({
          state: 'success',
          itemId: item.id,
          message: 'Completed',
          output: result.output || null,
        });

        onComplete(item.id, result.output || {}, durationMs);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus({
          state: 'error',
          itemId: item.id,
          message: errorMessage,
          output: null,
        });
        onError(item.id, errorMessage);
      }
    },
    [onComplete, onError]
  );

  /**
   * Auto-execute logic
   */
  useEffect(() => {
    if (!enabled || !currentItem || !agentSettings.autoPilotEnabled) {
      return;
    }

    // Skip if already processing this item or another one
    if (status.state === 'executing') return;
    
    // Skip if pending approval
    if (status.state === 'awaiting_approval') return;

    // Check if item is already completed
    if (progress[currentItem.id]?.completed) {
      return;
    }

    // Check if item has agent config
    if (!currentItem.agent_config) {
      return;
    }

    // Check action type - only some are auto-executable
    const actionType = currentItem.agent_config.action_type;
    if (actionType === 'manual' || actionType === 'approve') {
      return; // Wait for human
    }

    // Execute!
    executeItem(currentItem);
  }, [
    enabled, 
    currentItem, 
    progress, 
    agentSettings.autoPilotEnabled, 
    status.state, 
    executeItem
  ]);

  /**
   * Manual trigger
   */
  const executeManual = useCallback(() => {
    if (currentItem) {
      executeItem(currentItem);
    }
  }, [currentItem, executeItem]);

  /**
   * Approve result (for human_review)
   */
  const approveResult = useCallback(() => {
    if (status.state === 'awaiting_approval' && status.itemId && status.output) {
      onComplete(status.itemId, status.output);
      setStatus(prev => ({ ...prev, state: 'success', message: 'Approved' }));
    }
  }, [status, onComplete]);

  /**
   * Reject result
   */
  const rejectResult = useCallback(() => {
    if (status.state === 'awaiting_approval') {
      setStatus(prev => ({ 
        ...prev, 
        state: 'error', 
        message: 'Result rejected by user' 
      }));
    }
  }, [status]);

  return {
    status,
    executeManual,
    approveResult,
    rejectResult,
  };
}
