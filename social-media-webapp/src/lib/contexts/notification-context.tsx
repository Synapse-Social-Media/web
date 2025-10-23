'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Notification, NotificationSettings } from '@/lib/types/notification'
import { notificationService } from '@/lib/services/notification-service'
import { pushNotificationService } from '@/lib/services/push-notification-service'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings | null
  isLoading: boolean
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>
  
  // Push notifications
  requestPushPermission: () => Promise<NotificationPermission>
  subscribeToPush: () => Promise<void>
  unsubscribeFromPush: () => Promise<void>
  pushPermission: NotificationPermission
  isPushSupported: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { userProfile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [isPushSupported] = useState(pushNotificationService.isSupported())

  // Initialize notifications when user is available
  useEffect(() => {
    if (userProfile) {
      initializeNotifications()
      loadSettings()
      setPushPermission(pushNotificationService.getPermissionStatus())
    }
  }, [userProfile])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (userProfile) {
      const subscription = notificationService.subscribeToNotifications(
        userProfile.uid,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show toast if notifications are enabled and not in quiet hours
          if (shouldShowNotification(newNotification)) {
            showNotificationToast(newNotification)
          }
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
    
    return undefined
  }, [userProfile, settings])

  const initializeNotifications = async () => {
    if (!userProfile) return
    
    setIsLoading(true)
    try {
      const [notificationsData, count] = await Promise.all([
        notificationService.getNotifications(userProfile.uid, 0, 20),
        notificationService.getUnreadCount(userProfile.uid)
      ])
      
      setNotifications(notificationsData)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    if (!userProfile) return
    
    try {
      const userSettings = await notificationService.getNotificationSettings(userProfile.uid)
      setSettings(userSettings)
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    if (!userProfile) return
    
    try {
      await notificationService.markAllAsRead(userProfile.uid)
      
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read: true, 
          read_at: new Date().toISOString() 
        }))
      )
      
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      
      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!userProfile) return
    
    try {
      await notificationService.updateNotificationSettings(userProfile.uid, newSettings)
      setSettings(prev => prev ? { ...prev, ...newSettings } : null)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      throw error
    }
  }

  const requestPushPermission = async (): Promise<NotificationPermission> => {
    try {
      const permission = await pushNotificationService.requestPermission()
      setPushPermission(permission)
      return permission
    } catch (error) {
      console.error('Failed to request push permission:', error)
      throw error
    }
  }

  const subscribeToPush = async () => {
    if (!userProfile) return
    
    try {
      await pushNotificationService.subscribeToPush(userProfile.uid)
      toast.success('Push notifications enabled')
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      toast.error('Failed to enable push notifications')
      throw error
    }
  }

  const unsubscribeFromPush = async () => {
    if (!userProfile) return
    
    try {
      await pushNotificationService.unsubscribeFromPush(userProfile.uid)
      toast.success('Push notifications disabled')
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      toast.error('Failed to disable push notifications')
      throw error
    }
  }

  // Check if notification should be shown based on settings
  const shouldShowNotification = (notification: Notification): boolean => {
    if (!settings) return true
    
    // Check do not disturb
    if (settings.do_not_disturb) return false
    
    // Check quiet hours
    if (settings.quiet_hours_enabled) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const startTime = parseTime(settings.quiet_hours_start)
      const endTime = parseTime(settings.quiet_hours_end)
      
      if (startTime <= endTime) {
        // Same day quiet hours
        if (currentTime >= startTime && currentTime <= endTime) {
          return false
        }
      } else {
        // Overnight quiet hours
        if (currentTime >= startTime || currentTime <= endTime) {
          return false
        }
      }
    }
    
    // Check notification type settings
    switch (notification.type) {
      case 'message':
        return settings.message_notifications
      case 'like':
        return settings.like_notifications
      case 'comment':
        return settings.comment_notifications
      case 'follow':
        return settings.follow_notifications
      case 'mention':
        return settings.mention_notifications
      case 'story_view':
        return settings.story_notifications
      case 'post_share':
        return settings.post_notifications
      case 'system':
      case 'welcome':
      case 'feature':
        return settings.system_notifications
      default:
        return true
    }
  }

  const showNotificationToast = (notification: Notification) => {
    toast(notification.title || 'New notification', {
      description: notification.message,
      action: notification.action_url ? {
        label: 'View',
        onClick: () => window.location.href = notification.action_url!
      } : undefined
    })
  }

  const parseTime = (timeString: string): number => {
    const parts = timeString.split(':')
    const hours = parseInt(parts[0] || '0', 10)
    const minutes = parseInt(parts[1] || '0', 10)
    return hours * 60 + minutes
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    pushPermission,
    isPushSupported
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}