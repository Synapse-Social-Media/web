import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationSettingsComponent } from '../notification-settings'
import { useNotifications } from '@/lib/contexts/notification-context'
import { NotificationSettings } from '@/lib/types/notification'

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

const mockSettings: NotificationSettings = {
  push_enabled: true,
  email_enabled: true,
  message_notifications: true,
  post_notifications: true,
  follow_notifications: true,
  like_notifications: true,
  comment_notifications: true,
  mention_notifications: true,
  story_notifications: true,
  system_notifications: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  do_not_disturb: false
}

const mockUseNotifications = {
  settings: mockSettings,
  updateSettings: vi.fn(),
  pushPermission: 'granted' as NotificationPermission,
  isPushSupported: true,
  requestPushPermission: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn()
}

describe('NotificationSettingsComponent', () => {
  beforeEach(() => {
    vi.mocked(useNotifications).mockReturnValue(mockUseNotifications)
    vi.clearAllMocks()
  })

  it('should render notification settings form', () => {
    render(<NotificationSettingsComponent />)
    
    expect(screen.getByText('Notification Settings')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Notification Types')).toBeInTheDocument()
    expect(screen.getByText('Quiet Hours')).toBeInTheDocument()
  })

  it('should display all notification type toggles', () => {
    render(<NotificationSettingsComponent />)
    
    expect(screen.getByLabelText('Messages')).toBeInTheDocument()
    expect(screen.getByLabelText('New Followers')).toBeInTheDocument()
    expect(screen.getByLabelText('Likes')).toBeInTheDocument()
    expect(screen.getByLabelText('Comments')).toBeInTheDocument()
    expect(screen.getByLabelText('Mentions')).toBeInTheDocument()
    expect(screen.getByLabelText('Story Views')).toBeInTheDocument()
    expect(screen.getByLabelText('Post Interactions')).toBeInTheDocument()
    expect(screen.getByLabelText('System Updates')).toBeInTheDocument()
  })

  it('should show correct toggle states based on settings', () => {
    render(<NotificationSettingsComponent />)
    
    const pushToggle = screen.getByLabelText('Push Notifications')
    const messageToggle = screen.getByLabelText('Messages')
    
    expect(pushToggle).toBeChecked()
    expect(messageToggle).toBeChecked()
  })

  it('should call updateSettings when toggle is changed', async () => {
    render(<NotificationSettingsComponent />)
    
    const messageToggle = screen.getByLabelText('Messages')
    fireEvent.click(messageToggle)
    
    await waitFor(() => {
      expect(mockUseNotifications.updateSettings).toHaveBeenCalledWith({
        message_notifications: false
      })
    })
  })

  it('should disable notification types when do not disturb is enabled', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      settings: {
        ...mockSettings,
        do_not_disturb: true
      }
    })

    render(<NotificationSettingsComponent />)
    
    const messageToggle = screen.getByLabelText('Messages')
    expect(messageToggle).toBeDisabled()
  })

  it('should show quiet hours controls when enabled', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      settings: {
        ...mockSettings,
        quiet_hours_enabled: true
      }
    })

    render(<NotificationSettingsComponent />)
    
    expect(screen.getByLabelText('Start Time')).toBeInTheDocument()
    expect(screen.getByLabelText('End Time')).toBeInTheDocument()
  })

  it('should handle push notification permission request', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      pushPermission: 'default'
    })

    render(<NotificationSettingsComponent />)
    
    const pushToggle = screen.getByLabelText('Push Notifications')
    fireEvent.click(pushToggle)
    
    await waitFor(() => {
      expect(mockUseNotifications.requestPushPermission).toHaveBeenCalled()
    })
  })

  it('should show browser enable button when push is denied', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      pushPermission: 'denied'
    })

    render(<NotificationSettingsComponent />)
    
    expect(screen.getByText('Enable in Browser')).toBeInTheDocument()
  })

  it('should show not supported message when push is not supported', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      isPushSupported: false
    })

    render(<NotificationSettingsComponent />)
    
    expect(screen.getByText('Not supported in this browser')).toBeInTheDocument()
  })

  it('should update quiet hours time when changed', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      settings: {
        ...mockSettings,
        quiet_hours_enabled: true
      }
    })

    render(<NotificationSettingsComponent />)
    
    const startTimeInput = screen.getByLabelText('Start Time')
    fireEvent.change(startTimeInput, { target: { value: '23:00' } })
    
    await waitFor(() => {
      expect(mockUseNotifications.updateSettings).toHaveBeenCalledWith({
        quiet_hours_start: '23:00'
      })
    })
  })

  it('should show loading state when settings are null', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...mockUseNotifications,
      settings: null
    })

    render(<NotificationSettingsComponent />)
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })
})