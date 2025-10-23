import { useState, useEffect, useCallback } from 'react'
import { followService } from '@/lib/services/follow-service'
import { FollowListParams, FollowRelationship } from '@/lib/types/follow'

interface UseFollowListOptions extends Omit<FollowListParams, 'offset'> {
  enabled?: boolean
}

export function useFollowList({ 
  userId, 
  type, 
  limit = 20, 
  search, 
  enabled = true 
}: UseFollowListOptions) {
  const [users, setUsers] = useState<FollowRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const loadUsers = useCallback(async (reset = false) => {
    if (!enabled || loading) return

    setLoading(true)
    setError(null)

    try {
      const currentOffset = reset ? 0 : offset
      const response = await followService.getFollowList({
        userId,
        type,
        limit,
        offset: currentOffset,
        search
      })

      if (reset) {
        setUsers(response.users)
        setOffset(limit)
      } else {
        setUsers(prev => [...prev, ...response.users])
        setOffset(prev => prev + limit)
      }

      setHasMore(response.has_more)
      setTotalCount(response.total_count)
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading follow list:', err)
    } finally {
      setLoading(false)
    }
  }, [enabled, loading, offset, userId, type, limit, search])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadUsers(false)
    }
  }, [hasMore, loading, loadUsers])

  const refresh = useCallback(() => {
    setOffset(0)
    loadUsers(true)
  }, [loadUsers])

  // Load initial data
  useEffect(() => {
    if (enabled) {
      refresh()
    }
  }, [userId, type, search, enabled])

  // Reset when search changes
  useEffect(() => {
    if (enabled) {
      setOffset(0)
      loadUsers(true)
    }
  }, [search])

  return {
    users,
    loading,
    hasMore,
    totalCount,
    error,
    loadMore,
    refresh
  }
}