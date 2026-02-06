import { useState, useEffect } from 'react'

/**
 * Returns `true` when the user's OS is set to "reduce motion".
 * Reactive — updates immediately if the preference changes at runtime.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)

    setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
