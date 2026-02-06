import { FilterBar } from '@/components/FilterBar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Icon } from '@/components/ui/icon'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { COLOR_LEGEND, type ColorStatus, type FilterState, type SortOption, getDefaultFilters } from '@/lib/dashboard-utils'
import { cn } from '@/lib/utils'

interface DashboardFiltersProps {
    filters: FilterState
    sortBy: SortOption
    onFiltersChange: (filters: FilterState) => void
    onSortChange: (sortBy: SortOption) => void
    loading?: boolean
    hasRepositories: boolean
}

// Single row color indicator
function ColorRow({ status }: { status: ColorStatus }) {
    const config = COLOR_LEGEND[status]

    return (
        <div className="flex items-center gap-2 py-1">
            <span
                className={cn(
                    "size-2.5 rounded-full shrink-0",
                    "ring-[1.5px] ring-offset-1 ring-offset-popover",
                    config.bg,
                    config.bg.replace('bg-', 'ring-').replace('-300', '-400')
                )}
            />
            <span className="text-xs font-medium text-foreground">
                {config.label}
            </span>
        </div>
    )
}

function ColorLegend() {
    const visibleStatuses: ColorStatus[] = ['dormant', 'public', 'forked', 'popular', 'new', 'recently-used']

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex items-center gap-1.5 text-xs text-muted-foreground",
                        "rounded-md px-2 py-1 -mr-2",
                        "transition-all duration-200 ease-in-out",
                        "hover:text-foreground hover:bg-muted/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "active:scale-95"
                    )}
                >
                    {/* Mini color preview */}
                    <span className="flex -space-x-1">
                        {['dormant', 'public', 'popular'].map((s) => (
                            <span
                                key={s}
                                className={cn(
                                    "size-2 rounded-full border border-popover",
                                    COLOR_LEGEND[s as ColorStatus].bg
                                )}
                            />
                        ))}
                    </span>
                    <Icon icon={InformationCircleIcon} className="size-3.5 stroke-[1.5]" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-auto p-3"
            >
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Status Colors
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    {visibleStatuses.map((status) => (
                        <ColorRow key={status} status={status} />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function DashboardFilters({
    filters,
    sortBy,
    onFiltersChange,
    onSortChange,
    loading,
    hasRepositories
}: DashboardFiltersProps) {
    if (loading || !hasRepositories) return null

    return (
        <div className="mb-6 flex items-center justify-between">
            <FilterBar
                filters={filters}
                sortBy={sortBy}
                onFiltersChange={onFiltersChange}
                onSortChange={onSortChange}
                onClearFilters={() => onFiltersChange(getDefaultFilters())}
            />
            <div className="ml-4">
                <ColorLegend />
            </div>
        </div>
    )
}
