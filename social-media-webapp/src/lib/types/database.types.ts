export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          uid: string
          email: string | null
          username: string | null
          display_name: string | null
          biography: string | null
          avatar: string | null
          profile_cover_image: string | null
          account_premium: boolean
          verify: boolean
          followers_count: number
          following_count: number
          posts_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          email?: string | null
          username?: string | null
          display_name?: string | null
          biography?: string | null
          avatar?: string | null
          profile_cover_image?: string | null
          account_premium?: boolean
          verify?: boolean
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          email?: string | null
          username?: string | null
          display_name?: string | null
          biography?: string | null
          avatar?: string | null
          profile_cover_image?: string | null
          account_premium?: boolean
          verify?: boolean
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          media_urls: string[] | null
          media_types: string[] | null
          post_type: 'text' | 'image' | 'video' | 'mixed'
          visibility: 'public' | 'followers' | 'private'
          likes_count: number
          comments_count: number
          shares_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          media_urls?: string[] | null
          media_types?: string[] | null
          post_type?: 'text' | 'image' | 'video' | 'mixed'
          visibility?: 'public' | 'followers' | 'private'
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          media_urls?: string[] | null
          media_types?: string[] | null
          post_type?: 'text' | 'image' | 'video' | 'mixed'
          visibility?: 'public' | 'followers' | 'private'
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          media_url: string
          media_type: 'image' | 'video'
          text_overlay: string | null
          background_color: string | null
          visibility: 'public' | 'followers' | 'close_friends'
          views_count: number
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_url: string
          media_type: 'image' | 'video'
          text_overlay?: string | null
          background_color?: string | null
          visibility?: 'public' | 'followers' | 'close_friends'
          views_count?: number
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_url?: string
          media_type?: 'image' | 'video'
          text_overlay?: string | null
          background_color?: string | null
          visibility?: 'public' | 'followers' | 'close_friends'
          views_count?: number
          expires_at?: string
          created_at?: string
        }
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewer_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          viewer_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          viewer_id?: string
          viewed_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          content_type: 'post' | 'story' | 'message' | 'user'
          content_id: string | null
          reason: string
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          content_type: 'post' | 'story' | 'message' | 'user'
          content_id?: string | null
          reason: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          content_type?: 'post' | 'story' | 'message' | 'user'
          content_id?: string | null
          reason?: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
