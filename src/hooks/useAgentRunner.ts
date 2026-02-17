/**
 * Agent Runner Hook
 * Handles automatic execution of checklist items via AI
 */

import { useState, useEffect, useCallback } from 'react';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import type { ChecklistItem, RunProgress } from '@/types/database';

export interface AgentRunnerStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  itemId: string | null;
  message: string | null;
  output: Record<string, unknown> | null;
}

interface UseAgentRunnerProps {
  enabled: boolean;
  currentItem: ChecklistItem | null;
  progress: RunProgress;
  onComplete: (itemId: string, output: Record<string, unknown>) => void;
  onError: (itemId: string, error: string) => void;
}

export function useAgentRunner({
  enabled,
  currentItem,
  progress,
  onComplete,
  onError,
}: UseAgentRunnerProps) {
  const [status, setStatus] = useState<AgentRunnerStatus>({
    status: 'idle',
    itemId: null,
    message: null,
    output: null,
  });

  const agentSettings = useAgentSettingsStore();

  /**
   * Execute an item via AI
   */
  const executeItem = useCallback(
    async (item: ChecklistItem) => {
      if (!item.agent_config?.enabled) {
        return;
      }

      const provider = item.agent_config.provider || agentSettings.defaultProvider;
      const model = item.agent_config.model || agentSettings.defaultModel;
      const apiKey = agentSettings.getApiKey(provider);

      if (!apiKey) {
        setStatus({
          status: 'error',
          itemId: item.id,
          message: `No API key configured for ${provider}`,
          output: null,
        });
        onError(item.id, `No API key configured for ${provider}`);
        return;
      }

      setStatus({
        status: 'processing',
        itemId: item.id,
        message: `Executing via ${provider}/${model}...`,
        output: null,
      });

      try {
        // Construct prompt
        const systemPrompt = item.agent_config.system_prompt || 'You are a helpful assistant executing a checklist item.';
        const userPrompt = `Complete the following task:\n\n${item.text}${item.details ? `\n\nDetails: ${item.details}` : ''}`;

        // Call LLM API
        const result = await callLLM({
          provider,
          model,
          apiKey,
          systemPrompt,
          userPrompt,
          timeout: item.agent_config.timeout_ms,
        });

        // Mark as complete
        setStatus({
          status: 'success',
          itemId: item.id,
          message: `Completed via ${model}`,
          output: result,
        });

        onComplete(item.id, result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus({
          status: 'error',
          itemId: item.id,
          message: errorMessage,
          output: null,
        });
        onError(item.id, errorMessage);
      }
    },
    [agentSettings, onComplete, onError]
  );

  /**
   * Auto-execute current item if conditions are met
   */
  useEffect(() => {
    if (!enabled || !currentItem || !agentSettings.autoPilotEnabled) {
      return;
    }

    // Check if item is already completed
    if (progress[currentItem.id]?.completed) {
      return;
    }

    // Check if item has agent config enabled
    if (!currentItem.agent_config?.enabled) {
      return;
    }

    // Check if user wants confirmation
    if (agentSettings.confirmBeforeExecution) {
      // Don't auto-execute, wait for manual trigger
      setStatus({
        status: 'idle',
        itemId: currentItem.id,
        message: 'Ready to execute (confirmation required)',
        output: null,
      });
      return;
    }

    // Auto-execute
    executeItem(currentItem);
  }, [enabled, currentItem, progress, agentSettings.autoPilotEnabled, agentSettings.confirmBeforeExecution, executeItem]);

  /**
   * Manual execution trigger
   */
  const executeManual = useCallback(() => {
    if (currentItem) {
      executeItem(currentItem);
    }
  }, [currentItem, executeItem]);

  /**
   * Retry failed execution
   */
  const retry = useCallback(() => {
    if (status.itemId && currentItem?.id === status.itemId) {
      executeItem(currentItem);
    }
  }, [status.itemId, currentItem, executeItem]);

  return {
    status,
    executeManual,
    retry,
  };
}

/**
 * Call LLM API (OpenAI or Anthropic)
 */
async function callLLM({
  provider,
  model,
  apiKey,
  systemPrompt,
  userPrompt,
  timeout,
}: {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  timeout?: number;
}): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    if (provider === 'openai') {
      return await callOpenAI({ model, apiKey, systemPrompt, userPrompt, signal: controller.signal });
    } else {
      return await callAnthropic({ model, apiKey, systemPrompt, userPrompt, signal: controller.signal });
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI({
  model,
  apiKey,
  systemPrompt,
  userPrompt,
  signal,
}: {
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  signal: AbortSignal;
}): Promise<Record<string, unknown>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return {
    provider: 'openai',
    model,
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic({
  model,
  apiKey,
  systemPrompt,
  userPrompt,
  signal,
}: {
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  signal: AbortSignal;
}): Promise<Record<string, unknown>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return {
    provider: 'anthropic',
    model,
    content: data.content[0]?.text || '',
    usage: data.usage,
  };
}
