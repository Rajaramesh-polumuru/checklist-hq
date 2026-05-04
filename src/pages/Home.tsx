import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import BotIcon from '@hugeicons/core-free-icons/BotIcon'
import Rocket01Icon from '@hugeicons/core-free-icons/Rocket01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import ChartBarLineIcon from '@hugeicons/core-free-icons/ChartBarLineIcon'
import Globe02Icon from '@hugeicons/core-free-icons/Globe02Icon'
import { Icon } from '@/components/ui/icon'
import { Logo } from '@/components/ui/logo'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

// Demo mode configuration
const DEMO_MODE_KEY = 'checklist_hq_demo_mode'

export function enableDemoMode() {
  sessionStorage.setItem(DEMO_MODE_KEY, 'true')
}

export function isDemoMode(): boolean {
  return sessionStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export function clearDemoMode() {
  sessionStorage.removeItem(DEMO_MODE_KEY)
}

// MCP integration highlights — replaces fabricated testimonials with real capability cards
const mcpHighlights = [
  {
    title: "Read your checklists",
    description:
      "AI clients pull repositories, latest commits, version history, and live run status as MCP resources.",
    icon: CheckListIcon,
    accent: "bg-sky-500/10 text-sky-500",
  },
  {
    title: "Run them programmatically",
    description:
      "MCP tools let an agent create repos, commit edits, start runs, and tick items off — same actions as a human user.",
    icon: PlayIcon,
    accent: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Mix humans and agents",
    description:
      "Each checklist item can be assigned to a human, an agent, or either. Hand off mid-run without losing context.",
    icon: UserGroupIcon,
    accent: "bg-violet-500/10 text-violet-500",
  },
]

// Hero principles — replaces the fabricated stats row
const heroPrinciples = [
  {
    icon: Clock01Icon,
    title: "Versioned by default",
    description: "Every edit is an immutable commit",
  },
  {
    icon: GitForkIcon,
    title: "Fork-based",
    description: "Personal or team forks in one click",
  },
  {
    icon: BotIcon,
    title: "AI-ready via MCP",
    description: "Claude, Cursor, and Windsurf compatible",
  },
]

// Feature showcase data
const features = [
  {
    icon: Clock01Icon,
    title: "Version Control",
    description: "Every edit creates an immutable commit. Browse the full history, diff any two versions, and restore prior state.",
    color: "from-sky-500 to-cyan-400",
    bgColor: "bg-sky-500/10",
    textColor: "text-sky-500",
  },
  {
    icon: GitForkIcon,
    title: "Fork & Customize",
    description: "Fork any public checklist or your team's templates — to your account or to a specific team. Origin links are preserved.",
    color: "from-primary to-orange-400",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
  },
  {
    icon: PlayIcon,
    title: "Run Mode",
    description: "Execute a checklist as a tracked run. Per-step progress, completion history, and an append-only audit trail.",
    color: "from-emerald-500 to-teal-400",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
  },
  {
    icon: UserGroupIcon,
    title: "Teams & Organizations",
    description: "Multi-tenant from day one. Create orgs, scope repositories to teams, and manage member permissions with RBAC.",
    color: "from-violet-500 to-purple-400",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-500",
  },
  {
    icon: BotIcon,
    title: "AI-Ready via MCP",
    description: "Bundled Model Context Protocol server. Connect Claude Desktop, Cursor, or Windsurf and let agents read or run checklists.",
    color: "from-rose-500 to-pink-400",
    bgColor: "bg-rose-500/10",
    textColor: "text-rose-500",
  },
  {
    icon: FlashIcon,
    title: "Real-time Sync",
    description: "Edits and run progress sync live across collaborators via Supabase Realtime — no refresh required.",
    color: "from-amber-500 to-yellow-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
  },
]

// How it works steps
const howItWorks = [
  {
    step: 1,
    title: "Create or Fork",
    description: "Start from scratch or fork a proven template from our community library.",
    icon: SparklesIcon,
  },
  {
    step: 2,
    title: "Customize & Iterate",
    description: "Edit your checklist with our intuitive editor. Every change is automatically versioned.",
    icon: CheckListIcon,
  },
  {
    step: 3,
    title: "Execute & Track",
    description: "Run your checklists, track progress, and build a history of completions.",
    icon: CheckmarkCircle02Icon,
  },
]

// Use cases
const useCases = [
  { icon: Rocket01Icon, title: "Onboarding", description: "Employee & customer onboarding" },
  { icon: Shield01Icon, title: "Compliance", description: "Regulatory & audit checklists" },
  { icon: ChartBarLineIcon, title: "QA Testing", description: "Test procedures & quality control" },
  { icon: Clock01Icon, title: "Runbooks", description: "DevOps & incident response" },
  { icon: Globe02Icon, title: "SOPs", description: "Standard operating procedures" },
  { icon: FlashIcon, title: "Workflows", description: "Repeatable business processes" },
]

export function Home() {
  const { user, initialized } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo

  // Auto-redirect authenticated users to dashboard or returnTo location
  if (initialized && user) {
    return <Navigate to={returnTo || '/app'} replace />
  }

  // Show loading state while checking auth status
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const handleTryDemo = () => {
    enableDemoMode()
    navigate('/explore')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Navigation Header */}
        <div className="absolute top-0 left-0 right-0 z-50 container mx-auto px-4 py-6 flex justify-between items-center">
          <Logo size="md" withText />
          <div className="hidden sm:flex gap-4">
             <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
             </Button>
             <Button asChild>
                <Link to="/signup">Get Started</Link>
             </Button>
          </div>
        </div>
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-orange-500/5" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Floating checklist preview - left */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: -15 }}
          animate={{ opacity: 0.3, x: 0, rotate: -12 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-1/4 left-[5%] w-64 hidden xl:block pointer-events-none"
        >
          <Card className="bg-card/60 backdrop-blur-sm border shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon={CheckListIcon} className="h-4 w-4 text-primary" />
                </div>
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[true, true, false, false].map((checked, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center",
                    checked ? "bg-success border-success" : "border-muted-foreground/30"
                  )}>
                    {checked && <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 text-white" />}
                  </div>
                  <div className={cn("h-2 rounded bg-muted", i % 2 === 0 ? "w-full" : "w-3/4")} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Floating checklist preview - right */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 15 }}
          animate={{ opacity: 0.3, x: 0, rotate: 8 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="absolute bottom-1/4 right-[5%] w-56 hidden xl:block pointer-events-none"
        >
          <Card className="bg-card/60 backdrop-blur-sm border shadow-xl">
            <CardHeader className="pb-2">
              <div className="h-3 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[65, 40, 90].map((progress, i) => (
                <div key={i}>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 1 + i * 0.2, duration: 0.8 }}
                      className="h-full bg-primary/60 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 shadow-lg shadow-primary/5"
            >
              <Icon icon={SparklesIcon} className="h-4 w-4" />
              <span>The GitHub for Standard Operating Procedures</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6"
            >
              Don't write checklists.
              <br />
              <span className="text-gradient-primary">
                Fork them.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4"
            >
              Checklist HQ is where teams version control their SOPs, fork proven templates,
              and evolve their operations with the community.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4"
            >
              <Button size="lg" asChild className="text-base sm:text-lg px-6 sm:px-8 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-shadow w-full sm:w-auto">
                <Link to="/signup">
                  Get Started Free
                  <Icon icon={ArrowRight01Icon} className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleTryDemo}
                className="text-base sm:text-lg px-6 sm:px-8 group w-full sm:w-auto"
              >
                <Icon icon={PlayIcon} className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Try Demo
              </Button>
            </motion.div>

            {/* Demo mode hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-muted-foreground"
            >
              No signup required to explore templates
            </motion.p>

            {/* Product principles — what's true today, not vanity metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12"
            >
              {heroPrinciples.map((principle, index) => (
                <div
                  key={principle.title}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/60 backdrop-blur-sm",
                    index === 1 && "sm:bg-card/60",
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon icon={principle.icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{principle.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{principle.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 md:py-28" id="features">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for teams who take process seriously
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, share, and improve your standard operating procedures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "group relative overflow-hidden h-full",
                  "transition-all duration-500",
                  "hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10"
                )}
              >
                {/* Animated gradient border on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-xl p-px bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  feature.color
                )}>
                  <div className="h-full w-full bg-card rounded-[11px]" />
                </div>

                {/* Gradient accent line */}
                <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", feature.color)} />

                <CardHeader className="relative pt-8">
                  {/* Icon with animation */}
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center mb-4",
                    "shadow-lg transition-all duration-300",
                    feature.bgColor,
                    "group-hover:scale-110 group-hover:rotate-3"
                  )}>
                    <Icon icon={feature.icon} className={cn("h-7 w-7", feature.textColor)} />
                  </div>

                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                {/* Hover indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon icon={ArrowRight01Icon} className="h-5 w-5 text-primary" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform how your team manages processes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-border via-primary/20 to-border" />
                )}

                {/* Step circle */}
                <div className="relative z-10 mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center mb-6 group hover:scale-105 transition-transform">
                  <Icon icon={step.icon} className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Use Cases</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Perfect for every team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From startups to enterprises, teams use Checklist HQ for all kinds of processes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="text-center p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon icon={useCase.icon} className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{useCase.title}</h3>
                <p className="text-xs text-muted-foreground">{useCase.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI-Native Section — replaces fabricated testimonials */}
      <section className="bg-muted/30 py-20 md:py-28" id="ai-native">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">AI-Native</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Designed for humans <span className="text-gradient-primary">and AI</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Most checklist tools predate AI assistants that can actually do the work. Checklist HQ ships with a
              Model Context Protocol server, so an LLM can read, fork, and run your checklists with the same
              permissions as any team member.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {mcpHighlights.map((highlight, index) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group relative h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="pt-8 pb-6">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
                        highlight.accent,
                      )}
                    >
                      <Icon icon={highlight.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{highlight.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground">
              Compatible with Claude Desktop, Cursor, Windsurf, and any MCP client.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-orange-500/5 border-primary/20 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">Try Before You Sign Up</Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Explore without commitment
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Browse our template library, view checklists, and experience the platform
                  without creating an account. When you're ready, sign up to create your own.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={handleTryDemo} className="shadow-lg shadow-primary/25 hover:shadow-xl transition-shadow">
                    <Icon icon={PlayIcon} className="mr-2 h-5 w-5" />
                    Launch Demo Mode
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/explore">
                      Browse Templates
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                {/* Demo preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl border shadow-2xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon={CheckListIcon} className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Employee Onboarding</p>
                      <p className="text-sm text-muted-foreground">15 items</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Icon icon={CheckmarkCircle02Icon} className="h-5 w-5 text-success" />
                      <span className="text-sm">Complete paperwork</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon icon={CheckmarkCircle02Icon} className="h-5 w-5 text-success" />
                      <span className="text-sm">Set up workstation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">Team introductions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">Review company policies</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">2 of 15</span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: '13%' }} />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-gradient-to-r from-primary to-orange-500 text-primary-foreground border-0 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <CardContent className="p-8 md:p-12 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Start version-controlling your processes
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Free during the early-access MVP. Bring your runbooks, SOPs, and checklists into one
                versioned, AI-ready home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-primary hover:bg-white/90 shadow-lg border-0"
                >
                  <Link to="/signup">
                    Start for Free
                    <Icon icon={ArrowRight01Icon} className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleTryDemo}
                  className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Icon icon={PlayIcon} className="mr-2 h-4 w-4" />
                  Try Demo First
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="lg" withText />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                The GitHub for Standard Operating Procedures. Version control your processes,
                fork proven templates, and build operational excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-semibold mb-4">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore" className="hover:text-foreground transition-colors">Explore Templates</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#ai-native" className="hover:text-foreground transition-colors">AI Integration</a></li>
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <p className="font-semibold mb-4">Get Started</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up Free</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><button onClick={handleTryDemo} className="hover:text-foreground transition-colors">Try Demo</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Checklist HQ. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
