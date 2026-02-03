import { motion } from 'framer-motion'
import { CheckCircle2, Command, ShieldCheck, Zap } from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
    greeting?: string
    subtitle?: string
}

export function AuthLayout({ children, greeting, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Panel - Brand/Art */}
            <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Abstract Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black opacity-50" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

                {/* Header */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                            <Command className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Checklist HQ</span>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                            Master your workflow with<br />
                            <span className="text-primary">precision and confidence.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                            The professional checklist tool for high-stakes operations.
                            Built for teams who refuse to compromise on quality.
                        </p>

                        <div className="space-y-4">
                            <FeatureItem icon={Zap} text="Lightning fast execution" delay={0.2} />
                            <FeatureItem icon={ShieldCheck} text="Enterprise-grade reliability" delay={0.3} />
                            <FeatureItem icon={CheckCircle2} text="Perfect compliance every time" delay={0.4} />
                        </div>
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex justify-between items-center text-sm text-zinc-500">
                    <p>© 2024 Checklist HQ</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-hidden">
                {/* Mobile Background */}
                <div className="absolute inset-0 bg-grid-slate-50/[0.05] -z-10 lg:hidden" />

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2 lg:text-left">
                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold tracking-tight"
                        >
                            {greeting}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground"
                        >
                            {subtitle}
                        </motion.p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ icon: Icon, text, delay }: { icon: any, text: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="flex items-center gap-3 text-zinc-300"
        >
            <div className="p-1.5 rounded-full bg-white/5 border border-white/10">
                <Icon className="w-4 h-4" />
            </div>
            <span>{text}</span>
        </motion.div>
    )
}
