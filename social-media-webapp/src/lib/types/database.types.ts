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
