import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  forceTheme?: 'light' | 'dark'
}

export function Logo({ className, size = 'md', forceTheme }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto',
  }

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      <img 
        src="/logos/logo-light.svg" 
        alt="Checklist HQ Logo" 
        className={cn(
          "h-full w-auto object-contain",
          forceTheme === 'dark' ? "hidden" : forceTheme === 'light' ? "block" : "dark:hidden"
        )}
      />
      <img 
        src="/logos/logo-dark.svg" 
        alt="Checklist HQ Logo" 
        className={cn(
          "h-full w-auto object-contain",
          forceTheme === 'light' ? "hidden" : forceTheme === 'dark' ? "block" : "hidden dark:block"
        )}
      />
    </div>
  )
}
