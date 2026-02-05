import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Cancel01Icon, ArrowDown01Icon, Sorting05Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useMobile } from '@/hooks/useMobile'
import type { FilterState, SortOption } from '@/lib/dashboard-utils'
import { getActiveFilterCount } from '@/lib/dashboard-utils'

interface FilterBarProps {
  filters: FilterState
  sortBy: SortOption
  onFiltersChange: (filters: FilterState) => void
  onSortChange: (sortBy: SortOption) => void
  onClearFilters: () => void
}

export function FilterBar({
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onClearFilters,
}: FilterBarProps) {
  const { isMobile } = useMobile()
  const activeFilterCount = getActiveFilterCount(filters)

  const handleVisibilityChange = (visibility: FilterState['visibility']) => {
    onFiltersChange({ ...filters, visibility })
  }

  const handleTypeChange = (type: FilterState['type']) => {
    onFiltersChange({ ...filters, type })
  }

  const handleStatusChange = (status: FilterState['status']) => {
    onFiltersChange({ ...filters, status })
  }

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} gap-4 mb-6`}>
      {/* Filter Pills */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-start ${isMobile ? '' : 'items-center'} gap-3 flex-wrap`}>
        <span className="text-sm font-medium text-muted-foreground">Filters:</span>

        {/* Visibility Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${isMobile ? 'w-full' : ''} transition-all duration-200 ${filters.visibility !== 'all'
                  ? 'bg-primary/10 border-primary/30 shadow-sm scale-105'
                  : 'hover:border-border/60'
                }`}
            >
              Visibility: {filters.visibility === 'all' ? 'All' : filters.visibility.charAt(0).toUpperCase() + filters.visibility.slice(1)}
              <Icon icon={ArrowDown01Icon} className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleVisibilityChange('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleVisibilityChange('public')}>
              Public
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleVisibilityChange('private')}>
              Private
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${isMobile ? 'w-full' : ''} transition-all duration-200 ${filters.type !== 'all'
                  ? 'bg-primary/10 border-primary/30 shadow-sm scale-105'
                  : 'hover:border-border/60'
                }`}
            >
              Type: {filters.type === 'all' ? 'All' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
              <Icon icon={ArrowDown01Icon} className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleTypeChange('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTypeChange('original')}>
              Original
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTypeChange('forked')}>
              Forked
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${isMobile ? 'w-full' : ''} transition-all duration-200 ${filters.status !== 'all'
                  ? 'bg-primary/10 border-primary/30 shadow-sm scale-105'
                  : 'hover:border-border/60'
                }`}
            >
              Status: {filters.status === 'all' ? 'All' : filters.status === 'recent' ? 'Recently Updated' : 'Stale'}
              <Icon icon={ArrowDown01Icon} className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleStatusChange('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('recent')}>
              Recently Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('stale')}>
              Stale (60+ days)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground animate-fade-in transition-all hover:scale-105"
          >
            <Icon icon={Cancel01Icon} className="mr-1 h-3 w-3" />
            Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ''}
          </Button>
        )}
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={isMobile ? 'w-full' : ''}>
            <Icon icon={Sorting05Icon} className="mr-2 h-4 w-4" />
            Sort: {
              sortBy === 'updated' ? 'Recently Updated' :
                sortBy === 'created' ? 'Recently Created' :
                  sortBy === 'alpha' ? 'Alphabetical' :
                    'Most Forked'
            }
            <Icon icon={ArrowDown01Icon} className="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortChange('updated')}>
            Recently Updated
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('created')}>
            Recently Created
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('alpha')}>
            Alphabetical (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('forks')}>
            Most Forked
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
