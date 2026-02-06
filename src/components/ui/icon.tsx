import { HugeiconsIcon } from '@hugeicons/react'
import type { HugeiconsIconProps } from '@hugeicons/react'
import { cn } from '@/lib/utils'

const SIZE_MAP = {
    xs: 12, // 12px
    sm: 16, // 16px
    md: 20, // 20px
    lg: 24, // 24px
    xl: 32, // 32px
    '2xl': 48, // 48px
} as const

interface IconProps extends Omit<HugeiconsIconProps, 'icon' | 'size'> {
    icon: any // The specific icon from core-free-icons
    size?: keyof typeof SIZE_MAP | number
}

export function Icon({ icon, className, size = 'md', ...props }: IconProps) {
    const sizeValue = typeof size === 'number' ? size : SIZE_MAP[size]

    return (
        <HugeiconsIcon
            icon={icon}
            size={sizeValue}
            className={cn("shrink-0", className)}
            {...props}
        />
    )
}
