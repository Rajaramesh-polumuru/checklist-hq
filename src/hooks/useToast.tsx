import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }, [dismissToast])

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    info,
    warning,
  }
}
