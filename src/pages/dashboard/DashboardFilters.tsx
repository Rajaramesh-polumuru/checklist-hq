import { FilterBar } from '@/components/FilterBar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Info } from 'lucide-react'
import { COLOR_LEGEND, type ColorStatus, type FilterState, type SortOption, getDefaultFilters } from '@/lib/dashboard-utils'

interface DashboardFiltersProps {
    filters: FilterState
    sortBy: SortOption
    onFiltersChange: (filters: FilterState) => void
    onSortChange: (sortBy: SortOption) => void
    loading?: boolean
    hasRepositories: boolean
}

function ColorLegend() {
    const visibleStatuses: ColorStatus[] = ['dormant', 'public', 'forked', 'popular', 'new', 'recently-used']

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Color Guide</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px] p-4">
                <h4 className="font-semibold mb-3 text-sm">Color Guide</h4>
                <div className="grid grid-cols-2 gap-3">
                    {visibleStatuses.map((status) => {
                        const config = COLOR_LEGEND[status]
                        const Icon = config.icon
                        return (
                            <div
                                key={status}
                                className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className={`w-3 h-3 rounded-full ${config.bg} shrink-0 mt-0.5 ring-2 ring-offset-2 ring-offset-popover ${config.bg}/30`} />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className={`h-3 w-3 ${config.text}`} />
                                        <span className="text-xs font-medium">{config.label}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
                    Colors indicate checklist status and history.
                </p>
            </DropdownMenuContent>
        </DropdownMenu>
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
