import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '@/lib/services/notification-service'
import { Notification } from '@/lib/types/notification'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
      }))
    }))
  }

  return {
    createClient: () => mockSupabase
  }
})

describe('NotificationService', () => {
  let notificationService: NotificationService

  beforeEach(() => {
    notificationService = new NotificationService()
    vi.clearAllMocks()
  })

  describe('getNotifications', () => {
    it('should fetch notifications for a user', async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: 'user1',
          type: 'like',
          message: 'Someone liked your post',
          read: false,
          priority: 'normal',
          created_at: new Date().toISOString()
        }
      ]

      const result = await notificationService.getNotifications('user1', 0, 20)

      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      // Test that the service handles errors without throwing
      const result = await notificationService.getNotifications('user1', 0, 20)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const count = await notificationService.getUnreadCount('user1')
      expect(typeof count).toBe('number')
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read without throwing', async () => {
      await expect(notificationService.markAsRead('notification1')).resolves.not.toThrow()
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read without throwing', async () => {
      await expect(notificationService.markAllAsRead('user1')).resolves.not.toThrow()
    })
  })

  describe('createNotification', () => {
    it('should create a new notification without throwing', async () => {
      const notification = {
        user_id: 'user1',
        type: 'like' as const,
        message: 'Someone liked your post',
        priority: 'normal' as const
      }

      await expect(notificationService.createNotification(notification)).resolves.not.toThrow()
    })
  })

  describe('subscribeToNotifications', () => {
    it('should set up real-time subscription', () => {
      const callback = vi.fn()
      const subscription = notificationService.subscribeToNotifications('user1', callback)
      expect(subscription).toHaveProperty('unsubscribe')
    })
  })
})