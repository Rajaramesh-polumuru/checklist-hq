import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import type { Toast as ToastType } from '@/hooks/useToast'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const toastStyles = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: 'text-emerald-600',
    IconComponent: CheckCircle2,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    IconComponent: XCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    IconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    IconComponent: Info,
  },
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const style = toastStyles[toast.type]
  const Icon = style.IconComponent

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${style.container} animate-slide-up`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 shrink-0 ${style.icon}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
