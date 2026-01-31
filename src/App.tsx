import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Dashboard } from '@/pages/Dashboard'
import { Editor } from '@/pages/Editor'
import { Explore } from '@/pages/Explore'
import { AuthCallback } from '@/pages/AuthCallback'
import { RunMode } from '@/pages/RunMode'
import { ViewRepository } from '@/pages/ViewRepository'
import { ViewVersion } from '@/pages/ViewVersion'
import { useAuthStore } from '@/stores/auth-store'

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
    return <Navigate to="/" replace />
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
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="auth/callback" element={<AuthCallback />} />

          {/* Protected routes */}
          <Route
            path="app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="app/new"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="app/repo/:repoId"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="app/run/:runId"
            element={
              <ProtectedRoute>
                <RunMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="app/run/start/:repoId"
            element={
              <ProtectedRoute>
                <RunMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="app/repo/:repoId/version/:commitId"
            element={
              <ProtectedRoute>
                <ViewVersion />
              </ProtectedRoute>
            }
          />

          {/* Public repo view (for forking) */}
          <Route path="repo/:repoId" element={<ViewRepository />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
