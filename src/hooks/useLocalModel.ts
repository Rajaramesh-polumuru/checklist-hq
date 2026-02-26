import { useCallback, useEffect, useRef, useState } from 'react'
import { LOCAL_MODELS, DEFAULT_LOCAL_MODEL } from '@/lib/local-model/model-config'
import type {
  WorkerEvent,
  WorkerCommand,
  ProgressPayload,
  RawParsedLine,
} from '@/lib/local-model/types'

export type LocalModelStatus =
  | 'idle'
  | 'checking-capabilities'
  | 'loading'
  | 'ready'
  | 'inferring'
  | 'error'

export interface LocalModelProgress {
  stage: ProgressPayload['stage'] | null
  percentage: number     // 0–100, NaN when indeterminate
  loadedBytes: number
  totalBytes: number
  speed: number          // bytes/sec
  fileName: string | null
  statusText: string | null
  // Derived display values (computed in hook)
  loadedMB: string
  totalMB: string
  etaSeconds: number | null // null when speed is 0 or unknown
}

export interface UseLocalModelReturn {
  status: LocalModelStatus
  progress: LocalModelProgress
  isWebGPUAvailable: boolean
  isCached: boolean
  activeBackend: 'webgpu' | 'wasm' | null
  selectedModelKey: string
  selectModel: (key: string) => void
  loadModel: () => Promise<void>
  runInference: (opts: {
    text: string
    title?: string
    description?: string
  }) => Promise<RawParsedLine[]>
  cancel: () => void
  error: string | null
}

const MB = 1024 * 1024

function formatMB(bytes: number): string {
  return `${(bytes / MB).toFixed(1)} MB`
}

const EMPTY_PROGRESS: LocalModelProgress = {
  stage: null,
  percentage: 0,
  loadedBytes: 0,
  totalBytes: 0,
  speed: 0,
  fileName: null,
  statusText: null,
  loadedMB: '0 MB',
  totalMB: '? MB',
  etaSeconds: null,
}

export function useLocalModel(): UseLocalModelReturn {
  const workerRef = useRef<Worker | null>(null)
  const resolveRef = useRef<((lines: RawParsedLine[]) => void) | null>(null)
  const rejectRef = useRef<((err: Error) => void) | null>(null)

  const [status, setStatus] = useState<LocalModelStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isWebGPUAvailable, setIsWebGPUAvailable] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [activeBackend, setActiveBackend] = useState<'webgpu' | 'wasm' | null>(null)
  const [selectedModelKey, setSelectedModelKey] = useState<string>(DEFAULT_LOCAL_MODEL)
  const [progress, setProgress] = useState<LocalModelProgress>(EMPTY_PROGRESS)

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/local-model.worker.ts', import.meta.url),
        { type: 'module' },
      )

      workerRef.current.addEventListener('message', (e: MessageEvent<WorkerEvent>) => {
        const event = e.data

        if (event.type === 'PROGRESS') {
          const p = event.payload
          const loadedBytes = p.loaded ?? 0
          const totalBytes = p.total ?? 0
          const speed = p.speed ?? 0
          const etaSeconds =
            speed > 0 && totalBytes > 0 && loadedBytes < totalBytes
              ? Math.round((totalBytes - loadedBytes) / speed)
              : null

          setProgress({
            stage: p.stage,
            percentage: isNaN(p.progress) ? NaN : Math.round(p.progress),
            loadedBytes,
            totalBytes,
            speed,
            fileName: p.fileName ?? null,
            statusText: p.statusText ?? null,
            loadedMB: formatMB(loadedBytes),
            totalMB: totalBytes > 0 ? formatMB(totalBytes) : '? MB',
            etaSeconds,
          })

          if (p.stage === 'downloading' || p.stage === 'initializing') {
            setStatus('loading')
          } else if (p.stage === 'generating' || p.stage === 'tokenizing') {
            setStatus('inferring')
          }
        }

        if (event.type === 'MODEL_READY') {
          setActiveBackend(event.backend)
          setIsCached(event.fromCache)
          setStatus('ready')
        }

        if (event.type === 'RESULT') {
          setStatus('ready')
          resolveRef.current?.(event.lines)
          resolveRef.current = null
          rejectRef.current = null
        }

        if (event.type === 'ERROR') {
          if (event.category !== 'cancelled') {
            setError(event.message)
            setStatus('error')
          } else {
            setStatus('idle')
          }
          rejectRef.current?.(new Error(event.message))
          resolveRef.current = null
          rejectRef.current = null
        }
      })
    }

    return workerRef.current
  }, [])

  const loadModel = useCallback(async () => {
    setError(null)
    setStatus('checking-capabilities')

    // WebGPU capability check — must run on main thread
    let gpuAvailable = false
    try {
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        const adapter = await (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu?.requestAdapter()
        gpuAvailable = adapter !== null && adapter !== undefined
      }
    } catch {
      gpuAvailable = false
    }

    setIsWebGPUAvailable(gpuAvailable)

    const modelConfig = LOCAL_MODELS[selectedModelKey]
    if (!modelConfig) {
      setError(`Unknown model: ${selectedModelKey}`)
      setStatus('error')
      return
    }

    const backend = gpuAvailable
      ? modelConfig.backendPreference[0]
      : 'wasm'

    setStatus('loading')

    const worker = getWorker()
    worker.postMessage({
      type: 'LOAD_MODEL',
      modelId: modelConfig.id,
      backend,
    } satisfies WorkerCommand)

    // Wait for MODEL_READY or ERROR via the message listener above
    return new Promise<void>((resolve, reject) => {
      const originalResolve = resolveRef.current
      const originalReject = rejectRef.current

      // Temporarily intercept to capture model ready
      const onMessage = (e: MessageEvent<WorkerEvent>) => {
        if (e.data.type === 'MODEL_READY') {
          workerRef.current?.removeEventListener('message', onMessage)
          // Restore any pending inference resolvers
          resolveRef.current = originalResolve
          rejectRef.current = originalReject
          resolve()
        } else if (e.data.type === 'ERROR') {
          workerRef.current?.removeEventListener('message', onMessage)
          resolveRef.current = originalResolve
          rejectRef.current = originalReject
          reject(new Error(e.data.message))
        }
      }

      workerRef.current?.addEventListener('message', onMessage)
    })
  }, [selectedModelKey, getWorker])

  const runInference = useCallback(
    (opts: { text: string; title?: string; description?: string }): Promise<RawParsedLine[]> => {
      return new Promise((resolve, reject) => {
        resolveRef.current = resolve
        rejectRef.current = reject
        setStatus('inferring')
        setError(null)

        const worker = getWorker()
        worker.postMessage({
          type: 'RUN_INFERENCE',
          ...opts,
        } satisfies WorkerCommand)
      })
    },
    [getWorker],
  )

  const cancel = useCallback(() => {
    workerRef.current?.postMessage({ type: 'CANCEL' } satisfies WorkerCommand)
    rejectRef.current?.(new Error('Cancelled'))
    resolveRef.current = null
    rejectRef.current = null
  }, [])

  const selectModel = useCallback((key: string) => {
    setSelectedModelKey(key)
    // Terminate existing worker so the new model loads cleanly
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setStatus('idle')
    setActiveBackend(null)
    setIsCached(false)
    setProgress(EMPTY_PROGRESS)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  return {
    status,
    progress,
    isWebGPUAvailable,
    isCached,
    activeBackend,
    selectedModelKey,
    selectModel,
    loadModel,
    runInference,
    cancel,
    error,
  }
}
