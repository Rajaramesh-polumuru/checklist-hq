// ── Progress stages ──────────────────────────────────────────────────────────

export type ProgressStage =
  | 'checking-capabilities'
  | 'downloading'
  | 'initializing'
  | 'tokenizing'
  | 'generating'

export interface ProgressPayload {
  stage: ProgressStage
  /** 0–100 percentage; NaN when indeterminate */
  progress: number
  loaded?: number   // bytes downloaded so far
  total?: number    // total bytes (undefined until response headers arrive)
  speed?: number    // bytes/sec (rolling 3s window)
  fileName?: string // e.g. "pytorch_model.onnx"
  statusText?: string
}

// ── Worker Commands (Host → Worker) ─────────────────────────────────────────

export interface LoadModelCommand {
  type: 'LOAD_MODEL'
  modelId: string
  backend: 'webgpu' | 'wasm'
}

export interface RunInferenceCommand {
  type: 'RUN_INFERENCE'
  text: string
  title?: string
  description?: string
}

export interface CancelCommand {
  type: 'CANCEL'
}

export type WorkerCommand = LoadModelCommand | RunInferenceCommand | CancelCommand

// ── Worker Events (Worker → Host) ────────────────────────────────────────────

export interface WorkerProgressEvent {
  type: 'PROGRESS'
  payload: ProgressPayload
}

export interface WorkerModelReadyEvent {
  type: 'MODEL_READY'
  backend: 'webgpu' | 'wasm'
  fromCache: boolean
}

export interface WorkerResultEvent {
  type: 'RESULT'
  lines: RawParsedLine[]
  parseTimeMs: number
}

export interface WorkerErrorEvent {
  type: 'ERROR'
  message: string
  /** Helps the hook decide whether to offer retry or fallback */
  category: 'download' | 'init' | 'inference' | 'cancelled'
}

export type WorkerEvent =
  | WorkerProgressEvent
  | WorkerModelReadyEvent
  | WorkerResultEvent
  | WorkerErrorEvent

// ── Intermediate parse structure ─────────────────────────────────────────────

/** Extracted line before UUID assignment (produced by worker, consumed by main thread) */
export interface RawParsedLine {
  text: string
  isHeader: boolean
  /** 0 = root item, 1 = child item */
  indent: number
  details?: string
}
