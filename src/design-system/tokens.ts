export const tokens = {
    colors: {
        primary: {
            DEFAULT: "hsl(9 85% 55%)", // #ed462c
            foreground: "hsl(0 0% 100%)",
        },
        surface: {
            DEFAULT: "hsl(30 20% 99%)", // Warm slate
            foreground: "hsl(220 12% 10%)", // Dark slate
            0: "hsl(0 0% 100%)",
            1: "hsl(30 20% 97%)",
            2: "hsl(30 20% 94%)",
            3: "hsl(30 20% 90%)",
        },
        status: {
            success: "hsl(142 76% 36%)",
            warning: "hsl(32 95% 44%)",
            danger: "hsl(0 84% 60%)",
            info: "hsl(217 91% 60%)",
        },
    },
    spacing: {
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
    },
    motion: {
        timing: {
            instant: "0ms",
            fast: "100ms",
            normal: "200ms",
            slow: "300ms",
            shimmer: "1.5s",
        },
        easing: {
            default: [0.4, 0, 0.2, 1],
            bounce: [0.34, 1.56, 0.64, 1],
        },
    },
    elevation: {
        0: "0 0 0 0 transparent",
        1: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        2: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        3: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
    typography: {
        fontFamily: {
            sans: "Inter Display, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif",
        },
        settings: {
            default: '"salt" 1, "liga" 0, "clig" 0, "cv11" 1, "cv05" 1, "tnum" 1, "case" 1',
        },
    },
} as const;

export type Tokens = typeof tokens;
