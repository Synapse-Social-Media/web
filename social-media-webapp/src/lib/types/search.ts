export interface SearchResult {
  id: string
  type: 'user' | 'post' | 'hashtag'
  relevance_score?: number
}

export interface UserSearchResult extends SearchResult {
  type: 'user'
  user: {
    id: string
    username: string | null
    display_name: string | null
    avatar: string | null
    verify: boolean
    followers_count: number
  }
}

export interface PostSearchResult extends SearchResult {
  type: 'post'
  post: {
    id: string
    content: string | null
    user_id: string
    created_at: string
    likes_count: number
    comments_count: number
    user?: {
      username: string | null
      display_name: string | null
      avatar: string | null
      verify: boolean
    }
  }
}

export interface HashtagSearchResult extends SearchResult {
  type: 'hashtag'
  hashtag: {
    tag: string
    post_count: number
    trending_score?: number
  }
}

export type SearchResults = UserSearchResult | PostSearchResult | HashtagSearchResult

export interface SearchFilters {
  type?: 'all' | 'users' | 'posts' | 'hashtags'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year'
  sortBy?: 'relevance' | 'recent' | 'popular'
  verified?: boolean
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'user' | 'hashtag' | 'recent'
  avatar?: string
}

export interface TrendingTopic {
  id: string
  hashtag: string
  post_count: number
  growth_rate: number
  category?: string
}