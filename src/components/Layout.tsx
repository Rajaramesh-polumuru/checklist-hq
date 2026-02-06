import { useState, useEffect } from 'react'
import { useThemeStore } from '@/stores/theme-store'
import { PageTransition } from '@/components/PageTransition'
import { Sidebar } from '@/components/Sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Menu01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export function Layout() {
  const initializeTheme = useThemeStore((state) => state.initialize)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only-focusable focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg transition-all"
      >
        Skip to main content
      </a>

      {/* Sidebar (Desktop & Mobile Drawer logic inside) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        openMobile={mobileMenuOpen}
        setOpenMobile={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
      )}>

        {/* Mobile Header (only visible on mobile) */}
        <header className="md:hidden h-14 border-b flex items-center px-4 justify-between bg-card/80 backdrop-blur-sm sticky top-0 z-20 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Icon icon={Menu01Icon} className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">Checklist HQ</span>
          <ThemeToggle />
        </header>

        {/* Desktop Theme Toggle (Absolute positioned for now, or integrated into pages) 
            Ideally should be in Sidebar or Header. 
            Sidebar bottom is good. 
        */}
        <div className="hidden md:block absolute top-4 right-4 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background/50"
        >
          <div className="w-full min-h-full">
            <PageTransition />
          </div>
        </main>
      </div>
    </div>
  )
}
