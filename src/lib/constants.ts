/**
 * Design system constants
 * Centralizes magic numbers and ensures consistency across the application
 */

export const DESIGN_TOKENS = {
  /**
   * Spacing constants
   */
  spacing: {
    /** Indentation per nesting level in checklist items (px) */
    itemIndentPx: 24,

    /** Standard container padding */
    containerPadding: 'px-4',

    /** Standard section vertical spacing */
    sectionSpacing: 'py-8',
  },

  /**
   * Layout constants
   */
  layout: {
    /** Maximum width for content containers */
    containerMaxWidth: '3xl',

    /** Header height */
    headerHeight: 'h-14',

    /** Z-index layers */
    zIndex: {
      header: 10,
      modal: 50,
      tooltip: 60,
    },
  },

  /**
   * Animation constants
   */
  animation: {
    /** Default transition duration (ms) */
    defaultDuration: 200,

    /** Slow transition duration (ms) */
    slowDuration: 300,

    /** Fast transition duration (ms) */
    fastDuration: 100,
  },

  /**
   * Touch target sizes for accessibility (WCAG 2.5.5)
   */
  touchTarget: {
    /** Minimum touch target size (px) - WCAG AAA compliance */
    minSize: 44,

    /** Minimum padding for interactive elements */
    minPadding: 'p-2',
  },

  /**
   * Border radius values
   */
  radius: {
    /** Small elements (inputs, small buttons) */
    sm: 'rounded-md',

    /** Medium elements (cards, modals) */
    md: 'rounded-lg',

    /** Large elements (page containers) */
    lg: 'rounded-xl',
  },
} as const

/**
 * Auto-save configuration
 */
export const AUTO_SAVE = {
  /** Debounce delay in milliseconds */
  debounceMs: 2000,

  /** Minimum time between saves (ms) */
  throttleMs: 5000,
} as const

/**
 * Search configuration
 */
export const SEARCH = {
  /** Debounce delay for search input (ms) */
  debounceMs: 400,

  /** Minimum characters before triggering search */
  minCharacters: 1,

  /** Default results limit */
  defaultLimit: 20,

  /** Maximum results to show */
  maxResults: 50,
} as const

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  save: { key: 's', modifiers: ['meta', 'ctrl'] },
  undo: { key: 'z', modifiers: ['meta', 'ctrl'] },
  redo: { key: 'z', modifiers: ['meta', 'ctrl', 'shift'] },
  newItem: { key: 'Enter' },
  indent: { key: 'Tab' },
  outdent: { key: 'Tab', modifiers: ['shift'] },
  delete: { key: 'Backspace' },
  navigateUp: { key: 'ArrowUp' },
  navigateDown: { key: 'ArrowDown' },
  search: { key: 'k', modifiers: ['meta', 'ctrl'] },
} as const

/**
 * API configuration
 */
export const API = {
  /** Maximum retries for failed requests */
  maxRetries: 3,

  /** Retry delay in milliseconds */
  retryDelayMs: 1000,

  /** Request timeout in milliseconds */
  timeoutMs: 30000,
} as const
