import { jsx as _jsx } from "react/jsx-runtime";
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
const SIZE_MAP = {
    xs: 12, // 12px
    sm: 16, // 16px
    md: 20, // 20px
    lg: 24, // 24px
    xl: 32, // 32px
    '2xl': 48, // 48px
};
export function Icon({ icon, className, size = 'md', ...props }) {
    const sizeValue = typeof size === 'number' ? size : SIZE_MAP[size];
    return (_jsx(HugeiconsIcon, { icon: icon, size: sizeValue, className: cn("shrink-0", className), ...props }));
}
//# sourceMappingURL=icon.js.map