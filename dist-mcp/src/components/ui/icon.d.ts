import type { HugeiconsIconProps } from '@hugeicons/react';
declare const SIZE_MAP: {
    readonly xs: 12;
    readonly sm: 16;
    readonly md: 20;
    readonly lg: 24;
    readonly xl: 32;
    readonly '2xl': 48;
};
interface IconProps extends Omit<HugeiconsIconProps, 'icon' | 'size'> {
    icon: any;
    size?: keyof typeof SIZE_MAP | number;
}
export declare function Icon({ icon, className, size, ...props }: IconProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=icon.d.ts.map