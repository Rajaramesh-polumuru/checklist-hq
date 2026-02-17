import { Navigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/stores/auth-store'

export function Login() {
    const { user, initialized } = useAuthStore()
    const location = useLocation()
    const returnTo = (location.state as { returnTo?: string })?.returnTo

    if (initialized && user) {
        return <Navigate to={returnTo || '/app'} replace />
    }

    return (
        <AuthLayout
            greeting="Welcome back"
            subtitle="Enter your details to access your workspace."
        >
            <LoginForm />
        </AuthLayout>
    )
}
