import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { GitFork, LogOut, Plus } from 'lucide-react'

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
        className="skip-link sr-only-focusable focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Premium Navigation */}
      <header
        className="border-b bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm sticky top-0 z-50 shadow-sm"
        role="banner"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-80 transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <GitFork className="h-5 w-5 text-white" />
              </div>
              <span className="hidden sm:inline font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Checklist HQ
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              <Link
                to="/explore"
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${location.pathname === '/explore'
                  ? 'text-primary-foreground bg-primary shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
              >
                Explore
              </Link>
              {user && (
                <Link
                  to="/app"
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${location.pathname.startsWith('/app')
                    ? 'text-primary-foreground bg-primary shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* New Button */}
                <Button asChild size="sm" className="hidden sm:inline-flex shadow-md">
                  <Link to="/app/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Link>
                </Button>

                {/* User Avatar */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link to="/app/profile" aria-label="View profile">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    aria-label="Sign out"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button size="sm" onClick={signInWithGoogle} className="shadow-md">
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
