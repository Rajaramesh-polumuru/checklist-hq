export type LocalModelBackend = 'webgpu' | 'wasm'
export type LocalModelTask = 'text2text-generation'

export interface LocalModelConfig {
  id: string
  name: string
  description: string
  sizeBytes: number
  sizeLabelMB: string
  backendPreference: LocalModelBackend[]
  task: LocalModelTask
  /** Soft character limit before tokenizer truncation */
  maxInputChars: number
  promptPrefix: string
  promptSuffix: string
}

const MB = 1024 * 1024

export const LOCAL_MODELS: Record<string, LocalModelConfig> = {
  'flan-t5-small': {
    id: 'Xenova/flan-t5-small',
    name: 'Fast (flan-T5 small)',
    description: 'Best for short documents. Fast inference, ~80 MB download.',
    sizeBytes: 80 * MB,
    sizeLabelMB: '~80 MB',
    backendPreference: ['webgpu', 'wasm'],
    task: 'text2text-generation',
    maxInputChars: 2000,
    promptPrefix:
      'Extract a numbered list of actionable checklist steps from this document:\n\n',
    promptSuffix: '\n\nSteps:',
  },
  'flan-t5-base': {
    id: 'Xenova/flan-t5-base',
    name: 'Balanced (flan-T5 base)',
    description: 'Better structure extraction on medium documents. ~250 MB download.',
    sizeBytes: 250 * MB,
    sizeLabelMB: '~250 MB',
    backendPreference: ['webgpu', 'wasm'],
    task: 'text2text-generation',
    maxInputChars: 3000,
    promptPrefix:
      'Extract a numbered list of actionable checklist steps from this document:\n\n',
    promptSuffix: '\n\nSteps:',
  },
} as const

export type LocalModelKey = keyof typeof LOCAL_MODELS

export const DEFAULT_LOCAL_MODEL: LocalModelKey = 'flan-t5-small'
