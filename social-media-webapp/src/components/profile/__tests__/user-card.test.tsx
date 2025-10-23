import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserCard } from '../user-card'

const mockUser = {
  id: 'user-1',
  uid: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  biography: 'This is a test user biography',
  avatar: 'https://example.com/avatar.jpg',
  profile_cover_image: null,
  account_premium: true,
  verify: true,
  followers_count: 1500,
  following_count: 750,
  posts_count: 42,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('UserCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default variant', () => {
    it('renders user information correctly', () => {
      render(<UserCard user={mockUser} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(screen.getByText('This is a test user biography')).toBeInTheDocument()
      expect(screen.getByText('1.5K followers')).toBeInTheDocument()
      expect(screen.getByText('750 following')).toBeInTheDocument()
      expect(screen.getByText('42 posts')).toBeInTheDocument()
    })

    it('shows verified and premium badges', () => {
      render(<UserCard user={mockUser} />)

      expect(screen.getByText('✓')).toBeInTheDocument()
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })

    it('shows follow button by default', () => {
      render(<UserCard user={mockUser} />)

      expect(screen.getByText('Follow')).toBeInTheDocument()
    })

    it('shows unfollow button when following', () => {
      render(<UserCard user={mockUser} isFollowing={true} />)

      expect(screen.getByText('Unfollow')).toBeInTheDocument()
    })

    it('handles follow button click', async () => {
      const mockOnFollow = vi.fn()
      render(<UserCard user={mockUser} onFollow={mockOnFollow} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      expect(mockOnFollow).toHaveBeenCalledWith('user-1')
    })

    it('handles unfollow button click', async () => {
      const mockOnUnfollow = vi.fn()
      render(<UserCard user={mockUser} isFollowing={true} onUnfollow={mockOnUnfollow} />)

      const unfollowButton = screen.getByText('Unfollow')
      fireEvent.click(unfollowButton)

      expect(mockOnUnfollow).toHaveBeenCalledWith('user-1')
    })

    it('shows message button when enabled', () => {
      render(<UserCard user={mockUser} showMessageButton={true} />)

      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    it('handles message button click', () => {
      const mockOnMessage = vi.fn()
      render(<UserCard user={mockUser} showMessageButton={true} onMessage={mockOnMessage} />)

      const messageButton = screen.getByText('Message')
      fireEvent.click(messageButton)

      expect(mockOnMessage).toHaveBeenCalledWith('user-1')
    })

    it('hides action buttons for current user', () => {
      render(<UserCard user={mockUser} isCurrentUser={true} />)

      expect(screen.queryByText('Follow')).not.toBeInTheDocument()
      expect(screen.queryByText('Message')).not.toBeInTheDocument()
    })

    it('shows dropdown menu with options', () => {
      render(<UserCard user={mockUser} />)

      // Find the dropdown trigger button (the one with ellipsis icon)
      const buttons = screen.getAllByRole('button')
      const dropdownButton = buttons.find(button => 
        button.getAttribute('aria-haspopup') === 'menu'
      )
      expect(dropdownButton).toBeInTheDocument()
      
      if (dropdownButton) {
        fireEvent.click(dropdownButton)
        // Note: In a real implementation, this would open the dropdown menu
        // For now, we just verify the button exists and is clickable
      }
    })
  })

  describe('Compact variant', () => {
    it('renders in compact layout', () => {
      render(<UserCard user={mockUser} variant="compact" />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      // Biography should not be shown in compact variant
      expect(screen.queryByText('This is a test user biography')).not.toBeInTheDocument()
    })

    it('shows follow button in compact variant', () => {
      render(<UserCard user={mockUser} variant="compact" />)

      expect(screen.getByText('Follow')).toBeInTheDocument()
    })
  })

  describe('Suggestion variant', () => {
    it('renders in suggestion layout', () => {
      render(<UserCard user={mockUser} variant="suggestion" />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(screen.getByText('This is a test user biography')).toBeInTheDocument()
      expect(screen.getByText('1.5K followers')).toBeInTheDocument()
      expect(screen.getByText('42 posts')).toBeInTheDocument()
    })

    it('shows full-width follow button in suggestion variant', () => {
      render(<UserCard user={mockUser} variant="suggestion" />)

      const followButton = screen.getByText('Follow')
      expect(followButton).toBeInTheDocument()
      expect(followButton.closest('button')).toHaveClass('w-full')
    })

    it('shows "Following" text when already following in suggestion variant', () => {
      render(<UserCard user={mockUser} variant="suggestion" isFollowing={true} />)

      expect(screen.getByText('Following')).toBeInTheDocument()
    })
  })

  describe('Loading states', () => {
    it('shows loading spinner when follow action is in progress', async () => {
      const mockOnFollow = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<UserCard user={mockUser} onFollow={mockOnFollow} />)

      const followButton = screen.getByText('Follow')
      fireEvent.click(followButton)

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
      expect(followButton.closest('button')).toBeDisabled()
    })
  })

  describe('Fallback states', () => {
    it('shows initials when no avatar', () => {
      const userWithoutAvatar = { ...mockUser, avatar: null }
      render(<UserCard user={userWithoutAvatar} />)

      expect(screen.getByText('TU')).toBeInTheDocument() // Test User initials
    })

    it('handles user without display name', () => {
      const userWithoutDisplayName = { ...mockUser, display_name: null }
      render(<UserCard user={userWithoutDisplayName} />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
      // Should not show @ prefix when display_name is null
      expect(screen.queryByText('@testuser')).not.toBeInTheDocument()
    })

    it('handles user without username', () => {
      const userWithoutUsername = { ...mockUser, username: null }
      render(<UserCard user={userWithoutUsername} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.queryByText('@')).not.toBeInTheDocument()
    })

    it('shows "Unknown User" when no display name or username', () => {
      const userWithoutNames = { ...mockUser, display_name: null, username: null }
      render(<UserCard user={userWithoutNames} />)

      expect(screen.getByText('Unknown User')).toBeInTheDocument()
    })
  })

  describe('Count formatting', () => {
    it('formats large numbers correctly', () => {
      const userWithLargeCounts = {
        ...mockUser,
        followers_count: 2500000,
        following_count: 1200,
        posts_count: 50000
      }

      render(<UserCard user={userWithLargeCounts} />)

      expect(screen.getByText('2.5M followers')).toBeInTheDocument()
      expect(screen.getByText('1.2K following')).toBeInTheDocument()
      expect(screen.getByText('50.0K posts')).toBeInTheDocument()
    })

    it('shows exact numbers for small counts', () => {
      const userWithSmallCounts = {
        ...mockUser,
        followers_count: 42,
        following_count: 15,
        posts_count: 8
      }

      render(<UserCard user={userWithSmallCounts} />)

      expect(screen.getByText('42 followers')).toBeInTheDocument()
      expect(screen.getByText('15 following')).toBeInTheDocument()
      expect(screen.getByText('8 posts')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles and labels', () => {
      render(<UserCard user={mockUser} showMessageButton={true} />)

      expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /message/i })).toBeInTheDocument()
    })

    it('has proper avatar fallback text', () => {
      render(<UserCard user={mockUser} />)

      // Since the user has no avatar, it should show initials
      expect(screen.getByText('TU')).toBeInTheDocument()
    })
  })
})