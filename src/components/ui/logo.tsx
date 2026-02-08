import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  forceTheme?: 'light' | 'dark'
  withText?: boolean
}

export function Logo({ className, size = 'md', forceTheme, withText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  }
  
  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center w-auto", sizeClasses[size])}>
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
      
      {withText && (
        <span className={cn(
          "font-brand font-bold tracking-tight shrink-0",
          textClasses[size],
          forceTheme === 'dark' ? "text-white" : forceTheme === 'light' ? "text-foreground" : "text-foreground"
        )}>
          Checklist HQ
        </span>
      )}
    </div>
  )
}
