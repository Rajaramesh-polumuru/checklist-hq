import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuthStore } from '@/stores/auth-store'

// Lazy load all pages for code splitting
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Editor = lazy(() => import('@/pages/Editor').then(m => ({ default: m.Editor })))
const ActiveRuns = lazy(() => import('@/pages/ActiveRuns').then(m => ({ default: m.ActiveRuns })))
const RunHistory = lazy(() => import('@/pages/RunHistory').then(m => ({ default: m.RunHistory })))
const Activity = lazy(() => import('@/pages/Activity').then(m => ({ default: m.Activity })))
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })))
const Explore = lazy(() => import('@/pages/Explore').then(m => ({ default: m.Explore })))
const AuthCallback = lazy(() => import('@/pages/AuthCallback').then(m => ({ default: m.AuthCallback })))
const RunMode = lazy(() => import('@/pages/RunMode').then(m => ({ default: m.RunMode })))
const ViewRepository = lazy(() => import('@/pages/ViewRepository').then(m => ({ default: m.ViewRepository })))
const ViewVersion = lazy(() => import('@/pages/ViewVersion').then(m => ({ default: m.ViewVersion })))
const RunAnalytics = lazy(() => import('@/pages/RunAnalytics'))
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/Signup').then(m => ({ default: m.Signup })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
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

          {/* Public repo view (for forking) */}
          <Route path="repo/:repoId" element={<Suspense fallback={<PageLoader />}><ViewRepository /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
