import * as React from 'react'
import { cn } from '@/lib/utils'
import { CONTAINER_WIDTHS, SPACING, type ContainerWidth } from '@/lib/responsive'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to render inside the container
   */
  children: React.ReactNode
  
  /**
   * Maximum width of the container
   * @default 'page'
   */
  width?: ContainerWidth
  
  /**
   * Whether to apply standard page padding
   * @default true
   */
  spacing?: boolean
  
  /**
   * Whether the container should take full available height
   * @default false
   */
  fullHeight?: boolean
  
  /**
   * Whether to center the content horizontally
   * @default false
   */
  centered?: boolean
}

/**
 * PageContainer
 * 
 * A responsive container component that provides consistent page layout.
 * Follows the DESIGN_PHILOSOPHY.md principles for responsive design.
 * 
 * @example
 * ```tsx
 * // Standard page
 * <PageContainer>
 *   <YourContent />
 * </PageContainer>
 * 
 * // Full-width dashboard
 * <PageContainer width="wide">
 *   <Dashboard />
 * </PageContainer>
 * 
 * // Narrow form page
 * <PageContainer width="form" centered>
 *   <LoginForm />
 * </PageContainer>
 * 
 * // Without default padding
 * <PageContainer spacing={false}>
 *   <FullBleedContent />
 * </PageContainer>
 * ```
 */
const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ 
    children, 
    className, 
    width = 'page', 
    spacing = true, 
    fullHeight = false,
    centered = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'w-full mx-auto',
          
          // Width constraint
          CONTAINER_WIDTHS[width],
          
          // Spacing (padding)
          spacing && SPACING.page,
          
          // Full height
          fullHeight && 'min-h-[calc(100vh-3.5rem)] md:min-h-screen',
          
          // Centered content
          centered && 'flex flex-col items-center justify-center',
          
          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageContainer.displayName = 'PageContainer'

export { PageContainer }

/**
 * PageSection
 * 
 * A component for page sections with consistent vertical spacing
 */
export interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
}

const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn('py-6 md:py-8', className)}
        {...props}
      >
        {children}
      </section>
    )
  }
)
PageSection.displayName = 'PageSection'

export { PageSection }

/**
 * PageHeader
 * 
 * A component for page headers with consistent styling
 */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }

/**
 * PageTitle
 * 
 * A component for page titles with responsive typography
 */
export interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}

const PageTitle = React.forwardRef<HTMLHeadingElement, PageTitleProps>(
  ({ children, className, as: Component = 'h1', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-xl md:text-2xl font-bold tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
PageTitle.displayName = 'PageTitle'

export { PageTitle }

/**
 * ResponsiveGrid
 * 
 * A pre-configured responsive grid component
 */
export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  /**
   * Grid pattern to use
   * @default 'cards'
   */
  variant?: 'cards' | 'stats' | 'features' | 'threeCol' | 'auto'
}

const gridVariants = {
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
  features: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  threeCol: 'grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8',
  auto: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 sm:gap-6',
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ children, className, variant = 'cards', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResponsiveGrid.displayName = 'ResponsiveGrid'

export { ResponsiveGrid }
