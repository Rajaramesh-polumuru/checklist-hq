import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Briefcase01Icon, UserIcon, Mortarboard01Icon, ArrowRight01Icon, Loading02Icon, CheckmarkCircle02Icon, Mail01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Step 1: Sign Up Form
function SignupStep({ onNext }: { onNext: () => void }) {
    const { signUp, loading: authLoading } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmEmail, setConfirmEmail] = useState(false)
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match")
            return
        }
        setLoading(true)
        setError(null)
        try {
            const hasSession = await signUp(formData.email, formData.password)
            if (hasSession) {
                onNext()
            } else {
                setConfirmEmail(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign up')
        } finally {
            setLoading(false)
        }
    }

    // Email confirmation required — show instructions instead of the form
    if (confirmEmail) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6 py-4"
            >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                    <Icon icon={Mail01Icon} className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                        We sent a confirmation link to <span className="font-medium text-foreground">{formData.email}</span>.
                        Click it to verify your account, then come back to sign in.
                    </p>
                </div>
                <Link to="/login" className="text-sm text-primary hover:underline font-medium">
                    Back to sign in
                </Link>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Create your account</h3>
                <p className="text-sm text-muted-foreground">Start your journey with Checklist HQ.</p>
            </div>

            {error && (
                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">Email</label>
                    <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="password">Password</label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="confirm">Confirm Password</label>
                    <Input
                        id="confirm"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading || authLoading}>
                    {loading ? <Icon icon={Loading02Icon} className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
            </p>
        </motion.div>
    )
}

// Step 2: Usage Intent
function IntentStep({ onNext }: { onNext: (intent: string) => void }) {
    const intents = [
        { id: 'work', label: 'Work', icon: Briefcase01Icon, desc: 'Manage team projects & SOPs' },
        { id: 'personal', label: 'Personal', icon: UserIcon, desc: 'Organize daily tasks & goals' },
        { id: 'education', label: 'Education', icon: Mortarboard01Icon, desc: 'Study plans & assignments' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">How will you use Checklist HQ?</h3>
                <p className="text-sm text-muted-foreground">We'll customize your experience.</p>
            </div>

            <div className="grid gap-4">
                {intents.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNext(item.id)}
                        className="flex items-center gap-4 p-4 text-left border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Icon icon={item.icon} className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-sm text-muted-foreground">{item.desc}</div>
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    )
}

// Step 3: Profile Setup
function ProfileStep({ onNext, onBack }: { onNext: (name: string) => Promise<void>, onBack: () => void }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            setLoading(true)
            await onNext(name).finally(() => setLoading(false))
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">What should we call you?</h3>
                <p className="text-sm text-muted-foreground">This will be displayed on your profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="name">Full Name</label>
                    <Input
                        id="name"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        autoFocus
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={onBack} className="w-full" disabled={loading}>
                        Back
                    </Button>
                    <Button type="submit" className="w-full" disabled={!name.trim() || loading}>
                        {loading ? <Icon icon={Loading02Icon} className="w-4 h-4 animate-spin" /> : <>Continue <Icon icon={ArrowRight01Icon} className="w-4 h-4 ml-2" /></>}
                    </Button>
                </div>
            </form>
        </motion.div>
    )
}

// Step 4: Success/Completion
function SuccessStep() {
    const navigate = useNavigate()

    useEffect(() => {
        // Auto redirect after animation
        const timer = setTimeout(() => {
            navigate('/app')
        }, 1500)
        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"
            >
                <Icon icon={CheckmarkCircle02Icon} className="w-10 h-10" />
            </motion.div>

            <div className="space-y-2">
                <h3 className="text-2xl font-bold">You're all set!</h3>
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
        </motion.div>
    )
}

export function OnboardingWizard() {
    const { updateProfile } = useAuthStore()
    const [step, setStep] = useState(1)
    const [data, setData] = useState({ intent: '', name: '' })

    const handleIntent = (intent: string) => {
        setData(prev => ({ ...prev, intent }))
        setStep(3)
    }

    const handleProfile = async (name: string) => {
        try {
            setData(prev => ({ ...prev, name }))
            // Update Supabase profile
            await updateProfile({
                full_name: name,
                usage_intent: data.intent
            })
        } catch (error) {
            console.error('Failed to update profile:', error)
            // Proceed anyway, don't block user flow for metadata
        }
        setStep(4)
    }

    return (
        <div className="w-full max-w-sm">
            <div className="mb-8 flex gap-2 justify-center">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-primary' : 'w-2 bg-zinc-200 dark:bg-zinc-800'
                            }`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && <SignupStep key="step1" onNext={() => setStep(2)} />}
                {step === 2 && <IntentStep key="step2" onNext={handleIntent} />}
                {step === 3 && <ProfileStep key="step3" onNext={handleProfile} onBack={() => setStep(2)} />}
                {step === 4 && <SuccessStep key="step4" />}
            </AnimatePresence>
        </div>
    )
}
