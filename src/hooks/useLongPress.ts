import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
  threshold?: number
  onLongPress: () => void
}

export function useLongPress({ threshold = 400, onLongPress }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const start = useCallback(() => {
    didLongPress.current = false
    timerRef.current = setTimeout(() => {
      didLongPress.current = true
      onLongPress()
    }, threshold)
  }, [threshold, onLongPress])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(() => start(), [start])
  const onTouchEnd = useCallback(() => cancel(), [cancel])
  const onTouchMove = useCallback(() => cancel(), [cancel])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onLongPress()
  }, [onLongPress])

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onContextMenu,
    didLongPress,
  }
}
