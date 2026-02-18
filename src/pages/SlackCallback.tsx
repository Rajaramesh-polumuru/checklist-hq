import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function SlackCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [returnPath, setReturnPath] = useState<string>('/app')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setErrorMessage(error === 'access_denied' ? 'Authorization was denied.' : `Error: ${error}`)
      return
    }

    if (!code) {
      setStatus('error')
      setErrorMessage('No authentication code received.')
      return
    }

    let orgId: string | undefined
    let userId: string | undefined
    let path = '/app'

    try {
      if (state) {
        const decodedState = JSON.parse(atob(state))
        orgId = decodedState.orgId
        userId = decodedState.userId
        if (decodedState.returnPath) {
          path = decodedState.returnPath
        }
      }
    } catch (e) {
      console.warn('Failed to parse state:', e)
    }

    setReturnPath(path)

    const exchangeCode = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const { data, error } = await supabase.functions.invoke('slack-oauth', {
          body: {
            code,
            redirectUri: `${window.location.origin}/integrations/slack/callback`,
            orgId,
            userId
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        if (error) throw new Error(error.message)
        if (!data?.success && data?.error) throw new Error(data.error)

        setStatus('success')
        toast.success('Slack workspace connected!')
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(path)
        }, 1500)
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect Slack.')
      }
    }

    exchangeCode()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'loading' && (
          <>
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Connecting to Slack...</h2>
            <p className="text-muted-foreground">Please wait while we complete the setup.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon={CheckmarkCircle01Icon} className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Success!</h2>
            <p className="text-muted-foreground">Your Slack workspace has been connected.</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
             <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon={AlertCircleIcon} className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Connection Failed</h2>
            <p className="text-destructive mb-4">{errorMessage}</p>
            <Button onClick={() => navigate(returnPath)}>
              Return to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
