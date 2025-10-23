import { createClient } from '@/lib/supabase/client'

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'followers'
  message_requests: boolean
  show_online_status: boolean
  show_read_receipts: boolean
  search_visibility: boolean
  story_visibility: 'public' | 'followers' | 'close_friends'
}

export interface BlockedUser {
  id: string
  blocked_id: string
  blocked_user?: {
    username: string | null
    display_name: string | null
    avatar: string | null
  }
  reason?: string
  created_at: string
}

export class PrivacyService {
  private supabase = createClient()

  /**
   * Get current user's privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('privacy_settings')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Return default settings if none found
        return {
          profile_visibility: 'public',
          message_requests: true,
          show_online_status: true,
          show_read_receipts: true,
          search_visibility: true,
          story_visibility: 'public'
        }
      }

      return {
        profile_visibility: 'public',
        message_requests: true,
        show_online_status: true,
        show_read_receipts: true,
        search_visibility: true,
        story_visibility: 'public',
        ...data.privacy_settings
      }
    } catch (error) {
      console.error('Error getting privacy settings:', error)
      throw error
    }
  }

  /**
   * Update user's privacy settings
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      // First, get existing settings
      const currentSettings = await this.getPrivacySettings(userId)
      const updatedSettings = { ...currentSettings, ...settings }

      const { error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          privacy_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      throw error
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
    try {
      if (blockerId === blockedId) {
        throw new Error('Cannot block yourself')
      }

      const { error } = await this.supabase
        .from('blocked_users')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
          reason: reason || null
        })

      if (error) throw error

      // Also unfollow the blocked user if following
      await this.supabase
        .from('follows')
        .delete()
        .or(`follower_id.eq.${blockerId},follower_id.eq.${blockedId}`)
        .or(`following_id.eq.${blockerId},following_id.eq.${blockedId}`)

    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)

      if (error) throw error
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await this.supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          reason,
          created_at,
          users!blocked_users_blocked_id_fkey (
            username,
            display_name,
            avatar
          )
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(block => ({
        id: block.id,
        blocked_id: block.blocked_id,
        reason: block.reason,
        created_at: block.created_at,
        blocked_user: block.users ? {
          username: block.users.username,
          display_name: block.users.display_name,
          avatar: block.users.avatar
        } : undefined
      }))
    } catch (error) {
      console.error('Error getting blocked users:', error)
      throw error
    }
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('blocked_users')
        .select('id')
        .or(`blocker_id.eq.${userId1},blocker_id.eq.${userId2}`)
        .or(`blocked_id.eq.${userId1},blocked_id.eq.${userId2}`)
        .limit(1)

      if (error) throw error

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking if user is blocked:', error)
      return false
    }
  }

  /**
   * Check if user can view another user's profile
   */
  async canViewProfile(viewerId: string, targetUserId: string): Promise<boolean> {
    try {
      // Can always view own profile
      if (viewerId === targetUserId) return true

      // Check if blocked
      const isBlocked = await this.isUserBlocked(viewerId, targetUserId)
      if (isBlocked) return false

      // Get target user's privacy settings
      const privacySettings = await this.getPrivacySettings(targetUserId)

      // Public profiles are always viewable
      if (privacySettings.profile_visibility === 'public') return true

      // Private profiles require following
      if (privacySettings.profile_visibility === 'private') {
        const { data, error } = await this.supabase
          .from('follows')
          .select('id')
          .eq('follower_id', viewerId)
          .eq('following_id', targetUserId)
          .limit(1)

        if (error) return false
        return (data?.length || 0) > 0
      }

      // Followers-only profiles require following
      if (privacySettings.profile_visibility === 'followers') {
        const { data, error } = await this.supabase
          .from('follows')
          .select('id')
          .eq('follower_id', viewerId)
          .eq('following_id', targetUserId)
          .limit(1)

        if (error) return false
        return (data?.length || 0) > 0
      }

      return true
    } catch (error) {
      console.error('Error checking profile visibility:', error)
      return false
    }
  }

  /**
   * Check if user can send messages to another user
   */
  async canSendMessage(senderId: string, recipientId: string): Promise<boolean> {
    try {
      // Can't message yourself
      if (senderId === recipientId) return false

      // Check if blocked
      const isBlocked = await this.isUserBlocked(senderId, recipientId)
      if (isBlocked) return false

      // Get recipient's privacy settings
      const privacySettings = await this.getPrivacySettings(recipientId)

      // If message requests are disabled, only followers can message
      if (!privacySettings.message_requests) {
        const { data, error } = await this.supabase
          .from('follows')
          .select('id')
          .eq('follower_id', recipientId)
          .eq('following_id', senderId)
          .limit(1)

        if (error) return false
        return (data?.length || 0) > 0
      }

      return true
    } catch (error) {
      console.error('Error checking message permissions:', error)
      return false
    }
  }

  /**
   * Report content or user
   */
  async reportContent(
    reporterId: string,
    targetType: 'user' | 'post' | 'comment' | 'message',
    targetId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      let reportedUserId: string | null = null

      // Get the user ID of the content owner
      if (targetType === 'user') {
        reportedUserId = targetId
      } else if (targetType === 'post') {
        const { data } = await this.supabase
          .from('posts')
          .select('user_id')
          .eq('id', targetId)
          .single()
        reportedUserId = data?.user_id || null
      } else if (targetType === 'comment') {
        const { data } = await this.supabase
          .from('comments')
          .select('user_id')
          .eq('id', targetId)
          .single()
        reportedUserId = data?.user_id || null
      } else if (targetType === 'message') {
        const { data } = await this.supabase
          .from('messages')
          .select('sender_id')
          .eq('id', targetId)
          .single()
        reportedUserId = data?.sender_id || null
      }

      const { error } = await this.supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          target_id: targetId,
          target_type: targetType,
          reason,
          description: description || null,
          status: 'pending'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error reporting content:', error)
      throw error
    }
  }

  /**
   * Get analytics for search and trending (privacy-aware)
   */
  async getSearchAnalytics(userId: string): Promise<{
    totalSearches: number
    popularQueries: string[]
    trendingHashtags: string[]
  }> {
    try {
      // This would typically be implemented with a separate analytics table
      // For now, return mock data
      return {
        totalSearches: 0,
        popularQueries: [],
        trendingHashtags: []
      }
    } catch (error) {
      console.error('Error getting search analytics:', error)
      return {
        totalSearches: 0,
        popularQueries: [],
        trendingHashtags: []
      }
    }
  }
}

// Export singleton instance
export const privacyService = new PrivacyService()