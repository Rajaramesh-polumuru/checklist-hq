import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export function AuthCallback() {
  const navigate = useNavigate()
  const { setSession } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        console.error('Auth callback error:', error)
        navigate('/')
        return
      }
      // Sync session into the store so ProtectedRoute sees the user immediately
      setSession(data.session)
      navigate('/app')
    }

    handleAuthCallback()
  }, [navigate, setSession])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
