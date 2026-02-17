export declare const tokens: {
    readonly colors: {
        readonly primary: {
            readonly DEFAULT: "hsl(9 85% 55%)";
            readonly foreground: "hsl(0 0% 100%)";
        };
        readonly surface: {
            readonly DEFAULT: "hsl(30 20% 99%)";
            readonly foreground: "hsl(220 12% 10%)";
            readonly 0: "hsl(0 0% 100%)";
            readonly 1: "hsl(30 20% 97%)";
            readonly 2: "hsl(30 20% 94%)";
            readonly 3: "hsl(30 20% 90%)";
        };
        readonly status: {
            readonly success: "hsl(142 76% 36%)";
            readonly warning: "hsl(32 95% 44%)";
            readonly danger: "hsl(0 84% 60%)";
            readonly info: "hsl(217 91% 60%)";
        };
    };
    readonly spacing: {
        readonly 0: "0px";
        readonly 1: "4px";
        readonly 2: "8px";
        readonly 3: "12px";
        readonly 4: "16px";
        readonly 6: "24px";
        readonly 8: "32px";
        readonly 12: "48px";
    };
    readonly motion: {
        readonly timing: {
            readonly instant: "0ms";
            readonly fast: "100ms";
            readonly normal: "200ms";
            readonly slow: "300ms";
            readonly shimmer: "1.5s";
        };
        readonly easing: {
            readonly default: readonly [0.4, 0, 0.2, 1];
            readonly bounce: readonly [0.34, 1.56, 0.64, 1];
        };
    };
    readonly elevation: {
        readonly 0: "0 0 0 0 transparent";
        readonly 1: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
        readonly 2: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
        readonly 3: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    };
    readonly typography: {
        readonly fontFamily: {
            readonly sans: "Inter Display, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif";
        };
        readonly settings: {
            readonly default: "\"salt\" 1, \"liga\" 0, \"clig\" 0, \"cv11\" 1, \"cv05\" 1, \"tnum\" 1, \"case\" 1";
        };
    };
};
export type Tokens = typeof tokens;
//# sourceMappingURL=tokens.d.ts.map