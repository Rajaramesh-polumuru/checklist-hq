import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'


interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  onboardingStep: number

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, data?: any) => Promise<boolean>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setOnboardingStep: (step: number) => void
  updateProfile: (updates: any) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  onboardingStep: 0,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  },

  signInWithPassword: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ session: data.session, user: data.user })
  },

  signUp: async (email, password, data) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
      },
    })
    if (error) throw error
    // Returns true if a session was created (auto-confirmed).
    // Returns false if email confirmation is required (no session yet).
    if (authData.session) {
      set({ session: authData.session, user: authData.user })
      return true
    }
    return false
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    set({ user: null, session: null })
  },

  updateProfile: async (updates) => {
    const { error } = await supabase.auth.updateUser({
      data: updates
    })
    if (error) throw error

    // Refresh user data
    const { data: { user } } = await supabase.auth.getUser()
    set({ user })
  },

  initialize: async () => {
    if (get().initialized) return

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, loading: false, initialized: true })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false, initialized: true })
    }
  },
}))
