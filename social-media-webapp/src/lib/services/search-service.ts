import { createClient } from '@/lib/supabase/client'
import { 
  SearchResults, 
  UserSearchResult, 
  PostSearchResult, 
  HashtagSearchResult,
  SearchFilters,
  SearchSuggestion,
  TrendingTopic
} from '@/lib/types/search'

export class SearchService {
  private supabase = createClient()

  /**
   * Get current user ID for privacy checks
   */
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user?.id || null
  }

  /**
   * Check if a user is blocked by the current user or has blocked the current user
   */
  private async isUserBlocked(userId: string, currentUserId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('blocked_users')
      .select('id')
      .or(`blocker_id.eq.${currentUserId},blocker_id.eq.${userId}`)
      .or(`blocked_id.eq.${currentUserId},blocked_id.eq.${userId}`)
      .limit(1)

    if (error) {
      console.error('Error checking blocked users:', error)
      return false
    }

    return (data?.length || 0) > 0
  }

  /**
   * Get user privacy settings
   */
  private async getUserPrivacySettings(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('privacy_settings')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Return default privacy settings if none found
      return {
        profile_visibility: 'public',
        message_requests: true,
        show_online_status: true,
        show_read_receipts: true
      }
    }

    return data.privacy_settings
  }

  /**
   * Search for users by username and display name with privacy controls
   */
  async searchUsers(
    query: string, 
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<UserSearchResult[]> {
    try {
      const currentUserId = await this.getCurrentUserId()
      if (!currentUserId) return []

      let queryBuilder = this.supabase
        .from('users')
        .select(`
          id,
          uid,
          username,
          display_name,
          avatar,
          verify,
          followers_count,
          created_at,
          banned
        `)

      // Exclude banned users
      queryBuilder = queryBuilder.eq('banned', false)

      // Apply search query
      if (query.trim()) {
        const searchTerm = `%${query.toLowerCase()}%`
        queryBuilder = queryBuilder.or(
          `username.ilike.${searchTerm},display_name.ilike.${searchTerm}`
        )
      }

      // Apply verified filter
      if (filters.verified === true) {
        queryBuilder = queryBuilder.eq('verify', true)
      }

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const dateFilter = this.getDateFilter(filters.dateRange)
        if (dateFilter) {
          queryBuilder = queryBuilder.gte('created_at', dateFilter)
        }
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popular':
          queryBuilder = queryBuilder.order('followers_count', { ascending: false })
          break
        case 'recent':
          queryBuilder = queryBuilder.order('created_at', { ascending: false })
          break
        default: // relevance
          // For relevance, we'll sort by exact matches first, then partial matches
          queryBuilder = queryBuilder.order('verify', { ascending: false })
            .order('followers_count', { ascending: false })
      }

      queryBuilder = queryBuilder.limit(limit * 2) // Get more to filter out blocked users

      const { data, error } = await queryBuilder

      if (error) throw error

      // Filter out blocked users and apply privacy settings
      const filteredUsers = []
      for (const user of data || []) {
        // Skip if user is blocked
        const isBlocked = await this.isUserBlocked(user.uid, currentUserId)
        if (isBlocked) continue

        // Check privacy settings
        const privacySettings = await this.getUserPrivacySettings(user.uid)
        
        // If profile is private, only show if user follows them
        if (privacySettings.profile_visibility === 'private') {
          const { data: followData } = await this.supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', user.uid)
            .limit(1)

          if (!followData || followData.length === 0) {
            continue // Skip private profiles that current user doesn't follow
          }
        }

        filteredUsers.push(user)
        if (filteredUsers.length >= limit) break
      }

      return filteredUsers.map((user, index) => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        relevance_score: this.calculateUserRelevanceScore(user, query, index),
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          verify: user.verify,
          followers_count: user.followers_count
        }
      }))
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  /**
   * Search for posts with full-text search capabilities and privacy controls
   */
  async searchPosts(
    query: string,
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<PostSearchResult[]> {
    try {
      const currentUserId = await this.getCurrentUserId()
      if (!currentUserId) return []

      let queryBuilder = this.supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          created_at,
          likes_count,
          comments_count,
          visibility,
          is_deleted,
          users!inner (
            uid,
            username,
            display_name,
            avatar,
            verify,
            banned
          )
        `)

      // Exclude deleted posts and posts from banned users
      queryBuilder = queryBuilder.eq('is_deleted', false)
      queryBuilder = queryBuilder.eq('users.banned', false)

      // Apply search query
      if (query.trim()) {
        const searchTerm = `%${query.toLowerCase()}%`
        queryBuilder = queryBuilder.ilike('content', searchTerm)
      }

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const dateFilter = this.getDateFilter(filters.dateRange)
        if (dateFilter) {
          queryBuilder = queryBuilder.gte('created_at', dateFilter)
        }
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popular':
          queryBuilder = queryBuilder.order('likes_count', { ascending: false })
          break
        case 'recent':
          queryBuilder = queryBuilder.order('created_at', { ascending: false })
          break
        default: // relevance
          queryBuilder = queryBuilder.order('likes_count', { ascending: false })
            .order('created_at', { ascending: false })
      }

      queryBuilder = queryBuilder.limit(limit * 2) // Get more to filter out blocked users

      const { data, error } = await queryBuilder

      if (error) throw error

      // Filter posts based on privacy and blocking
      const filteredPosts = []
      for (const post of data || []) {
        // Skip posts from blocked users
        const isBlocked = await this.isUserBlocked(post.user_id, currentUserId)
        if (isBlocked) continue

        // Apply visibility rules
        if (post.visibility === 'public') {
          // Public posts are always visible
          filteredPosts.push(post)
        } else if (post.visibility === 'followers') {
          // Check if current user follows the post author
          const { data: followData } = await this.supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', post.user_id)
            .limit(1)

          if (followData && followData.length > 0) {
            filteredPosts.push(post)
          }
        } else if (post.visibility === 'private' && post.user_id === currentUserId) {
          // Private posts only visible to the author
          filteredPosts.push(post)
        }

        if (filteredPosts.length >= limit) break
      }

      return filteredPosts.map((post, index) => ({
        id: `post-${post.id}`,
        type: 'post' as const,
        relevance_score: this.calculatePostRelevanceScore(post, query, index),
        post: {
          id: post.id,
          content: post.content,
          user_id: post.user_id,
          created_at: post.created_at,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          user: post.users ? {
            username: post.users.username,
            display_name: post.users.display_name,
            avatar: post.users.avatar,
            verify: post.users.verify
          } : undefined
        }
      }))
    } catch (error) {
      console.error('Error searching posts:', error)
      return []
    }
  }

  /**
   * Search for hashtags and mentions with privacy controls
   */
  async searchHashtags(
    query: string,
    filters: SearchFilters = {},
    limit: number = 10
  ): Promise<HashtagSearchResult[]> {
    try {
      const currentUserId = await this.getCurrentUserId()
      if (!currentUserId) return []

      // Extract hashtag from query (remove # if present)
      const hashtag = query.replace(/^#/, '').toLowerCase()
      
      if (!hashtag.trim()) return []

      // Search for posts containing the hashtag with privacy controls
      const { data: posts, error } = await this.supabase
        .from('posts')
        .select(`
          id, 
          content, 
          created_at, 
          user_id, 
          visibility,
          is_deleted,
          users!inner (
            uid,
            banned
          )
        `)
        .eq('is_deleted', false)
        .eq('users.banned', false)
        .ilike('content', `%#${hashtag}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter posts based on privacy and get blocked users list
      const { data: blockedUsers } = await this.supabase
        .from('blocked_users')
        .select('blocked_id, blocker_id')
        .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)

      const blockedUserIds = new Set<string>()
      blockedUsers?.forEach(block => {
        if (block.blocker_id === currentUserId) {
          blockedUserIds.add(block.blocked_id)
        } else {
          blockedUserIds.add(block.blocker_id)
        }
      })

      // Get following list for followers-only posts
      const { data: following } = await this.supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)

      const followingIds = new Set(following?.map(f => f.following_id) || [])

      // Filter posts and count hashtags
      const hashtagCounts = new Map<string, number>()
      const hashtagDates = new Map<string, Date[]>()

      posts?.forEach(post => {
        // Skip posts from blocked users
        if (blockedUserIds.has(post.user_id)) return

        // Apply visibility rules
        let canView = false
        if (post.visibility === 'public') {
          canView = true
        } else if (post.visibility === 'followers' && followingIds.has(post.user_id)) {
          canView = true
        } else if (post.visibility === 'private' && post.user_id === currentUserId) {
          canView = true
        }

        if (canView && post.content) {
          const hashtags = this.extractHashtags(post.content)
          hashtags.forEach(tag => {
            const normalizedTag = tag.toLowerCase()
            if (normalizedTag.includes(hashtag)) {
              hashtagCounts.set(normalizedTag, (hashtagCounts.get(normalizedTag) || 0) + 1)
              
              const dates = hashtagDates.get(normalizedTag) || []
              dates.push(new Date(post.created_at))
              hashtagDates.set(normalizedTag, dates)
            }
          })
        }
      })

      // Convert to results with trending scores
      const results: HashtagSearchResult[] = Array.from(hashtagCounts.entries())
        .map(([tag, count]) => {
          const dates = hashtagDates.get(tag) || []
          const trendingScore = this.calculateTrendingScore(dates, count)
          
          return {
            id: `hashtag-${tag}`,
            type: 'hashtag' as const,
            relevance_score: this.calculateHashtagRelevanceScore(tag, hashtag, count),
            hashtag: {
              tag,
              post_count: count,
              trending_score: trendingScore
            }
          }
        })
        .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
        .slice(0, limit)

      return results
    } catch (error) {
      console.error('Error searching hashtags:', error)
      return []
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim() || query.length < 2) return []

    try {
      const suggestions: SearchSuggestion[] = []

      // Get user suggestions
      const users = await this.searchUsers(query, {}, 3)
      users.forEach(user => {
        suggestions.push({
          id: `suggestion-user-${user.user.id}`,
          text: user.user.display_name || user.user.username || '',
          type: 'user',
          avatar: user.user.avatar || undefined
        })
      })

      // Get hashtag suggestions
      const hashtags = await this.searchHashtags(query, {}, 3)
      hashtags.forEach(hashtag => {
        suggestions.push({
          id: `suggestion-hashtag-${hashtag.hashtag.tag}`,
          text: `#${hashtag.hashtag.tag}`,
          type: 'hashtag'
        })
      })

      return suggestions.slice(0, 6)
    } catch (error) {
      console.error('Error getting search suggestions:', error)
      return []
    }
  }

  /**
   * Get trending topics with privacy controls
   */
  async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const currentUserId = await this.getCurrentUserId()
      if (!currentUserId) return []

      // Get recent posts to analyze trending hashtags with privacy controls
      const { data: posts, error } = await this.supabase
        .from('posts')
        .select(`
          content, 
          created_at, 
          user_id, 
          visibility,
          is_deleted,
          users!inner (
            uid,
            banned
          )
        `)
        .eq('is_deleted', false)
        .eq('users.banned', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(2000) // Get more to account for filtering

      if (error) throw error

      // Get blocked users list
      const { data: blockedUsers } = await this.supabase
        .from('blocked_users')
        .select('blocked_id, blocker_id')
        .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)

      const blockedUserIds = new Set<string>()
      blockedUsers?.forEach(block => {
        if (block.blocker_id === currentUserId) {
          blockedUserIds.add(block.blocked_id)
        } else {
          blockedUserIds.add(block.blocker_id)
        }
      })

      // Get following list for followers-only posts
      const { data: following } = await this.supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)

      const followingIds = new Set(following?.map(f => f.following_id) || [])

      // Extract and count hashtags from visible posts
      const hashtagCounts = new Map<string, number>()
      const hashtagDates = new Map<string, Date[]>()

      posts?.forEach(post => {
        // Skip posts from blocked users
        if (blockedUserIds.has(post.user_id)) return

        // Apply visibility rules
        let canView = false
        if (post.visibility === 'public') {
          canView = true
        } else if (post.visibility === 'followers' && followingIds.has(post.user_id)) {
          canView = true
        } else if (post.visibility === 'private' && post.user_id === currentUserId) {
          canView = true
        }

        if (canView && post.content) {
          const hashtags = this.extractHashtags(post.content)
          hashtags.forEach(tag => {
            const normalizedTag = tag.toLowerCase()
            hashtagCounts.set(normalizedTag, (hashtagCounts.get(normalizedTag) || 0) + 1)
            
            const dates = hashtagDates.get(normalizedTag) || []
            dates.push(new Date(post.created_at))
            hashtagDates.set(normalizedTag, dates)
          })
        }
      })

      // Convert to trending topics with scores
      const trendingTopics: TrendingTopic[] = Array.from(hashtagCounts.entries())
        .filter(([_, count]) => count >= 3) // Minimum threshold
        .map(([tag, count]) => {
          const dates = hashtagDates.get(tag) || []
          const growthRate = this.calculateTrendingScore(dates, count)
          
          return {
            id: `trending-${tag}`,
            hashtag: tag,
            post_count: count,
            growth_rate: growthRate,
            category: this.categorizeHashtag(tag)
          }
        })
        .sort((a, b) => b.growth_rate - a.growth_rate)
        .slice(0, limit)

      return trendingTopics
    } catch (error) {
      console.error('Error getting trending topics:', error)
      return []
    }
  }

  /**
   * Perform comprehensive search across all content types
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<SearchResults[]> {
    try {
      const results: SearchResults[] = []

      // Determine what to search based on filters
      const searchUsers = !filters.type || filters.type === 'all' || filters.type === 'users'
      const searchPosts = !filters.type || filters.type === 'all' || filters.type === 'posts'
      const searchHashtags = !filters.type || filters.type === 'all' || filters.type === 'hashtags'

      // Execute searches in parallel
      const promises: Promise<SearchResults[]>[] = []

      if (searchUsers) {
        promises.push(this.searchUsers(query, filters, Math.ceil(limit / 3)))
      }

      if (searchPosts) {
        promises.push(this.searchPosts(query, filters, Math.ceil(limit / 2)))
      }

      if (searchHashtags) {
        promises.push(this.searchHashtags(query, filters, Math.ceil(limit / 4)))
      }

      const searchResults = await Promise.all(promises)
      
      // Combine and sort results by relevance
      searchResults.forEach(resultSet => {
        results.push(...resultSet)
      })

      // Sort by relevance score and limit results
      return results
        .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
        .slice(0, limit)

    } catch (error) {
      console.error('Error performing search:', error)
      return []
    }
  }

  // Helper methods

  private getDateFilter(dateRange: string): string | null {
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString()
      default:
        return null
    }
  }

  private calculateUserRelevanceScore(user: any, query: string, index: number): number {
    let score = 1.0 - (index * 0.1) // Base score decreases with position

    // Boost for verified users
    if (user.verify) score += 0.3

    // Boost for follower count (logarithmic)
    score += Math.log10(user.followers_count + 1) * 0.1

    // Boost for exact matches
    const queryLower = query.toLowerCase()
    if (user.username?.toLowerCase() === queryLower) score += 0.5
    if (user.display_name?.toLowerCase() === queryLower) score += 0.4

    // Boost for username matches over display name matches
    if (user.username?.toLowerCase().includes(queryLower)) score += 0.2
    if (user.display_name?.toLowerCase().includes(queryLower)) score += 0.1

    return Math.min(score, 1.0)
  }

  private calculatePostRelevanceScore(post: any, query: string, index: number): number {
    let score = 1.0 - (index * 0.05) // Base score decreases with position

    // Boost for engagement
    score += Math.log10(post.likes_count + 1) * 0.1
    score += Math.log10(post.comments_count + 1) * 0.05

    // Boost for verified user posts
    if (post.users?.verify) score += 0.2

    // Boost for query matches in content
    if (post.content) {
      const queryLower = query.toLowerCase()
      const contentLower = post.content.toLowerCase()
      
      // Count occurrences of query terms
      const queryTerms = queryLower.split(/\s+/)
      queryTerms.forEach(term => {
        const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length
        score += occurrences * 0.1
      })
    }

    // Boost for recency (posts from last 24 hours)
    const postAge = Date.now() - new Date(post.created_at).getTime()
    if (postAge < 24 * 60 * 60 * 1000) score += 0.2

    return Math.min(score, 1.0)
  }

  private calculateHashtagRelevanceScore(hashtag: string, query: string, count: number): number {
    let score = 0.5

    // Boost for exact matches
    if (hashtag === query.toLowerCase()) score += 0.5

    // Boost for partial matches at the beginning
    if (hashtag.startsWith(query.toLowerCase())) score += 0.3

    // Boost for post count (logarithmic)
    score += Math.log10(count + 1) * 0.1

    return Math.min(score, 1.0)
  }

  private calculateTrendingScore(dates: Date[], count: number): number {
    if (dates.length === 0) return 0

    const now = Date.now()
    const recentDates = dates.filter(date => now - date.getTime() < 24 * 60 * 60 * 1000)
    const recentRatio = recentDates.length / dates.length

    // Combine recency with volume
    const volumeScore = Math.min(count / 100, 1.0) // Normalize to 0-1
    const recencyScore = recentRatio

    return (volumeScore * 0.4 + recencyScore * 0.6)
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/g
    const matches = content.match(hashtagRegex) || []
    return matches.map(tag => tag.substring(1)) // Remove the # symbol
  }

  private categorizeHashtag(hashtag: string): string | undefined {
    const categories = {
      technology: ['tech', 'ai', 'coding', 'programming', 'software', 'web', 'mobile'],
      sports: ['football', 'basketball', 'soccer', 'tennis', 'sports', 'fitness'],
      entertainment: ['movie', 'music', 'tv', 'celebrity', 'entertainment', 'gaming'],
      news: ['news', 'breaking', 'politics', 'world', 'update'],
      lifestyle: ['food', 'travel', 'fashion', 'health', 'lifestyle', 'photography']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => hashtag.toLowerCase().includes(keyword))) {
        return category
      }
    }

    return undefined
  }
}

// Export singleton instance
export const searchService = new SearchService()