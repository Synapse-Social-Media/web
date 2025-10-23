import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationItem } from '../notification-item'
import { Notification } from '@/lib/types/notification'

const mockNotification: Notification = {
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
}

const mockReadNotification: Notification = {
  ...mockNotification,
  id: '2',
  read: true,
  read_at: new Date().toISOString()
}

describe('NotificationItem', () => {
  const mockOnMarkAsRead = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification content', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('New like')).toBeInTheDocument()
    expect(screen.getByText('Someone liked your post')).toBeInTheDocument()
    // Avatar shows first letter of display name
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should show unread indicator for unread notifications', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Check for unread styling - the main container should have border-l-primary
    const container = screen.getByText('New like').closest('[class*="border-l-primary"]')
    expect(container).toBeInTheDocument()
  })

  it('should not show unread indicator for read notifications', () => {
    render(
      <NotificationItem
        notification={mockReadNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Check for read styling - should have border-l-transparent
    const container = screen.getByText('New like').closest('[class*="border-l-transparent"]')
    expect(container).toBeInTheDocument()
  })

  it('should call onMarkAsRead when notification is clicked and unread', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    const notificationElement = screen.getByText('New like').closest('div')
    fireEvent.click(notificationElement!)

    expect(mockOnMarkAsRead).toHaveBeenCalledWith('1')
  })

  it('should not call onMarkAsRead when notification is already read', () => {
    render(
      <NotificationItem
        notification={mockReadNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    const notificationElement = screen.getByText('New like').closest('div')
    fireEvent.click(notificationElement!)

    expect(mockOnMarkAsRead).not.toHaveBeenCalled()
  })

  it('should show correct icon for notification type', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Heart icon should be present for 'like' type
    const heartIcon = document.querySelector('svg')
    expect(heartIcon).toBeInTheDocument()
  })

  it('should display time ago', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Should show relative time
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('should show priority indicator for high priority notifications', () => {
    const highPriorityNotification: Notification = {
      ...mockNotification,
      priority: 'high'
    }

    const { container } = render(
      <NotificationItem
        notification={highPriorityNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Check if priority indicator exists in the DOM
    expect(container.textContent).toContain('High Priority')
  })

  it('should show priority indicator for urgent notifications', () => {
    const urgentNotification: Notification = {
      ...mockNotification,
      priority: 'urgent'
    }

    const { container } = render(
      <NotificationItem
        notification={urgentNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Check if priority indicator exists in the DOM
    expect(container.textContent).toContain('Urgent')
  })

  it('should not show priority indicator for normal priority', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText('High Priority')).not.toBeInTheDocument()
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument()
  })

  it('should render system notification without sender avatar', () => {
    const systemNotification: Notification = {
      ...mockNotification,
      type: 'system',
      sender_id: undefined,
      sender: undefined
    }

    render(
      <NotificationItem
        notification={systemNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    )

    // Should show system icon instead of avatar
    const systemIcon = document.querySelector('svg')
    expect(systemIcon).toBeInTheDocument()
  })
})