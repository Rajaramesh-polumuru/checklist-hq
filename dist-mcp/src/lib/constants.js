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
};
/**
 * Auto-save configuration
 */
export const AUTO_SAVE = {
    /** Debounce delay in milliseconds */
    debounceMs: 2000,
    /** Minimum time between saves (ms) */
    throttleMs: 5000,
};
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
};
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
};
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
};
/**
 * Dashboard configuration
 */
export const DASHBOARD = {
    /** Stats update animation duration (ms) */
    statCountUpDuration: 800,
    /** Card stagger delay per item (ms) */
    cardStaggerDelay: 50,
    /** Thresholds for badge logic */
    badges: {
        /** Days to consider a repository "new" */
        newThresholdDays: 7,
        /** Days to consider a repository "stale" */
        staleThresholdDays: 60,
        /** Fork count to consider a repository "popular" */
        popularForkCount: 10,
        /** Hours to consider a repository "recently used" */
        recentlyUsedHours: 24,
    },
    /** Filter options */
    filters: {
        visibility: ['all', 'public', 'private'],
        type: ['all', 'original', 'forked'],
        status: ['all', 'recent', 'stale'],
    },
    /** Sort options */
    sortOptions: ['updated', 'created', 'alpha', 'forks'],
    /** Activity timeline batch size */
    activityBatchSize: 20,
};
//# sourceMappingURL=constants.js.map