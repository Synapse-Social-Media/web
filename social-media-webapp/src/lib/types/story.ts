export interface User {
  id: string
  username: string | null
  display_name: string | null
  avatar: string | null
  verify: boolean
}

export interface Story {
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
  user?: User
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id: string
  viewed_at: string
  viewer?: User
}

export interface UserStories {
  user: User
  stories: Story[]
  hasUnviewed: boolean
}