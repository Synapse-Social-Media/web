import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationCenter } from '../notification-center'
import { useNotifications } from '@/lib/contexts/notification-context'
import { Notification } from '@/lib/types/notification'

// Mock the notification context
vi.mock('@/lib/contexts/notification-context', () => ({
  useNotifications: vi.fn()
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'user1',
    sender_id: 'user2',
    type: 'like',
    title: 'New like',
    message: 'Someone liked your post',
    read: false,
    priority: 'normal',
    created_at: new Date().toISOString(),
    sender: {
      id: 'user2',
      username: 'testuser',
      display_name: 'Test User',
      avatar: 'avatar.jpg'
    }
  },
  {
    id: '2',
    user_id: 'user1',
    type: 'system',
    title: 'Welcome',
    message: 'Welcome to the app!',
    read: true,
    priority: 'normal',
    created_at: new Date().toISOString()
  }
]

const mockUseNotifications = {
  notifications: mockNotifications,
  unreadCount: 1,
  isLoading: false,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn()
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.mocked(useNotifications).mockReturnValue(mockUseNotifications)
    vi.clearAllMocks()
  })

  it('should render notification bell with unread count', () => {
    render(<NotificationCenter />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
    
    const badge = screen.getByText('1')
    expect(badge).toBeInTheDocument()
  })

  it('should not show badge when no unread notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      unreadCount: 0
    })

    render(<NotificationCenter />)
    
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('should use notification context data', () => {
    render(<NotificationCenter />)
    
    expect(useNotifications).toHaveBeenCalled()
  })

  it('should handle mark all as read action', async () => {
    render(<NotificationCenter />)
    
    // Simulate the action being called
    const { markAllAsRead } = vi.mocked(useNotifications).mock.results[0].value
    await markAllAsRead()
    
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled()
  })

  it('should handle mark as read action', async () => {
    render(<NotificationCenter />)
    
    // Simulate the action being called
    const { markAsRead } = vi.mocked(useNotifications).mock.results[0].value
    await markAsRead('notification-id')
    
    expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith('notification-id')
  })

  it('should handle delete notification action', async () => {
    render(<NotificationCenter />)
    
    // Simulate the action being called
    const { deleteNotification } = vi.mocked(useNotifications).mock.results[0].value
    await deleteNotification('notification-id')
    
    expect(mockUseNotifications.deleteNotification).toHaveBeenCalledWith('notification-id')
  })

  it('should display 99+ for unread count over 99', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      unreadCount: 150
    })

    render(<NotificationCenter />)
    
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
})