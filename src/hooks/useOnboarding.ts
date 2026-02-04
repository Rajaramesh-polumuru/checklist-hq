import { useState } from 'react'

const ONBOARDING_STORAGE_KEY = 'checklist-hq-onboarding-completed'

// Hook to manage onboarding state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  })

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setHasCompletedOnboarding(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    setHasCompletedOnboarding(false)
  }

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
