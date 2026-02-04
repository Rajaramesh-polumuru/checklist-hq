import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme-store'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const cycleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-4 w-4" />
    } else if (theme === 'dark') {
      return <Moon className="h-4 w-4" />
    } else {
      return <Monitor className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    if (theme === 'light') {
      return 'Light mode (click for dark)'
    } else if (theme === 'dark') {
      return 'Dark mode (click for system)'
    } else {
      return 'System theme (click for light)'
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={getLabel()}
      className="text-muted-foreground hover:text-foreground"
    >
      {getIcon()}
    </Button>
  )
}
