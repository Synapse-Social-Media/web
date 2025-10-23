'use client'

import { useState } from 'react'
import { Filter, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SearchFilters as SearchFiltersType } from '@/lib/types/search'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  className?: string
}

export function SearchFilters({
  filters,
  onFiltersChange,
  className
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = <K extends keyof SearchFiltersType>(
    key: K,
    value: SearchFiltersType[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      dateRange: 'all',
      sortBy: 'relevance',
      verified: undefined
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type && filters.type !== 'all') count++
    if (filters.dateRange && filters.dateRange !== 'all') count++
    if (filters.sortBy && filters.sortBy !== 'relevance') count++
    if (filters.verified !== undefined) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  const typeOptions = [
    { value: 'all', label: 'All Results' },
    { value: 'users', label: 'Users' },
    { value: 'posts', label: 'Posts' },
    { value: 'hashtags', label: 'Hashtags' }
  ] as const

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ] as const

  const sortByOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' }
  ] as const

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center justify-between p-2">
            <DropdownMenuLabel className="p-0">Search Filters</DropdownMenuLabel>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />

          {/* Content Type Filter */}
          <div className="p-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Content Type
            </Label>
            <div className="mt-2 space-y-1">
              {typeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => updateFilter('type', option.value)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm">{option.label}</span>
                  {filters.type === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Date Range Filter */}
          <div className="p-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range
            </Label>
            <div className="mt-2 space-y-1">
              {dateRangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => updateFilter('dateRange', option.value)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm">{option.label}</span>
                  {filters.dateRange === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Sort By Filter */}
          <div className="p-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Sort By
            </Label>
            <div className="mt-2 space-y-1">
              {sortByOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => updateFilter('sortBy', option.value)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm">{option.label}</span>
                  {filters.sortBy === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Verified Users Filter */}
          <div className="p-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="verified-filter" className="text-sm">
                Verified users only
              </Label>
              <Switch
                id="verified-filter"
                checked={filters.verified === true}
                onCheckedChange={(checked) => 
                  updateFilter('verified', checked ? true : undefined)
                }
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.type && filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {typeOptions.find(opt => opt.value === filters.type)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('type', 'all')}
                className="h-auto p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dateRange && filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('dateRange', 'all')}
                className="h-auto p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.sortBy && filters.sortBy !== 'relevance' && (
            <Badge variant="secondary" className="gap-1">
              {sortByOptions.find(opt => opt.value === filters.sortBy)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('sortBy', 'relevance')}
                className="h-auto p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.verified && (
            <Badge variant="secondary" className="gap-1">
              Verified only
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('verified', undefined)}
                className="h-auto p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}