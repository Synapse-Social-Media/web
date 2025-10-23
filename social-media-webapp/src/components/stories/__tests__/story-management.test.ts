import { vi, describe, beforeEach, it, expect } from 'vitest'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      lt: vi.fn(() => ({ data: [], error: null })),
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        delete: vi.fn(() => ({ error: null }))
      })),
      in: vi.fn(() => ({
        delete: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
        in: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null })),
      gt: vi.fn(() => ({
        order: vi.fn(() => ({ data: [], error: null }))
      }))
    }))
  })),
  storage: {
    from: vi.fn(() => ({
      remove: vi.fn(() => ({ error: null }))
    }))
  }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Import after mocking
const { storyManager } = await import('@/lib/utils/story-management')

describe('StoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cleanupExpiredStories', () => {
    it('should clean up expired stories successfully', async () => {
      const expiredStories = [
        { id: '1', media_url: 'https://example.com/story1.jpg' },
        { id: '2', media_url: 'https://example.com/story2.jpg' }
      ]

      mockSupabase.from().select().lt.mockReturnValue({
        data: expiredStories,
        error: null
      })

      await expect(storyManager.cleanupExpiredStories()).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('stories')
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('media')
    })

    it('should handle cleanup when no expired stories exist', async () => {
      mockSupabase.from().select().lt.mockReturnValue({
        data: [],
        error: null
      })

      await expect(storyManager.cleanupExpiredStories()).resolves.not.toThrow()
    })

    it('should handle database errors during cleanup', async () => {
      mockSupabase.from().select().lt.mockReturnValue({
        data: null,
        error: new Error('Database error')
      })

      await expect(storyManager.cleanupExpiredStories()).rejects.toThrow('Database error')
    })
  })

  describe('deleteStory', () => {
    it('should delete story successfully when user owns it', async () => {
      const storyData = {
        user_id: 'user1',
        media_url: 'https://example.com/story.jpg'
      }

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: storyData,
        error: null
      })

      await expect(storyManager.deleteStory('story1', 'user1')).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('stories')
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('media')
    })

    it('should throw error when user does not own the story', async () => {
      const storyData = {
        user_id: 'user2',
        media_url: 'https://example.com/story.jpg'
      }

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: storyData,
        error: null
      })

      await expect(storyManager.deleteStory('story1', 'user1')).rejects.toThrow('Unauthorized')
    })

    it('should handle story not found error', async () => {
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: null,
        error: new Error('Story not found')
      })

      await expect(storyManager.deleteStory('story1', 'user1')).rejects.toThrow('Story not found')
    })
  })

  describe('reportStory', () => {
    it('should report story successfully', async () => {
      const storyData = {
        id: 'story1',
        user_id: 'user2'
      }

      mockSupabase.from().select().eq().gt().single.mockReturnValue({
        data: storyData,
        error: null
      })

      await expect(storyManager.reportStory('story1', 'user1', 'inappropriate')).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('stories')
      expect(mockSupabase.from).toHaveBeenCalledWith('reports')
    })

    it('should throw error when trying to report own story', async () => {
      const storyData = {
        id: 'story1',
        user_id: 'user1'
      }

      mockSupabase.from().select().eq().gt().single.mockReturnValue({
        data: storyData,
        error: null
      })

      await expect(storyManager.reportStory('story1', 'user1', 'inappropriate')).rejects.toThrow('Cannot report your own story')
    })

    it('should handle expired story error', async () => {
      mockSupabase.from().select().eq().gt().single.mockReturnValue({
        data: null,
        error: new Error('Story not found or expired')
      })

      await expect(storyManager.reportStory('story1', 'user1', 'inappropriate')).rejects.toThrow('Story not found or expired')
    })
  })

  describe('getStoryAnalytics', () => {
    it('should return story analytics successfully', async () => {
      const analyticsData = [
        {
          id: 'story1',
          views_count: 5,
          story_views: [
            {
              viewer_id: 'viewer1',
              viewed_at: '2023-01-01T00:00:00Z',
              viewer: {
                id: 'viewer1',
                username: 'viewer1',
                display_name: 'Viewer One',
                avatar: null
              }
            }
          ]
        }
      ]

      mockSupabase.from().select().eq().gt().order.mockReturnValue({
        data: analyticsData,
        error: null
      })

      const result = await storyManager.getStoryAnalytics('user1')

      expect(result).toHaveLength(1)
      expect(result[0].storyId).toBe('story1')
      expect(result[0].viewsCount).toBe(5)
      expect(result[0].viewers).toHaveLength(1)
    })

    it('should handle empty analytics data', async () => {
      mockSupabase.from().select().eq().gt().order.mockReturnValue({
        data: [],
        error: null
      })

      const result = await storyManager.getStoryAnalytics('user1')

      expect(result).toHaveLength(0)
    })

    it('should handle analytics fetch error', async () => {
      mockSupabase.from().select().eq().gt().order.mockReturnValue({
        data: null,
        error: new Error('Analytics fetch error')
      })

      await expect(storyManager.getStoryAnalytics('user1')).rejects.toThrow('Analytics fetch error')
    })
  })
})