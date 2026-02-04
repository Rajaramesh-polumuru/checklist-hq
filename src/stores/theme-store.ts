import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'

  // Actions
  setTheme: (theme: Theme) => void
  initialize: () => void
}

const STORAGE_KEY = 'checklist-hq-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolvedTheme: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme) => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      // localStorage may not be available
    }

    applyTheme(resolvedTheme)
    set({ theme, resolvedTheme })
  },

  initialize: () => {
    // Get stored preference or default to 'system'
    let storedTheme: Theme = 'system'
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        storedTheme = stored
      }
    } catch (e) {
      // localStorage may not be available
    }

    const resolvedTheme = storedTheme === 'system' ? getSystemTheme() : storedTheme

    applyTheme(resolvedTheme)
    set({ theme: storedTheme, resolvedTheme })

    // Listen for system preference changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = () => {
        const currentTheme = get().theme
        if (currentTheme === 'system') {
          const newResolvedTheme = getSystemTheme()
          applyTheme(newResolvedTheme)
          set({ resolvedTheme: newResolvedTheme })
        }
      }

      mediaQuery.addEventListener('change', handleChange)
    }
  },
}))
