import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { Loading02Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Layout } from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OnboardingProvider } from '@/components/Onboarding'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'

// Lazy load pages
const Home = lazy(() => import('@/pages/Home').then(module => ({ default: module.Home })))
const Dashboard = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.Dashboard })))
const Explore = lazy(() => import('@/pages/Explore').then(module => ({ default: module.Explore })))
const Editor = lazy(() => import('@/pages/Editor').then(module => ({ default: module.Editor })))
const RunMode = lazy(() => import('@/pages/RunMode').then(module => ({ default: module.RunMode })))
const Activity = lazy(() => import('@/pages/Activity').then(module => ({ default: module.Activity })))
const ViewRepository = lazy(() => import('@/pages/ViewRepository').then(module => ({ default: module.ViewRepository })))
const ViewVersion = lazy(() => import('@/pages/ViewVersion').then(module => ({ default: module.ViewVersion })))
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('@/pages/Signup').then(module => ({ default: module.Signup })))
const Profile = lazy(() => import('@/pages/Profile').then(module => ({ default: module.Profile })))
const OrganizationDashboard = lazy(() => import('@/pages/OrganizationDashboard').then(module => ({ default: module.OrganizationDashboard })))
const NewOrganization = lazy(() => import('@/pages/NewOrganization').then(module => ({ default: module.NewOrganization })))
const Organizations = lazy(() => import('@/pages/Organizations').then(module => ({ default: module.Organizations })))
const TeamDashboard = lazy(() => import('@/pages/TeamDashboard').then(module => ({ default: module.TeamDashboard })))
// const OrganizationSettings = lazy(() => import('@/components/OrganizationSettings').then(module => ({ default: module.OrganizationSettings }))) // OrganizationSettings path?
const RunHistory = lazy(() => import('@/pages/RunHistory').then(module => ({ default: module.RunHistory })))
const RunAnalytics = lazy(() => import('@/pages/RunAnalytics')) // Default export
const ActiveRuns = lazy(() => import('@/pages/ActiveRuns').then(module => ({ default: module.ActiveRuns })))
const AuthCallback = lazy(() => import('@/pages/AuthCallback').then(module => ({ default: module.AuthCallback })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon={Loading02Icon} className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize: initializeAuth } = useAuthStore()
  const { initialize: initializeTheme } = useThemeStore()

  useEffect(() => {
    initializeAuth()
    initializeTheme()
  }, [initializeAuth, initializeTheme])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <OnboardingProvider>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="/signup" element={<Suspense fallback={<PageLoader />}><Signup /></Suspense>} />

            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
              <Route path="explore" element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>} />
              <Route path="auth/callback" element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />

              {/* Protected routes */}
              <Route
                path="app"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/runs"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ActiveRuns />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/history"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RunHistory />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/activity"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Activity />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/profile"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Editor />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/repo/:repoId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Editor />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/run/:runId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RunMode />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/run/start/:repoId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RunMode />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/repo/:repoId/version/:commitId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ViewVersion />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/analytics"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RunAnalytics />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/repo/:repoId/analytics"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RunAnalytics />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/orgs"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Organizations />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/orgs/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <NewOrganization />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/orgs/:orgId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <OrganizationDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="app/orgs/:orgId/teams/:teamId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TeamDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Public repo view (for forking) */}
              <Route path="repo/:repoId" element={<Suspense fallback={<PageLoader />}><ViewRepository /></Suspense>} />
            </Route>
          </Routes>
        </OnboardingProvider>
      </ErrorBoundary>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

export default App
