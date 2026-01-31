import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { GitFork, User, LogOut, Plus } from 'lucide-react'

export function Layout() {
  const { user, signInWithGoogle, signOut } = useAuthStore()
  const location = useLocation()

  const isEditor = location.pathname.includes('/app/repo/') || location.pathname === '/app/new'

  // Don't show header in editor mode
  if (isEditor) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only-focusable focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header className="border-b bg-card sticky top-0 z-50" role="banner">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <GitFork className="h-5 w-5" />
              Checklist HQ
            </Link>
            <nav className="hidden md:flex items-center gap-4" role="navigation" aria-label="Main navigation">
              <Link
                to="/explore"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore
              </Link>
              {user && (
                <Link
                  to="/app"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/app/profile" aria-label="View profile">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Profile</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={signInWithGoogle}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div id="main-content">
        <Outlet />
      </div>
    </div>
  )
}
