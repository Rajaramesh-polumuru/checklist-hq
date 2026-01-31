import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitFork, List, Users, Zap } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function Home() {
  const { user, signInWithGoogle } = useAuthStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Don't write checklists.
            <br />
            <span className="text-primary">Fork them.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Checklist HQ is the GitHub for process. Version control your SOPs,
            fork proven templates, and evolve your operations with the community.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Button asChild size="lg">
                <Link to="/app">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={signInWithGoogle}>
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/explore">Explore Templates</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <GitFork className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Fork & Customize</CardTitle>
              <CardDescription>
                Start with battle-tested templates. Fork, customize, and make them yours.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <List className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Version Control</CardTitle>
              <CardDescription>
                Every change is tracked. Roll back, compare versions, and see the history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Community Driven</CardTitle>
              <CardDescription>
                The best processes rise to the top. Learn from thousands of teams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Execute with Confidence</CardTitle>
              <CardDescription>
                Run checklists, track progress, and never miss a critical step.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to standardize excellence?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Join teams who are building their operational knowledge base with Checklist HQ.
            </p>
            {!user && (
              <Button
                size="lg"
                variant="secondary"
                onClick={signInWithGoogle}
              >
                Start for Free
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
