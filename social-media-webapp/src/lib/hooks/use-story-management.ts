'use client'

import { useState, useCallback } from 'react'
import { storyManager } from '@/lib/utils/story-management'
import { toast } from 'sonner'

export function useStoryManagement() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  const deleteStory = useCallback(async (storyId: string, userId: string) => {
    setIsDeleting(true)
    try {
      await storyManager.deleteStory(storyId, userId)
      toast.success('Story deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  const reportStory = useCallback(async (storyId: string, reporterId: string, reason: string) => {
    setIsReporting(true)
    try {
      await storyManager.reportStory(storyId, reporterId, reason)
      toast.success('Story reported successfully')
      return true
    } catch (error) {
      console.error('Error reporting story:', error)
      toast.error('Failed to report story')
      return false
    } finally {
      setIsReporting(false)
    }
  }, [])

  const cleanupExpiredStories = useCallback(async () => {
    try {
      await storyManager.cleanupExpiredStories()
      return true
    } catch (error) {
      console.error('Error cleaning up stories:', error)
      return false
    }
  }, [])

  const getStoryAnalytics = useCallback(async (userId: string) => {
    try {
      return await storyManager.getStoryAnalytics(userId)
    } catch (error) {
      console.error('Error fetching story analytics:', error)
      return []
    }
  }, [])

  return {
    deleteStory,
    reportStory,
    cleanupExpiredStories,
    getStoryAnalytics,
    isDeleting,
    isReporting
  }
}