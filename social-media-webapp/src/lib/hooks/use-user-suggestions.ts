import { useState, useEffect, useCallback } from 'react'
import { followService } from '@/lib/services/follow-service'
import { UserSuggestion } from '@/lib/types/follow'

interface UseUserSuggestionsOptions {
  limit?: number
  enabled?: boolean
}

export function useUserSuggestions({ 
  limit = 10, 
  enabled = true 
}: UseUserSuggestionsOptions = {}) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSuggestions = useCallback(async () => {
    if (!enabled || loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await followService.getUserSuggestions(limit)
      setSuggestions(data)
    } catch (err) {
      setError('Failed to load user suggestions')
      console.error('Error loading user suggestions:', err)
    } finally {
      setLoading(false)
    }
  }, [enabled, loading, limit])

  const refresh = useCallback(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const removeSuggestion = useCallback((userId: string) => {
    setSuggestions(prev => prev.filter(user => user.uid !== userId))
  }, [])

  // Load initial data
  useEffect(() => {
    if (enabled) {
      loadSuggestions()
    }
  }, [enabled, limit])

  return {
    suggestions,
    loading,
    error,
    refresh,
    removeSuggestion
  }
}