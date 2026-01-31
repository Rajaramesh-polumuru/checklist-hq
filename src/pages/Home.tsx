import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitFork, List, Users, Zap, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function Home() {
  const { user, signInWithGoogle } = useAuthStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-sm font-medium mb-6 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>The GitHub for standard operating procedures</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
              Don't write checklists.
              <br />
              <span className="text-primary">Fork them.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '50ms' }}>
              Checklist HQ is where teams version control their SOPs, fork proven templates,
              and evolve their operations with the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '100ms' }}>
              {user ? (
                <Button asChild size="lg">
                  <Link to="/app">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={signInWithGoogle}>
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/explore">Explore Templates</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Built for teams who take process seriously
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, share, and improve your standard operating procedures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable className="group">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <GitFork className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Fork & Customize</CardTitle>
              <CardDescription className="text-sm">
                Start with battle-tested templates. Fork, customize, and make them yours.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <List className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Version Control</CardTitle>
              <CardDescription className="text-sm">
                Every change is tracked. Roll back, compare versions, and see the full history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Community Driven</CardTitle>
              <CardDescription className="text-sm">
                The best processes rise to the top. Learn from thousands of teams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverable className="group">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Execute with Confidence</CardTitle>
              <CardDescription className="text-sm">
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
                onClick={signInWithGoogle}
                className="bg-white text-primary hover:bg-white/90"
              >
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4" />
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
