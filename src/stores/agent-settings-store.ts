/**
 * Agent Settings Store
 * Manages API keys and auto-pilot configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentSettings {
  // API Keys (stored in localStorage - user's responsibility to keep secure)
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  
  // Default preferences
  defaultProvider: 'openai' | 'anthropic';
  defaultModel: string;
  
  // Auto-pilot behavior
  autoPilotEnabled: boolean; // Global toggle
  confirmBeforeExecution: boolean; // Ask before running each item
  continueOnError: boolean; // Keep going if one item fails
}

interface AgentSettingsStore extends AgentSettings {
  // Actions
  setOpenAIKey: (key: string | null) => void;
  setAnthropicKey: (key: string | null) => void;
  setDefaultProvider: (provider: 'openai' | 'anthropic') => void;
  setDefaultModel: (model: string) => void;
  setAutoPilotEnabled: (enabled: boolean) => void;
  setConfirmBeforeExecution: (confirm: boolean) => void;
  setContinueOnError: (continueOnError: boolean) => void;
  
  // Helpers
  hasApiKey: () => boolean;
  getApiKey: (provider: 'openai' | 'anthropic') => string | null;
}

export const useAgentSettingsStore = create<AgentSettingsStore>()(
  persist(
    (set, get) => ({
      // Default state
      openaiApiKey: null,
      anthropicApiKey: null,
      defaultProvider: 'openai',
      defaultModel: 'gpt-4',
      autoPilotEnabled: false,
      confirmBeforeExecution: true,
      continueOnError: false,

      // Actions
      setOpenAIKey: (key) => set({ openaiApiKey: key }),
      setAnthropicKey: (key) => set({ anthropicApiKey: key }),
      setDefaultProvider: (provider) => set({ defaultProvider: provider }),
      setDefaultModel: (model) => set({ defaultModel: model }),
      setAutoPilotEnabled: (enabled) => set({ autoPilotEnabled: enabled }),
      setConfirmBeforeExecution: (confirm) => set({ confirmBeforeExecution: confirm }),
      setContinueOnError: (continueOnError) => set({ continueOnError }),

      // Helpers
      hasApiKey: () => {
        const state = get();
        return !!state.openaiApiKey || !!state.anthropicApiKey;
      },
      
      getApiKey: (provider) => {
        const state = get();
        return provider === 'openai' ? state.openaiApiKey : state.anthropicApiKey;
      },
    }),
    {
      name: 'agent-settings-storage',
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          // ── Migrate legacy chq_* localStorage keys into zustand store ──
          // ProviderKeyManager previously wrote to these keys directly.
          // This one-time migration ensures a single source of truth.
          if (typeof window === 'undefined') return;
          const legacyOpenAI = localStorage.getItem('chq_openai_key');
          const legacyAnthropic = localStorage.getItem('chq_anthropic_key');

          if (legacyOpenAI && !state.openaiApiKey) {
            state.setOpenAIKey(legacyOpenAI);
          }
          if (legacyAnthropic && !state.anthropicApiKey) {
            state.setAnthropicKey(legacyAnthropic);
          }

          // Clean up legacy keys after migration
          if (legacyOpenAI) localStorage.removeItem('chq_openai_key');
          if (legacyAnthropic) localStorage.removeItem('chq_anthropic_key');
        };
      },
    }
  )
);
