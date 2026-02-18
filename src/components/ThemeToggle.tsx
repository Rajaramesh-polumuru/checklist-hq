import Moon02Icon from '@hugeicons/core-free-icons/Moon02Icon'
import Sun03Icon from '@hugeicons/core-free-icons/Sun03Icon'
import ComputerIcon from '@hugeicons/core-free-icons/ComputerIcon'
import { Icon } from '@/components/ui/icon'
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
      return <Icon icon={Sun03Icon} className="h-4 w-4" />
    } else if (theme === 'dark') {
      return <Icon icon={Moon02Icon} className="h-4 w-4" />
    } else {
      return <Icon icon={ComputerIcon} className="h-4 w-4" />
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
