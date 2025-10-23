import { createClient } from '@/lib/supabase/client'
import { FollowListParams, FollowListResponse, FollowStats, UserSuggestion, FollowRelationship } from '@/lib/types/follow'

export class FollowService {
  private supabase = createClient()

  /**
   * Follow a user
   */
  async followUser(followingId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { error: 'Not authenticated' }
      }

      // Check if already following
      const { data: existing } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single()

      if (existing) {
        return { error: 'Already following this user' }
      }

      // Insert follow relationship
      const { error } = await this.supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: followingId
        })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to follow user' }
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followingId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { error: 'Not authenticated' }
      }

      const { error } = await this.supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to unfollow user' }
    }
  }

  /**
   * Get follow stats for a user
   */
  async getFollowStats(userId: string, currentUserId?: string): Promise<FollowStats> {
    try {
      // Get user's follower and following counts
      const { data: user } = await this.supabase
        .from('users')
        .select('followers_count, following_count')
        .eq('uid', userId)
        .single()

      let isFollowing = false
      let isFollowedBy = false

      if (currentUserId && currentUserId !== userId) {
        // Check if current user is following this user
        const { data: followingData } = await this.supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single()

        isFollowing = !!followingData

        // Check if this user is following current user
        const { data: followerData } = await this.supabase
          .from('follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', currentUserId)
          .single()

        isFollowedBy = !!followerData
      }

      return {
        followers_count: user?.followers_count || 0,
        following_count: user?.following_count || 0,
        is_following: isFollowing,
        is_followed_by: isFollowedBy
      }
    } catch (error) {
      return {
        followers_count: 0,
        following_count: 0,
        is_following: false,
        is_followed_by: false
      }
    }
  }

  /**
   * Get followers or following list with pagination
   */
  async getFollowList(params: FollowListParams): Promise<FollowListResponse> {
    try {
      const { userId, type, limit = 20, offset = 0, search } = params

      // First get the follow relationships
      let followQuery = this.supabase
        .from('follows')
        .select('id, follower_id, following_id, created_at')

      if (type === 'followers') {
        followQuery = followQuery.eq('following_id', userId)
      } else {
        followQuery = followQuery.eq('follower_id', userId)
      }

      // Get total count
      const { count } = await this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq(type === 'followers' ? 'following_id' : 'follower_id', userId)

      // Get paginated follow relationships
      const { data: followData, error: followError } = await followQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (followError) {
        throw followError
      }

      if (!followData || followData.length === 0) {
        return {
          users: [],
          total_count: count || 0,
          has_more: false
        }
      }

      // Get user IDs to fetch
      const userIds = followData.map(follow => 
        type === 'followers' ? follow.follower_id : follow.following_id
      )

      // Fetch user details
      let userQuery = this.supabase
        .from('users')
        .select(`
          id,
          uid,
          email,
          username,
          display_name,
          biography,
          avatar,
          profile_cover_image,
          account_premium,
          verify,
          followers_count,
          following_count,
          posts_count,
          created_at,
          updated_at
        `)
        .in('uid', userIds)

      // Add search filter if provided
      if (search) {
        userQuery = userQuery.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
      }

      const { data: userData, error: userError } = await userQuery

      if (userError) {
        throw userError
      }

      // Combine follow data with user data
      const transformedData: FollowRelationship[] = followData.map(follow => {
        const targetUserId = type === 'followers' ? follow.follower_id : follow.following_id
        const user = userData?.find(u => u.uid === targetUserId)
        
        return {
          id: follow.id,
          follower_id: follow.follower_id,
          following_id: follow.following_id,
          created_at: follow.created_at,
          user: user || undefined
        }
      }).filter(item => item.user) // Only include items where user was found

      return {
        users: transformedData,
        total_count: count || 0,
        has_more: (count || 0) > offset + limit
      }
    } catch (error) {
      return {
        users: [],
        total_count: 0,
        has_more: false
      }
    }
  }

  /**
   * Get user suggestions based on mutual followers and other factors
   */
  async getUserSuggestions(limit: number = 10): Promise<UserSuggestion[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return []
      }

      // Get users that current user is not following
      const { data: suggestions } = await this.supabase
        .from('users')
        .select(`
          *,
          mutual_followers:follows!follows_following_id_fkey(
            follower_id
          )
        `)
        .neq('uid', user.id)
        .not('uid', 'in', `(
          SELECT following_id 
          FROM follows 
          WHERE follower_id = '${user.id}'
        )`)
        .order('followers_count', { ascending: false })
        .limit(limit * 2) // Get more to filter and sort

      if (!suggestions) {
        return []
      }

      // Process suggestions to add mutual followers count and reason
      const processedSuggestions: UserSuggestion[] = suggestions.map(user => {
        const mutualFollowersCount = 0 // This would need a more complex query
        let suggestionReason: UserSuggestion['suggestion_reason'] = 'new_user'

        if (user.followers_count > 1000) {
          suggestionReason = 'popular'
        } else if (mutualFollowersCount > 0) {
          suggestionReason = 'mutual_followers'
        }

        return {
          ...user,
          mutual_followers_count: mutualFollowersCount,
          suggestion_reason: suggestionReason
        }
      })

      // Sort by relevance and return limited results
      return processedSuggestions
        .sort((a, b) => {
          // Prioritize by mutual followers, then by follower count
          if (a.mutual_followers_count !== b.mutual_followers_count) {
            return b.mutual_followers_count - a.mutual_followers_count
          }
          return b.followers_count - a.followers_count
        })
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting user suggestions:', error)
      return []
    }
  }

  /**
   * Check if current user is following a specific user
   */
  async isFollowing(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return false
      }

      const { data } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  /**
   * Get mutual followers between current user and another user
   */
  async getMutualFollowers(_targetUserId: string, _maxResults: number = 5): Promise<any[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return []
      }

      // This would need a more complex query to get mutual followers
      // For now, return empty array
      return []
    } catch (error) {
      return []
    }
  }
}

export const followService = new FollowService()