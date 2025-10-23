import { Database } from './database.types'

export type Follow = Database['public']['Tables']['follows']['Row']
export type FollowInsert = Database['public']['Tables']['follows']['Insert']
export type User = Database['public']['Tables']['users']['Row']

export interface FollowRelationship {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  user?: User
}

export interface FollowStats {
  followers_count: number
  following_count: number
  is_following: boolean
  is_followed_by: boolean
}

export interface UserSuggestion extends User {
  mutual_followers_count: number
  suggestion_reason: 'mutual_followers' | 'new_user' | 'popular' | 'similar_interests'
}

export interface FollowListParams {
  userId: string
  type: 'followers' | 'following'
  limit?: number
  offset?: number
  search?: string
}

export interface FollowListResponse {
  users: FollowRelationship[]
  total_count: number
  has_more: boolean
}