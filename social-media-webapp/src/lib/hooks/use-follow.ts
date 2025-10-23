import { useState, useCallback } from 'react'
import { followService } from '@/lib/services/follow-service'
import { FollowStats } from '@/lib/types/follow'
import { useAuth } from '@/lib/contexts/auth-context'
import { toast } from 'sonner'

interface UseFollowOptions {
  userId: string
  initialStats?: FollowStats
  onFollowChange?: (isFollowing: boolean) => void
}

export function useFollow({ userId, initialStats, onFollowChange }: UseFollowOptions) {
  const { user } = useAuth()
  const [stats, setStats] = useState<FollowStats>(
    initialStats || {
      followers_count: 0,
      following_count: 0,
      is_following: false,
      is_followed_by: false
    }
  )
  const [isLoading, setIsLoading] = useState(false)

  const followUser = useCallback(async () => {
    if (!user || isLoading) return

    setIsLoading(true)

    // Optimistic update
    const previousStats = stats
    setStats(prev => ({
      ...prev,
      is_following: true,
      followers_count: prev.followers_count + 1
    }))

    try {
      const { error } = await followService.followUser(userId)
      
      if (error) {
        // Revert optimistic update
        setStats(previousStats)
        toast.error(error)
        return
      }

      onFollowChange?.(true)
      toast.success('User followed successfully')
    } catch (error) {
      // Revert optimistic update
      setStats(previousStats)
      toast.error('Failed to follow user')
    } finally {
      setIsLoading(false)
    }
  }, [user, userId, stats, isLoading, onFollowChange])

  const unfollowUser = useCallback(async () => {
    if (!user || isLoading) return

    setIsLoading(true)

    // Optimistic update
    const previousStats = stats
    setStats(prev => ({
      ...prev,
      is_following: false,
      followers_count: Math.max(0, prev.followers_count - 1)
    }))

    try {
      const { error } = await followService.unfollowUser(userId)
      
      if (error) {
        // Revert optimistic update
        setStats(previousStats)
        toast.error(error)
        return
      }

      onFollowChange?.(false)
      toast.success('User unfollowed successfully')
    } catch (error) {
      // Revert optimistic update
      setStats(previousStats)
      toast.error('Failed to unfollow user')
    } finally {
      setIsLoading(false)
    }
  }, [user, userId, stats, isLoading, onFollowChange])

  const toggleFollow = useCallback(() => {
    if (stats.is_following) {
      unfollowUser()
    } else {
      followUser()
    }
  }, [stats.is_following, followUser, unfollowUser])

  const refreshStats = useCallback(async () => {
    if (!userId) return

    try {
      const newStats = await followService.getFollowStats(userId, user?.id)
      setStats(newStats)
    } catch (error) {
      console.error('Failed to refresh follow stats:', error)
    }
  }, [userId, user?.id])

  return {
    stats,
    isLoading,
    followUser,
    unfollowUser,
    toggleFollow,
    refreshStats,
    isFollowing: stats.is_following,
    followersCount: stats.followers_count,
    followingCount: stats.following_count,
    isFollowedBy: stats.is_followed_by
  }
}