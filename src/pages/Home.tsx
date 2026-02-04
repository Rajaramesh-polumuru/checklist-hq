import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GitFork,
  List,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  History,
  Play,
  Shield,
  Star,
  Quote,
  Rocket,
  Clock,
  BarChart3,
  Globe,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

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

// Testimonial data
const testimonials = [
  {
    quote: "Checklist HQ transformed how we onboard new team members. We went from scattered docs to a single source of truth.",
    author: "Sarah Chen",
    role: "Head of Operations",
    company: "TechFlow",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The version control for checklists is brilliant. We can finally track why our processes changed and roll back when needed.",
    author: "Marcus Rodriguez",
    role: "DevOps Lead",
    company: "CloudScale",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "Fork and customize has saved us countless hours. We start with community templates and make them our own.",
    author: "Emily Watson",
    role: "Quality Manager",
    company: "MedTech Solutions",
    avatar: "EW",
    rating: 5,
  },
]

// Feature showcase data
const features = [
  {
    icon: GitFork,
    title: "Fork & Customize",
    description: "Start with battle-tested templates from the community. Fork, customize, and make them yours in seconds.",
    color: "from-primary/80 to-orange-300",
    bgColor: "from-primary/15 to-primary/5",
    textColor: "text-primary",
  },
  {
    icon: History,
    title: "Version Control",
    description: "Every change is tracked automatically. View history, compare versions, and roll back with confidence.",
    color: "from-sky-300 to-cyan-200",
    bgColor: "from-sky-300/30 to-sky-200/15",
    textColor: "text-sky-400",
  },
  {
    icon: Play,
    title: "Run Mode",
    description: "Execute checklists in real-time with progress tracking. Never miss a critical step again.",
    color: "from-emerald-300 to-green-200",
    bgColor: "from-emerald-300/30 to-emerald-200/15",
    textColor: "text-emerald-400",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "The best processes rise to the top. Learn from thousands of teams and share your expertise.",
    color: "from-violet-300 to-purple-200",
    bgColor: "from-violet-300/30 to-violet-200/15",
    textColor: "text-violet-400",
  },
]

// How it works steps
const howItWorks = [
  {
    step: 1,
    title: "Create or Fork",
    description: "Start from scratch or fork a proven template from our community library.",
    icon: Sparkles,
  },
  {
    step: 2,
    title: "Customize & Iterate",
    description: "Edit your checklist with our intuitive editor. Every change is automatically versioned.",
    icon: List,
  },
  {
    step: 3,
    title: "Execute & Track",
    description: "Run your checklists, track progress, and build a history of completions.",
    icon: CheckCircle2,
  },
]

// Use cases
const useCases = [
  { icon: Rocket, title: "Onboarding", description: "Employee & customer onboarding" },
  { icon: Shield, title: "Compliance", description: "Regulatory & audit checklists" },
  { icon: BarChart3, title: "QA Testing", description: "Test procedures & quality control" },
  { icon: Clock, title: "Runbooks", description: "DevOps & incident response" },
  { icon: Globe, title: "SOPs", description: "Standard operating procedures" },
  { icon: Zap, title: "Workflows", description: "Repeatable business processes" },
]

export function Home() {
  const { user, initialized } = useAuthStore()
  const navigate = useNavigate()

  // Auto-redirect authenticated users to dashboard
  if (initialized && user) {
    return <Navigate to="/app" replace />
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
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in shadow-lg shadow-primary/5">
              <Sparkles className="h-4 w-4" />
              <span>The GitHub for Standard Operating Procedures</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
              Don't write checklists.
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-orange-400 bg-clip-text text-transparent">
                Fork them.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '50ms' }}>
              Checklist HQ is where teams version control their SOPs, fork proven templates,
              and evolve their operations with the community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Button size="lg" asChild className="text-lg px-8 py-6 shadow-xl shadow-primary/25">
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleTryDemo}
                className="text-lg px-8 py-6"
              >
                <Play className="mr-2 h-5 w-5" />
                Try Demo
              </Button>
            </div>

            {/* Demo mode hint */}
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '150ms' }}>
              No signup required to explore templates
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-center p-4">
                <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground mt-1">Templates</p>
              </div>
              <div className="text-center p-4 border-x border-border">
                <p className="text-3xl md:text-4xl font-bold text-primary">2K+</p>
                <p className="text-sm text-muted-foreground mt-1">Teams</p>
              </div>
              <div className="text-center p-4">
                <p className="text-3xl md:text-4xl font-bold text-primary">99.9%</p>
                <p className="text-sm text-muted-foreground mt-1">Uptime</p>
              </div>
            </div>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              hoverable
              className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.color}`} />
              <CardHeader className="pt-6">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.textColor}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
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
              <div
                key={step.step}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
                )}

                {/* Step number */}
                <div className="relative z-10 mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center mb-6">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
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
            <Card
              key={useCase.title}
              className="text-center p-6 hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <useCase.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-sm mb-1">{useCase.title}</h3>
              <p className="text-xs text-muted-foreground">{useCase.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-20 md:py-28" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about Checklist HQ.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.author}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8 pb-6">
                  {/* Quote icon */}
                  <Quote className="h-10 w-10 text-primary/20 absolute top-4 right-4" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-medium text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
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
                  <Button size="lg" onClick={handleTryDemo} className="shadow-lg">
                    <Play className="mr-2 h-5 w-5" />
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
                {/* Demo preview placeholder */}
                <div className="bg-card rounded-xl border shadow-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <List className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Employee Onboarding</p>
                      <p className="text-sm text-muted-foreground">15 items</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm">Complete paperwork</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                      <div className="h-full bg-primary rounded-full" style={{ width: '13%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to standardize excellence?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of teams building their operational knowledge base with Checklist HQ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link to="/signup">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleTryDemo}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Play className="mr-2 h-4 w-4" />
                Try Demo First
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25">
                  <GitFork className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">Checklist HQ</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                The GitHub for Standard Operating Procedures. Version control your processes,
                fork proven templates, and build operational excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore" className="hover:text-foreground transition-colors">Explore Templates</Link></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
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
