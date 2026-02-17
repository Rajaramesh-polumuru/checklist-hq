import { Navigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OnboardingWizard } from '@/components/auth/OnboardingWizard'
import { useAuthStore } from '@/stores/auth-store'

export function Signup() {
    const { user, initialized } = useAuthStore()
    const location = useLocation()
    const returnTo = (location.state as { returnTo?: string })?.returnTo

    if (initialized && user) {
        return <Navigate to={returnTo || '/app'} replace />
    }

    return (
        <AuthLayout
            greeting="Get started"
            subtitle="Join thousands of teams building better workflows."
        >
            <OnboardingWizard />
        </AuthLayout>
    )
}
