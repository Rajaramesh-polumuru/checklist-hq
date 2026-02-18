/**
 * Responsive Design System
 * Based on DESIGN_PHILOSOPHY.md
 * 
 * This module provides centralized responsive constants and utilities
 * to ensure consistency across the application.
 */

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Breakpoint values in pixels (for JS logic)
 * Use these with window.matchMedia or custom hooks
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// ============================================================================
// CONTAINER WIDTHS
// ============================================================================

/**
 * Container max-width classes
 * Use these for consistent page layout constraints
 */
export const CONTAINER_WIDTHS = {
  page: 'max-w-6xl',      // 1152px - Standard page content
  form: 'max-w-2xl',      // 672px - Forms, settings panels
  dialog: 'max-w-lg',     // 512px - Modal dialogs
  narrow: 'max-w-md',     // 448px - Auth pages, confirmations
  wide: 'max-w-[1400px]', // Dashboards, wide tables
  full: 'max-w-none',     // Full-width layouts
} as const

export type ContainerWidth = keyof typeof CONTAINER_WIDTHS

// ============================================================================
// SPACING
// ============================================================================

/**
 * Responsive spacing patterns
 * Follows mobile-first approach with progressive enhancement
 */
export const SPACING = {
  // Page container padding
  page: 'px-4 md:px-6 py-4 md:py-6',
  
  // Section gaps
  section: 'space-y-6 md:space-y-8',
  
  // Card padding
  card: 'p-4 md:p-6',
  
  // Gap utilities
  tight: 'gap-2',
  default: 'gap-4',
  loose: 'gap-6 md:gap-8',
  xloose: 'gap-8 md:gap-12',
} as const

// ============================================================================
// TOUCH TARGETS (WCAG AAA Compliant)
// ============================================================================

/**
 * Minimum touch target sizes
 * 44x44px is the WCAG AAA minimum for touch devices
 */
export const TOUCH_TARGETS = {
  // Mobile minimum (44px)
  mobile: 'h-11 min-h-[44px] min-w-[44px]',
  
  // Desktop scaling (36px)
  desktop: 'md:h-9',
  
  // Icon buttons
  icon: 'h-11 w-11 md:h-9 md:w-9',
  
  // Standard buttons
  button: 'h-11 md:h-9 px-4',
  
  // Small buttons
  buttonSm: 'h-10 md:h-8 px-3',
  
  // Large buttons
  buttonLg: 'h-12 md:h-11 px-6',
} as const

// ============================================================================
// GRID PATTERNS
// ============================================================================

/**
 * Predefined responsive grid layouts
 * Use these for consistent card and content grids
 */
export const GRIDS = {
  /**
   * Auto-fit grid that adapts to available space
   * Best for: Dynamic content where count varies
   */
  auto: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 sm:gap-6',
  
  /**
   * Explicit responsive card grid
   * Best for: Repository listings, template galleries
   * 1 col mobile -> 2 col tablet -> 3 col desktop -> 4 col wide
   */
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  
  /**
   * Stats/dashboard grid
   * Best for: Statistics, metrics cards
   * 1 col mobile -> 2 col tablet -> 4 col desktop
   */
  stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
  
  /**
   * Two-column layout (content + sidebar)
   * Stacks on mobile, side-by-side on desktop
   */
  twoColumn: 'flex flex-col lg:flex-row gap-6 md:gap-8',
  
  /**
   * Feature grid (2-3 columns)
   * Best for: Feature lists, use cases
   */
  features: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  
  /**
   * Three-column layout
   * Best for: Use cases, testimonials
   */
  threeCol: 'grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8',
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Responsive typography scale
 * All sizes use mobile-first approach
 */
export const TYPOGRAPHY = {
  // Page title (H1)
  pageTitle: 'text-xl md:text-2xl font-bold tracking-tight',
  
  // Section heading (H2)
  section: 'text-lg md:text-xl font-semibold',
  
  // Subsection (H3)
  subsection: 'text-base md:text-lg font-medium',
  
  // Body text
  body: 'text-sm text-foreground',
  
  // Secondary/supporting text
  secondary: 'text-sm text-muted-foreground',
  
  // Small text (metadata, badges)
  small: 'text-xs font-medium',
  
  // Monospace (code, IDs)
  mono: 'text-xs font-mono',
  
  // Input text (16px on mobile prevents iOS zoom)
  input: 'text-base md:text-sm',
  
  // Hero title (Home page)
  hero: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
} as const

// ============================================================================
// DIALOG / MODAL
// ============================================================================

/**
 * Responsive dialog constraints
 * Ensures dialogs are usable on all screen sizes
 */
export const DIALOG = {
  // Container constraints
  container: 'max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto',
  
  // Padding
  padding: 'p-4 sm:p-6',
  
  // Header padding
  header: 'p-4 sm:p-6 pb-0 sm:pb-0',
  
  // Footer layout (stacks on mobile)
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 sm:p-6 pt-0 sm:pt-0',
  
  // Mobile full-width variant
  mobileFull: 'w-full h-full sm:h-auto sm:max-w-lg',
} as const

// ============================================================================
// ANIMATION
// ============================================================================

/**
 * Animation duration constants
 * Consistent with DESIGN_PHILOSOPHY.md Section 2.3
 */
export const MOTION = {
  instant: 'duration-0',
  fast: 'duration-100',
  normal: 'duration-200',
  slow: 'duration-300',
  
  // Standard transition
  transition: 'transition-all duration-200 ease-in-out',
  
  // Enter animation
  enter: 'animate-in fade-in zoom-in-95 duration-200',
  
  // Exit animation
  exit: 'animate-out fade-out zoom-out-95 duration-100',
  
  // Slide in from bottom
  slideUp: 'animate-in slide-in-from-bottom-2 duration-200',
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-index scale
 * Never use arbitrary values, always use this scale
 */
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  overlay: 'z-30',
  modal: 'z-40',
  toast: 'z-50',
} as const

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

/**
 * Utility to check if a media query matches
 * For use in effects or non-React contexts
 */
export function matchMediaQuery(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`).matches
}

/**
 * Get current breakpoint name
 * Returns the largest matching breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint | null {
  if (typeof window === 'undefined') return null
  
  const width = window.innerWidth
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return null
}

// ============================================================================
// COMMON COMBINATIONS
// ============================================================================

/**
 * Pre-composed class combinations for common patterns
 */
export const PATTERNS = {
  // Card with consistent height and hover effect
  card: 'h-full min-h-[200px] flex flex-col transition-all duration-200',
  
  // Button with proper touch targets
  button: 'h-11 md:h-9 px-4 active:scale-95 transition-all duration-200',
  
  // Input with iOS-safe sizing
  input: 'h-11 md:h-10 text-base md:text-sm',
  
  // Scrollable container with hidden scrollbar
  scrollX: 'overflow-x-auto scrollbar-hide',
  scrollY: 'overflow-y-auto scrollbar-hide',
  
  // Flex row that stacks on mobile
  responsiveRow: 'flex flex-col sm:flex-row gap-4',
  
  // Centered container
  centered: 'flex items-center justify-center',
} as const

// ============================================================================
// TESTING HELPERS
// ============================================================================

/**
 * Viewport sizes for testing
 * Use these in your testing configuration
 */
export const VIEWPORT_SIZES = {
  mobileSmall: { width: 320, height: 568 },   // iPhone SE
  mobile: { width: 375, height: 667 },        // iPhone 14
  tablet: { width: 768, height: 1024 },       // iPad Mini
  desktop: { width: 1024, height: 768 },      // Desktop
  wide: { width: 1440, height: 900 },         // Wide desktop
} as const

/**
 * Check if code is running on client side
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if touch device
 */
export const isTouchDevice = isClient && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
