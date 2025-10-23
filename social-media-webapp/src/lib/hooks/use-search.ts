import { useState, useEffect, useCallback, useMemo } from 'react'
import { searchService } from '@/lib/services/search-service'
import { 
  SearchResults, 
  SearchFilters, 
  SearchSuggestion, 
  TrendingTopic 
} from '@/lib/types/search'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  enableSuggestions?: boolean
  enableTrending?: boolean
}

interface UseSearchReturn {
  // Search state
  query: string
  setQuery: (query: string) => void
  results: SearchResults[]
  isLoading: boolean
  error: string | null
  
  // Filters
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  
  // Suggestions
  suggestions: SearchSuggestion[]
  isSuggestionsLoading: boolean
  
  // Trending
  trendingTopics: TrendingTopic[]
  isTrendingLoading: boolean
  
  // Actions
  search: (query?: string) => Promise<void>
  clearSearch: () => void
  loadMore: () => Promise<void>
  
  // State
  hasMore: boolean
  totalResults: number
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    enableSuggestions = true,
    enableTrending = true
  } = options

  // Core search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  })
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  
  // Trending
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(false)
  
  // Pagination
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalResults, setTotalResults] = useState(0)

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout

    return (searchQuery: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (searchQuery.length >= minQueryLength) {
          performSearch(searchQuery, true)
        } else {
          setResults([])
          setTotalResults(0)
          setHasMore(false)
        }
      }, debounceMs)
    }
  }, [debounceMs, minQueryLength])

  // Debounced suggestions function
  const debouncedSuggestions = useMemo(() => {
    let timeoutId: NodeJS.Timeout

    return (searchQuery: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (enableSuggestions && searchQuery.length >= 1) {
          loadSuggestions(searchQuery)
        } else {
          setSuggestions([])
        }
      }, 150) // Faster for suggestions
    }
  }, [enableSuggestions])

  // Perform the actual search
  const performSearch = useCallback(async (
    searchQuery: string, 
    reset: boolean = false,
    customFilters?: SearchFilters
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const searchFilters = customFilters || filters
      const page = reset ? 0 : currentPage
      const limit = 20
      const offset = page * limit

      const searchResults = await searchService.search(
        searchQuery, 
        searchFilters, 
        limit + 1 // Get one extra to check if there are more
      )

      // Check if there are more results
      const hasMoreResults = searchResults.length > limit
      const finalResults = hasMoreResults ? searchResults.slice(0, limit) : searchResults

      if (reset) {
        setResults(finalResults)
        setCurrentPage(1)
      } else {
        setResults(prev => [...prev, ...finalResults])
        setCurrentPage(prev => prev + 1)
      }

      setHasMore(hasMoreResults)
      setTotalResults(prev => reset ? finalResults.length : prev + finalResults.length)

    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage])

  // Load search suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    try {
      setIsSuggestionsLoading(true)
      const suggestionResults = await searchService.getSearchSuggestions(searchQuery)
      setSuggestions(suggestionResults)
    } catch (err) {
      console.error('Suggestions error:', err)
      setSuggestions([])
    } finally {
      setIsSuggestionsLoading(false)
    }
  }, [])

  // Load trending topics
  const loadTrendingTopics = useCallback(async () => {
    if (!enableTrending) return

    try {
      setIsTrendingLoading(true)
      const trending = await searchService.getTrendingTopics(10)
      setTrendingTopics(trending)
    } catch (err) {
      console.error('Trending topics error:', err)
      setTrendingTopics([])
    } finally {
      setIsTrendingLoading(false)
    }
  }, [enableTrending])

  // Public search function
  const search = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery ?? query
    if (queryToSearch.length >= minQueryLength) {
      await performSearch(queryToSearch, true)
    }
  }, [query, minQueryLength, performSearch])

  // Load more results
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading && query.length >= minQueryLength) {
      await performSearch(query, false)
    }
  }, [hasMore, isLoading, query, minQueryLength, performSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setSuggestions([])
    setError(null)
    setHasMore(false)
    setCurrentPage(0)
    setTotalResults(0)
  }, [])

  // Effect for query changes (debounced search)
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query.trim())
      debouncedSuggestions(query.trim())
    } else {
      setResults([])
      setSuggestions([])
      setTotalResults(0)
      setHasMore(false)
    }
  }, [query, debouncedSearch, debouncedSuggestions])

  // Effect for filter changes
  useEffect(() => {
    if (query.length >= minQueryLength) {
      performSearch(query, true, filters)
    }
  }, [filters]) // Don't include performSearch in deps to avoid infinite loop

  // Load trending topics on mount
  useEffect(() => {
    loadTrendingTopics()
  }, [loadTrendingTopics])

  return {
    // Search state
    query,
    setQuery,
    results,
    isLoading,
    error,
    
    // Filters
    filters,
    setFilters,
    
    // Suggestions
    suggestions,
    isSuggestionsLoading,
    
    // Trending
    trendingTopics,
    isTrendingLoading,
    
    // Actions
    search,
    clearSearch,
    loadMore,
    
    // State
    hasMore,
    totalResults
  }
}