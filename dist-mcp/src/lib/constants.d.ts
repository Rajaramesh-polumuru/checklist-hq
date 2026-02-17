/**
 * Design system constants
 * Centralizes magic numbers and ensures consistency across the application
 */
export declare const DESIGN_TOKENS: {
    /**
     * Spacing constants
     */
    readonly spacing: {
        /** Indentation per nesting level in checklist items (px) */
        readonly itemIndentPx: 24;
        /** Standard container padding */
        readonly containerPadding: "px-4";
        /** Standard section vertical spacing */
        readonly sectionSpacing: "py-8";
    };
    /**
     * Layout constants
     */
    readonly layout: {
        /** Maximum width for content containers */
        readonly containerMaxWidth: "3xl";
        /** Header height */
        readonly headerHeight: "h-14";
        /** Z-index layers */
        readonly zIndex: {
            readonly header: 10;
            readonly modal: 50;
            readonly tooltip: 60;
        };
    };
    /**
     * Animation constants
     */
    readonly animation: {
        /** Default transition duration (ms) */
        readonly defaultDuration: 200;
        /** Slow transition duration (ms) */
        readonly slowDuration: 300;
        /** Fast transition duration (ms) */
        readonly fastDuration: 100;
    };
    /**
     * Touch target sizes for accessibility (WCAG 2.5.5)
     */
    readonly touchTarget: {
        /** Minimum touch target size (px) - WCAG AAA compliance */
        readonly minSize: 44;
        /** Minimum padding for interactive elements */
        readonly minPadding: "p-2";
    };
    /**
     * Border radius values
     */
    readonly radius: {
        /** Small elements (inputs, small buttons) */
        readonly sm: "rounded-md";
        /** Medium elements (cards, modals) */
        readonly md: "rounded-lg";
        /** Large elements (page containers) */
        readonly lg: "rounded-xl";
    };
};
/**
 * Auto-save configuration
 */
export declare const AUTO_SAVE: {
    /** Debounce delay in milliseconds */
    readonly debounceMs: 2000;
    /** Minimum time between saves (ms) */
    readonly throttleMs: 5000;
};
/**
 * Search configuration
 */
export declare const SEARCH: {
    /** Debounce delay for search input (ms) */
    readonly debounceMs: 400;
    /** Minimum characters before triggering search */
    readonly minCharacters: 1;
    /** Default results limit */
    readonly defaultLimit: 20;
    /** Maximum results to show */
    readonly maxResults: 50;
};
/**
 * Keyboard shortcuts
 */
export declare const KEYBOARD_SHORTCUTS: {
    readonly save: {
        readonly key: "s";
        readonly modifiers: readonly ["meta", "ctrl"];
    };
    readonly undo: {
        readonly key: "z";
        readonly modifiers: readonly ["meta", "ctrl"];
    };
    readonly redo: {
        readonly key: "z";
        readonly modifiers: readonly ["meta", "ctrl", "shift"];
    };
    readonly newItem: {
        readonly key: "Enter";
    };
    readonly indent: {
        readonly key: "Tab";
    };
    readonly outdent: {
        readonly key: "Tab";
        readonly modifiers: readonly ["shift"];
    };
    readonly delete: {
        readonly key: "Backspace";
    };
    readonly navigateUp: {
        readonly key: "ArrowUp";
    };
    readonly navigateDown: {
        readonly key: "ArrowDown";
    };
    readonly search: {
        readonly key: "k";
        readonly modifiers: readonly ["meta", "ctrl"];
    };
};
/**
 * API configuration
 */
export declare const API: {
    /** Maximum retries for failed requests */
    readonly maxRetries: 3;
    /** Retry delay in milliseconds */
    readonly retryDelayMs: 1000;
    /** Request timeout in milliseconds */
    readonly timeoutMs: 30000;
};
/**
 * Dashboard configuration
 */
export declare const DASHBOARD: {
    /** Stats update animation duration (ms) */
    readonly statCountUpDuration: 800;
    /** Card stagger delay per item (ms) */
    readonly cardStaggerDelay: 50;
    /** Thresholds for badge logic */
    readonly badges: {
        /** Days to consider a repository "new" */
        readonly newThresholdDays: 7;
        /** Days to consider a repository "stale" */
        readonly staleThresholdDays: 60;
        /** Fork count to consider a repository "popular" */
        readonly popularForkCount: 10;
        /** Hours to consider a repository "recently used" */
        readonly recentlyUsedHours: 24;
    };
    /** Filter options */
    readonly filters: {
        readonly visibility: readonly ["all", "public", "private"];
        readonly type: readonly ["all", "original", "forked"];
        readonly status: readonly ["all", "recent", "stale"];
    };
    /** Sort options */
    readonly sortOptions: readonly ["updated", "created", "alpha", "forks"];
    /** Activity timeline batch size */
    readonly activityBatchSize: 20;
};
//# sourceMappingURL=constants.d.ts.map