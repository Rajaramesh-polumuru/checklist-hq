import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { ArrowRight01Icon, Home01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground", className)}>
            <Link
                to="/app"
                className="flex items-center hover:text-foreground transition-colors"
                title="Dashboard"
            >
                <Icon icon={Home01Icon} className="h-4 w-4" />
            </Link>

            {items.map((item, index) => {
                const isLast = index === items.length - 1
                return (
                    <div key={index} className="flex items-center">
                        <Icon icon={ArrowRight01Icon} className="h-3 w-3 mx-2 text-muted-foreground/40" />
                        {item.href && !isLast ? (
                            <Link
                                to={item.href}
                                className="hover:text-foreground hover:underline underline-offset-4 transition-colors truncate max-w-[150px] sm:max-w-xs"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={cn(
                                "truncate max-w-[150px] sm:max-w-xs",
                                isLast ? "font-medium text-foreground" : ""
                            )}>
                                {item.label}
                            </span>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
