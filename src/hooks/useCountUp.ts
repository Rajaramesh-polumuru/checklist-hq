import { useEffect, useState } from 'react'
import { DASHBOARD } from '@/lib/constants'

/**
 * Custom hook for animating a number count-up effect
 * @param end - The target number to count up to
 * @param duration - Animation duration in milliseconds (default: 800ms)
 * @param enabled - Whether the animation should run (default: true)
 * @returns The current animated value
 */
export function useCountUp(
  end: number,
  duration: number = DASHBOARD.statCountUpDuration,
  enabled: boolean = true
): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Skip animation if disabled
    if (!enabled) {
      setCount(end)
      return
    }

    // Skip animation for 0
    if (end === 0) {
      setCount(0)
      return
    }

    const startTime = Date.now()
    const endTime = startTime + duration

    // Easing function (ease-out quad)
    const easeOutQuad = (t: number): number => {
      return t * (2 - t)
    }

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easedProgress = easeOutQuad(progress)
      const currentCount = Math.floor(easedProgress * end)

      setCount(currentCount)

      if (now < endTime) {
        requestAnimationFrame(updateCount)
      } else {
        setCount(end) // Ensure final value is exact
      }
    }

    const animationFrame = requestAnimationFrame(updateCount)

    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, enabled])

  return count
}
