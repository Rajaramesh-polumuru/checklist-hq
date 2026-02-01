import { Search, X, Loader2 } from 'lucide-react'
import { forwardRef, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  /** Current search value */
  value: string
  /** Callback when search value changes */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether search is currently loading */
  loading?: boolean
  /** Number of results found (optional) */
  resultCount?: number
  /** Size variant */
  size?: 'default' | 'large'
  /** Additional CSS classes */
  className?: string
  /** Autofocus on mount */
  autoFocus?: boolean
  /** ARIA label for accessibility */
  ariaLabel?: string
}

/**
 * Professional search input component with loading states, clear button,
 * and result count display. Follows WCAG AAA accessibility guidelines.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Search...',
      loading = false,
      resultCount,
      size = 'default',
      className,
      autoFocus = false,
      ariaLabel = 'Search',
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    // Merge refs
    useEffect(() => {
      if (ref && inputRef.current) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    const handleClear = () => {
      onChange('')
      inputRef.current?.focus()
    }

    const showClear = value.length > 0 && !loading
    const showResultCount = resultCount !== undefined && value.length > 0

    const sizeClasses = {
      default: 'h-10 text-sm pl-10 pr-10',
      large: 'h-12 text-base pl-12 pr-12',
    }

    const iconSize = size === 'large' ? 20 : 18

    return (
      <div className="relative w-full">
        {/* Search Icon */}
        <div className="absolute left-0 top-0 h-full flex items-center pl-3 pointer-events-none">
          {loading ? (
            <Loader2
              className="text-muted-foreground animate-spin"
              size={iconSize}
              aria-label="Searching"
            />
          ) : (
            <Search className="text-muted-foreground" size={iconSize} aria-hidden="true" />
          )}
        </div>

        {/* Input Field */}
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            sizeClasses[size],
            'rounded-xl border-2 focus:border-primary/50 transition-colors',
            className
          )}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-busy={loading}
          aria-live="polite"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {showClear && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0 hover:bg-muted rounded-md"
              aria-label="Clear search"
            >
              <X size={16} />
            </Button>
          </div>
        )}

        {/* Result Count */}
        {showResultCount && !loading && (
          <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
            {resultCount === 0 ? (
              <span>No results found</span>
            ) : (
              <span>
                {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
