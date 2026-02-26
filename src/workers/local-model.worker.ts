/// <reference lib="webworker" />
import { pipeline, env } from '@huggingface/transformers'
import type {
  WorkerCommand,
  WorkerEvent,
  ProgressPayload,
  RawParsedLine,
} from '@/lib/local-model/types'
import { LOCAL_MODELS } from '@/lib/local-model/model-config'

// Use browser cache (OPFS) so models persist across sessions
env.useBrowserCache = true
// We are already in a worker — no need to spawn another proxy worker
// @ts-expect-error backends is not fully typed
env.backends.onnx.wasm.proxy = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let currentPipeline: any = null
let cancelled = false

function post(event: WorkerEvent) {
  self.postMessage(event)
}

function postProgress(payload: ProgressPayload) {
  post({ type: 'PROGRESS', payload })
}

// ── Speed calculator (rolling 3s window) ─────────────────────────────────────

class SpeedCalculator {
  private samples: { ts: number; bytes: number }[] = []
  private readonly windowMs = 3000

  record(bytes: number) {
    const now = Date.now()
    this.samples = this.samples.filter(s => now - s.ts < this.windowMs)
    this.samples.push({ ts: now, bytes })
  }

  get bytesPerSecond(): number {
    if (this.samples.length < 2) return 0
    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const deltaMs = last.ts - first.ts
    if (deltaMs === 0) return 0
    const deltaBytes = last.bytes - first.bytes
    return (deltaBytes / deltaMs) * 1000
  }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildLocalPrompt(
  text: string,
  modelId: string,
  title?: string,
  description?: string,
): string {
  const config = Object.values(LOCAL_MODELS).find(m => m.id === modelId)
  const maxChars = config?.maxInputChars ?? 2000
  const truncated = text.slice(0, maxChars)

  let contextLine = ''
  if (title) contextLine += `Title: ${title}. `
  if (description) contextLine += `Purpose: ${description}. `

  const prefix = config?.promptPrefix ??
    'Extract a numbered list of actionable checklist steps from this document:\n\n'
  const suffix = config?.promptSuffix ?? '\n\nSteps:'

  return (
    `${prefix}` +
    `${contextLine}` +
    `Each step should be a single clear action. Use numbered lines only.\n\n` +
    `Document:\n${truncated}` +
    `${suffix}`
  )
}

// ── Output post-processor ─────────────────────────────────────────────────────

const NUMBERED = /^(\d+)[.)]\s+(.+)$/
const LETTERED = /^[a-zA-Z][.)]\s+(.+)$/
const BULLETED = /^[-*•]\s+(.+)$/
const HEADER   = /^[A-Z][A-Z\s\d&\-/]{3,}:?$/
const IMPERATIVE_VERB = /^(check|verify|ensure|confirm|review|update|create|set|run|start|stop|open|close|install|configure|test|validate|restart|deploy|backup|monitor|log|report|send|notify|complete|finish|submit|approve|reject|connect|disconnect|enable|disable|clear|clean|reset|initialize|load|save|export|import|assign|remove|add|delete|move|copy)/i

/**
 * Normalize raw model output before line-splitting.
 * flan-T5 often emits all items on one line without real newlines:
 *   "1. Check oil 2. Inspect tires 3. Test brakes"
 * Insert a newline before each inline numbered/bulleted token so the
 * line-based parser can handle them correctly.
 */
function normalizeModelOutput(raw: string): string {
  return raw
    // " 2. " / " 3) " etc. appearing mid-line → insert newline before them
    .replace(/\s+(\d+)[.)]\s+/g, '\n$1. ')
    // " - " / " • " mid-line
    .replace(/\s+[-•]\s+/g, '\n- ')
}

function parseModelOutput(rawText: string): RawParsedLine[] {
  const lines = normalizeModelOutput(rawText)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3)

  const results: RawParsedLine[] = []

  for (const line of lines) {
    const numberedMatch = line.match(NUMBERED)
    const letteredMatch = line.match(LETTERED)
    const bulletedMatch = line.match(BULLETED)
    const isHeader = HEADER.test(line)

    if (isHeader) {
      results.push({ text: line.replace(/:$/, ''), isHeader: true, indent: 0 })
    } else if (numberedMatch) {
      results.push({ text: numberedMatch[2], isHeader: false, indent: 0 })
    } else if (letteredMatch) {
      results.push({ text: letteredMatch[1], isHeader: false, indent: 1 })
    } else if (bulletedMatch) {
      results.push({ text: bulletedMatch[1], isHeader: false, indent: 0 })
    } else if (line.length > 10 && IMPERATIVE_VERB.test(line)) {
      results.push({ text: line, isHeader: false, indent: 0 })
    }
  }

  return deduplicateLines(results)
}

function deduplicateLines(lines: RawParsedLine[]): RawParsedLine[] {
  const seen = new Set<string>()
  return lines.filter(line => {
    const key = line.text.toLowerCase().replace(/\s+/g, ' ').slice(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleLoadModel(command: { modelId: string; backend: 'webgpu' | 'wasm' }) {
  cancelled = false
  const { modelId, backend } = command
  const modelConfig = Object.values(LOCAL_MODELS).find(m => m.id === modelId)

  if (!modelConfig) {
    post({ type: 'ERROR', message: `Unknown model: ${modelId}`, category: 'init' })
    return
  }

  postProgress({ stage: 'initializing', progress: 0, statusText: 'Setting up model session…' })

  const speedCalc = new SpeedCalculator()
  let fromCache = true

  try {
    currentPipeline = await pipeline(modelConfig.task, modelId, {
      device: backend,
      progress_callback: (info: {
        status: string
        name?: string
        loaded?: number
        total?: number
        progress?: number
      }) => {
        if (cancelled) return

        if (info.status === 'downloading') {
          fromCache = false
          const loaded = info.loaded ?? 0
          const total = info.total
          speedCalc.record(loaded)
          const pct = total ? (loaded / total) * 100 : NaN

          postProgress({
            stage: 'downloading',
            progress: pct,
            loaded,
            total,
            speed: speedCalc.bytesPerSecond,
            fileName: info.name,
          })
        } else if (info.status === 'loading' || info.status === 'initiate') {
          postProgress({
            stage: 'initializing',
            progress: info.progress ?? 50,
            statusText: 'Loading model weights…',
          })
        }
      },
    })

    if (cancelled) {
      post({ type: 'ERROR', message: 'Cancelled', category: 'cancelled' })
      return
    }

    post({ type: 'MODEL_READY', backend, fromCache })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Model load failed'
    const isDownloadError = message.toLowerCase().includes('fetch') ||
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('failed to load')
    post({
      type: 'ERROR',
      message,
      category: isDownloadError ? 'download' : 'init',
    })
  }
}

/**
 * Direct extraction from already-structured input (bullets, numbers, headers).
 * Returns items if the input has clear list structure, otherwise returns null
 * so the caller falls through to model inference.
 *
 * This is the primary path for bulleted/numbered SOPs — the model adds no
 * value over direct parsing and often makes things worse.
 */
function tryDirectExtract(text: string): RawParsedLine[] | null {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2)

  const results: RawParsedLine[] = []

  for (const line of lines) {
    const numberedMatch = line.match(NUMBERED)
    const bulletedMatch = line.match(BULLETED)
    const isHeader = HEADER.test(line) || /^.+:$/.test(line) // "Server Restart Procedure:"

    if (isHeader) {
      results.push({ text: line.replace(/:$/, ''), isHeader: true, indent: 0 })
    } else if (numberedMatch) {
      results.push({ text: numberedMatch[2], isHeader: false, indent: 0 })
    } else if (bulletedMatch) {
      results.push({ text: bulletedMatch[1], isHeader: false, indent: 0 })
    }
  }

  // Only trust direct extraction if it found at least 2 non-header items
  const taskCount = results.filter(r => !r.isHeader).length
  return taskCount >= 2 ? deduplicateLines(results) : null
}

async function handleRunInference(command: {
  text: string
  title?: string
  description?: string
}) {
  if (!currentPipeline) {
    post({ type: 'ERROR', message: 'Model not loaded', category: 'inference' })
    return
  }

  cancelled = false
  const { text, title, description } = command
  const startMs = Date.now()

  postProgress({ stage: 'tokenizing', progress: 0, statusText: 'Preparing document…' })

  // Fast path: if the input already has list structure, extract directly
  const direct = tryDirectExtract(text)
  if (direct) {
    post({ type: 'RESULT', lines: direct, parseTimeMs: Date.now() - startMs })
    return
  }

  // Find the loaded model's id from the pipeline
  const modelId = (currentPipeline as { model?: { config?: { name_or_path?: string } } })
    ?.model?.config?.name_or_path ?? 'Xenova/flan-t5-small'

  const prompt = buildLocalPrompt(text, modelId, title, description)

  postProgress({ stage: 'generating', progress: 0, statusText: 'Analyzing structure…' })

  try {
    const output = await currentPipeline(prompt, {
      max_new_tokens: 512,
      num_beams: 2,
      early_stopping: true,
    })

    if (cancelled) {
      post({ type: 'ERROR', message: 'Cancelled', category: 'cancelled' })
      return
    }

    const rawText: string = Array.isArray(output)
      ? (output[0]?.generated_text ?? '')
      : ((output as { generated_text?: string })?.generated_text ?? '')

    const lines: RawParsedLine[] = parseModelOutput(rawText)

    post({ type: 'RESULT', lines, parseTimeMs: Date.now() - startMs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Inference failed'
    post({ type: 'ERROR', message, category: 'inference' })
  }
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<WorkerCommand>) => {
  const command = event.data
  switch (command.type) {
    case 'LOAD_MODEL':
      await handleLoadModel(command)
      break
    case 'RUN_INFERENCE':
      await handleRunInference(command)
      break
    case 'CANCEL':
      cancelled = true
      break
  }
})
