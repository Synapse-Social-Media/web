import { createClient } from '@/lib/supabase/client'

export class StoryManager {
  private supabase = createClient()

  /**
   * Clean up expired stories
   * This should be called periodically (e.g., via a cron job or when the app loads)
   */
  async cleanupExpiredStories(): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Get expired stories to delete their media files
      const { data: expiredStories, error: fetchError } = await this.supabase
        .from('stories')
        .select('id, media_url')
        .lt('expires_at', now)

      if (fetchError) throw fetchError

      if (expiredStories && expiredStories.length > 0) {
        // Delete media files from storage
        const mediaUrls = expiredStories.map(story => {
          const url = new URL(story.media_url)
          return url.pathname.split('/').pop() || ''
        }).filter(Boolean)

        if (mediaUrls.length > 0) {
          const { error: storageError } = await this.supabase.storage
            .from('media')
            .remove(mediaUrls.map(url => `stories/${url}`))

          if (storageError) {
            console.error('Error deleting story media files:', storageError)
          }
        }

        // Delete story records and their views
        const storyIds = expiredStories.map(story => story.id)
        
        // Delete story views first (foreign key constraint)
        const { error: viewsError } = await this.supabase
          .from('story_views')
          .delete()
          .in('story_id', storyIds)

        if (viewsError) {
          console.error('Error deleting story views:', viewsError)
        }

        // Delete stories
        const { error: deleteError } = await this.supabase
          .from('stories')
          .delete()
          .in('id', storyIds)

        if (deleteError) throw deleteError

        console.log(`Cleaned up ${expiredStories.length} expired stories`)
      }
    } catch (error) {
      console.error('Error cleaning up expired stories:', error)
      throw error
    }
  }

  /**
   * Delete a specific story
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: story, error: fetchError } = await this.supabase
        .from('stories')
        .select('user_id, media_url')
        .eq('id', storyId)
        .single()

      if (fetchError) throw fetchError

      if (story.user_id !== userId) {
        throw new Error('Unauthorized: Cannot delete story that does not belong to you')
      }

      // Delete media file from storage
      const url = new URL(story.media_url)
      const fileName = url.pathname.split('/').pop()
      if (fileName) {
        const { error: storageError } = await this.supabase.storage
          .from('media')
          .remove([`stories/${fileName}`])

        if (storageError) {
          console.error('Error deleting story media file:', storageError)
        }
      }

      // Delete story views first
      const { error: viewsError } = await this.supabase
        .from('story_views')
        .delete()
        .eq('story_id', storyId)

      if (viewsError) {
        console.error('Error deleting story views:', viewsError)
      }

      // Delete story
      const { error: deleteError } = await this.supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (deleteError) throw deleteError

    } catch (error) {
      console.error('Error deleting story:', error)
      throw error
    }
  }

  /**
   * Get story analytics/views for a user's stories
   */
  async getStoryAnalytics(userId: string): Promise<{
    storyId: string
    viewsCount: number
    viewers: Array<{
      id: string
      username: string | null
      display_name: string | null
      avatar: string | null
      viewed_at: string
    }>
  }[]> {
    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select(`
          id,
          views_count,
          story_views (
            viewer_id,
            viewed_at,
            viewer:users (
              id,
              username,
              display_name,
              avatar
            )
          )
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(story => ({
        storyId: story.id,
        viewsCount: story.views_count,
        viewers: story.story_views?.map(view => ({
          id: view.viewer.id,
          username: view.viewer.username,
          display_name: view.viewer.display_name,
          avatar: view.viewer.avatar,
          viewed_at: view.viewed_at
        })) || []
      })) || []

    } catch (error) {
      console.error('Error fetching story analytics:', error)
      throw error
    }
  }

  /**
   * Report a story
   */
  async reportStory(storyId: string, reporterId: string, reason: string): Promise<void> {
    try {
      // Check if story exists and is not expired
      const { data: story, error: storyError } = await this.supabase
        .from('stories')
        .select('id, user_id')
        .eq('id', storyId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (storyError) throw storyError

      // Cannot report own story
      if (story.user_id === reporterId) {
        throw new Error('Cannot report your own story')
      }

      // Create report record (assuming we have a reports table)
      const { error: reportError } = await this.supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: story.user_id,
          content_type: 'story',
          content_id: storyId,
          reason,
          status: 'pending'
        })

      if (reportError) throw reportError

    } catch (error) {
      console.error('Error reporting story:', error)
      throw error
    }
  }
}

// Export singleton instance
export const storyManager = new StoryManager()