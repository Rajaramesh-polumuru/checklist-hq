import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitFork, List, Users, Zap, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function Home() {
  const { user, initialized } = useAuthStore()

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
              <span>The GitHub for standard operating procedures</span>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '100ms' }}>
              {user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6 shadow-xl shadow-primary/25">
                  <Link to="/app">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="text-lg px-8 py-6 shadow-xl shadow-primary/25">
                    <Link to="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
                    <Link to="/explore">Explore Templates</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
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
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for teams who take process seriously
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, share, and improve your standard operating procedures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/80 to-orange-300" />
            <CardHeader className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GitFork className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Fork & Customize</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Start with battle-tested templates. Fork, customize, and make them yours.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-300 to-cyan-200" />
            <CardHeader className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-300/30 to-sky-200/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <List className="h-6 w-6 text-sky-400" />
              </div>
              <CardTitle className="text-lg">Version Control</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Every change is tracked. Roll back, compare versions, and see the full history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-300 to-purple-200" />
            <CardHeader className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-300/30 to-violet-200/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-violet-400" />
              </div>
              <CardTitle className="text-lg">Community Driven</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                The best processes rise to the top. Learn from thousands of teams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-300 to-yellow-200" />
            <CardHeader className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-300/30 to-amber-200/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <CardTitle className="text-lg">Execute with Confidence</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Run checklists, track progress, and never miss a critical step.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to standardize excellence?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join teams who are building their operational knowledge base with Checklist HQ.
            </p>
            {!user && (
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
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitFork className="h-4 w-4" />
              <span>Checklist HQ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Checklist HQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
