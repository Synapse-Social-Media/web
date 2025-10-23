'use client'

import { storyManager } from '@/lib/utils/story-management'

/**
 * Story cleanup service that runs periodically to remove expired stories
 */
export class StoryCleanupService {
  private static instance: StoryCleanupService
  private intervalId: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

  private constructor() {}

  static getInstance(): StoryCleanupService {
    if (!StoryCleanupService.instance) {
      StoryCleanupService.instance = new StoryCleanupService()
    }
    return StoryCleanupService.instance
  }

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.intervalId) {
      return // Already running
    }

    // Run cleanup immediately
    this.runCleanup()

    // Set up periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, this.CLEANUP_INTERVAL)

    console.log('Story cleanup service started')
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Story cleanup service stopped')
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<void> {
    try {
      await storyManager.cleanupExpiredStories()
    } catch (error) {
      console.error('Story cleanup failed:', error)
    }
  }
}

// Export singleton instance
export const storyCleanupService = StoryCleanupService.getInstance()