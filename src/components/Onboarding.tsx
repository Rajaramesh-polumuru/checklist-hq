import { useEffect, useState } from 'react'
import { NextStepProvider, NextStepReact, useNextStep } from 'nextstepjs'
import type { CardComponentProps, Tour } from 'nextstepjs'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ChevronRight, ChevronLeft, GitFork, Plus, Edit3 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import type { NavigationAdapter } from 'nextstepjs'
import { useOnboarding } from '@/hooks/useOnboarding'

// Custom navigation adapter for React Router
const useReactRouterAdapter = (): NavigationAdapter => {
  const navigate = useNavigate()
  return {
    push: (path: string) => {
      navigate(path)
    },
    getCurrentPath: () => {
      return window.location.pathname
    },
  }
}

// Custom card component matching the app's design
function OnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  return (
    <Card className="relative max-w-sm p-6 shadow-xl border-primary/20 animate-fade-in">
      {/* Arrow */}
      <div className="text-primary">{arrow}</div>

      {/* Close button */}
      <button
        onClick={skipTour}
        className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Skip onboarding"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Icon */}
      {step.icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
          {step.icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>

      {/* Content */}
      <div className="text-sm text-muted-foreground mb-6">{step.content}</div>

      {/* Progress and controls */}
      <div className="flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-primary'
                  : i < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {currentStep < totalSteps - 1 ? (
            <Button size="sm" onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={skipTour}>
              Get Started
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// Onboarding tour steps
const onboardingSteps: Tour[] = [
  {
    tour: 'welcome',
    steps: [
      {
        icon: <GitFork className="h-6 w-6 text-primary" />,
        title: 'Welcome to Checklist HQ',
        content: (
          <p>
            Think of it as <strong>GitHub for your processes</strong>. Create reusable
            checklists with version control, fork templates, and track every change.
          </p>
        ),
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 12,
      },
      {
        icon: <Plus className="h-6 w-6 text-primary" />,
        title: 'Create Your First Checklist',
        content: (
          <p>
            Click <strong>"New Checklist"</strong> to create your first process.
            You can also explore public templates to get started quickly.
          </p>
        ),
        selector: '#onboarding-new-checklist',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
        nextRoute: '/app/new',
      },
      {
        icon: <Edit3 className="h-6 w-6 text-primary" />,
        title: 'Build Your Checklist',
        content: (
          <p>
            Type to add items, use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Tab</kbd> to
            indent, and <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add more.
            Your changes auto-save, and every version is preserved.
          </p>
        ),
        selector: '#onboarding-editor',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 12,
        pointerRadius: 12,
      },
    ],
  },
]

// Provider component that wraps the app
interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const location = useLocation()
  const { user, initialized } = useAuthStore()

  // Start onboarding when:
  // 1. User hasn't completed onboarding
  // 2. User is authenticated
  // 3. User is on the dashboard page
  useEffect(() => {
    if (!hasCompletedOnboarding && initialized && user && location.pathname === '/app') {
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 800) // Slightly longer delay to let the page load
      return () => clearTimeout(timer)
    }
  }, [hasCompletedOnboarding, initialized, user, location.pathname])

  const handleComplete = () => {
    completeOnboarding()
    setShowOnboarding(false)
  }

  const handleSkip = () => {
    completeOnboarding()
    setShowOnboarding(false)
  }

  return (
    <NextStepProvider>
      <NextStepReact
        navigationAdapter={useReactRouterAdapter}
        steps={onboardingSteps}
        showNextStep={showOnboarding}
        shadowRgb="20, 20, 30"
        shadowOpacity="0.85"
        cardComponent={OnboardingCard}
        onComplete={handleComplete}
        onSkip={handleSkip}
        clickThroughOverlay={false}
        scrollToTop={false}
      >
        {children}
      </NextStepReact>
    </NextStepProvider>
  )
}

// Trigger component for manually starting onboarding
export function OnboardingTrigger() {
  const { startNextStep } = useNextStep()
  const { resetOnboarding } = useOnboarding()

  const handleStart = () => {
    resetOnboarding()
    startNextStep('welcome')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleStart}>
      <GitFork className="h-4 w-4 mr-2" />
      Take the Tour
    </Button>
  )
}
