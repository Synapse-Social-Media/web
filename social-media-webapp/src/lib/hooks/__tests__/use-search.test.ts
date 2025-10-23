import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useSearch } from '../use-search'
import { searchService } from '@/lib/services/search-service'

// Mock the search service
vi.mock('@/lib/services/search-service', () => ({
  searchService: {
    search: vi.fn(),
    getSearchSuggestions: vi.fn(),
    getTrendingTopics: vi.fn()
  }
}))

const mockSearchService = searchService as any

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchService.search.mockResolvedValue([])
    mockSearchService.getSearchSuggestions.mockResolvedValue([])
    mockSearchService.getTrendingTopics.mockResolvedValue([])
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSearch())

    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.suggestions).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })

  it('updates query when setQuery is called', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test query')
    })

    expect(result.current.query).toBe('test query')
  })

  it('performs search when query changes', async () => {
    const mockResults = [
      { id: 'result-1', type: 'user' as const, user: { id: '1', username: 'test' } }
    ]
    mockSearchService.search.mockResolvedValue(mockResults)

    const { result } = renderHook(() => useSearch({ minQueryLength: 2 }))

    act(() => {
      result.current.setQuery('test')
    })

    await waitFor(() => {
      expect(mockSearchService.search).toHaveBeenCalledWith('test', expect.any(Object), 21)
    })
  })

  it('loads suggestions when query changes', async () => {
    const mockSuggestions = [
      { id: 'suggestion-1', text: 'test user', type: 'user' as const }
    ]
    mockSearchService.getSearchSuggestions.mockResolvedValue(mockSuggestions)

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('t')
    })

    await waitFor(() => {
      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith('t')
    })
  })

  it('loads trending topics on mount', async () => {
    const mockTrending = [
      { id: 'trending-1', hashtag: 'test', post_count: 100, growth_rate: 0.8 }
    ]
    mockSearchService.getTrendingTopics.mockResolvedValue(mockTrending)

    renderHook(() => useSearch())

    await waitFor(() => {
      expect(mockSearchService.getTrendingTopics).toHaveBeenCalledWith(10)
    })
  })

  it('clears search results and suggestions', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    act(() => {
      result.current.clearSearch()
    })

    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.suggestions).toEqual([])
  })

  it('updates filters and triggers new search', async () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    act(() => {
      result.current.setFilters({ type: 'users' })
    })

    await waitFor(() => {
      expect(mockSearchService.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ type: 'users' }),
        21
      )
    })
  })

  it('handles search errors gracefully', async () => {
    mockSearchService.search.mockRejectedValue(new Error('Search failed'))

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to search. Please try again.')
    })
  })
})