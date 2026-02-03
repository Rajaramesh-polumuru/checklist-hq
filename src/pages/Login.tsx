import { Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/stores/auth-store'

export function Login() {
    const { user, initialized } = useAuthStore()

    if (initialized && user) {
        return <Navigate to="/app" replace />
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
