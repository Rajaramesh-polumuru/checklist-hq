import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { lookupSSOByEmail, signInWithSSO, type SSODomainLookup } from '@/services/sso'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
    const navigate = useNavigate()
    const location = useLocation()
    const returnTo = (location.state as { returnTo?: string })?.returnTo
    const { signInWithPassword, signInWithGoogle, loading: authLoading } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    // SSO auto-detect
    const [ssoMatch, setSsoMatch] = useState<SSODomainLookup | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        const email = formData.email.trim()
        if (!email.includes('@') || email.split('@')[1].length < 3) {
            setSsoMatch(null)
            return
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const match = await lookupSSOByEmail(email)
                setSsoMatch(match)
            } catch {
                setSsoMatch(null)
            }
        }, 600)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [formData.email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await signInWithPassword(formData.email, formData.password)
            navigate(returnTo || '/app')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true)
            await signInWithGoogle()
        } catch (err) {
            console.error('Google sign in error:', err)
            setError('Failed to sign in with Google')
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
        >
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                    <Icon icon={AlertCircleIcon} className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-11"
                    />
                </div>
                {/* SSO auto-detect banner */}
                {ssoMatch && ssoMatch.supabase_provider_id && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-indigo-800">
                                {ssoMatch.organization_name} uses Single Sign-On
                            </p>
                            <p className="text-xs text-indigo-600">
                                Sign in with your corporate identity provider
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
                            onClick={async () => {
                                setLoading(true)
                                setError(null)
                                try {
                                    await signInWithSSO(ssoMatch.supabase_provider_id!)
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : 'SSO sign-in failed')
                                    setLoading(false)
                                }
                            }}
                            disabled={loading || authLoading}
                        >
                            {loading ? <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" /> : 'Continue with SSO'}
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!ssoMatch}
                        className="h-11"
                        disabled={!!ssoMatch}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={loading || authLoading}
                >
                    {loading ? (
                        <>
                            <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                className="w-full h-11"
                onClick={handleGoogleSignIn}
                disabled={loading || authLoading}
            >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                    to="/signup"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    Sign up
                </Link>
            </p>
        </motion.div>
    )
}
