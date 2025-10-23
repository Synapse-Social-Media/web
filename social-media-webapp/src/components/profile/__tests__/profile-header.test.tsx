import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileHeader } from '../profile-header'
import { useFollow } from '@/lib/hooks/use-follow'
import { useAuth } from '@/lib/contexts/auth-context'

// Mock the hooks
vi.mock('@/lib/hooks/use-follow')
vi.mock('@/lib/contexts/auth-context')

const mockUseFollow = vi.mocked(useFollow)
const mockUseAuth = vi.mocked(useAuth)

const mockUser = {
  id: 'user-1',
  uid: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  biography: 'Test bio description',
  avatar: 'https://example.com/avatar.jpg',
  profile_cover_image: 'https://example.com/cover.jpg',
  account_premium: false,
  verify: true,
  followers_count: 150,
  following_count: 75,
  posts_count: 42,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockFollowStats = {
  followers_count: 150,
  following_count: 75,
  is_following: false,
  is_followed_by: false
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'current-user' } as any,
      userProfile: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn()
    })

    mockUseFollow.mockReturnValue({
      stats: mockFollowStats,
      isLoading: false,
      toggleFollow: vi.fn(),
      refreshStats: vi.fn()
    })
  })

  it('renders user profile information correctly', () => {
    render(<ProfileHeader user={mockUser} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('Test bio description')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument() // followers
    expect(screen.getByText('75')).toBeInTheDocument() // following
    expect(screen.getByText('42')).toBeInTheDocument() // posts
  })

  it('shows verified badge for verified users', () => {
    render(<ProfileHeader user={mockUser} />)
    
    expect(screen.getByText('✓ Verified')).toBeInTheDocument()
  })

  it('shows premium badge for premium users', () => {
    const premiumUser = { ...mockUser, account_premium: true }
    render(<ProfileHeader user={premiumUser} />)
    
    expect(screen.getByText('⭐ Premium')).toBeInTheDocument()
  })

  it('shows edit profile button for own profile', () => {
    const mockOnEdit = vi.fn()
    render(<ProfileHeader user={mockUser} isOwnProfile={true} onEdit={mockOnEdit} />)

    const editButton = screen.getByText('Edit Profile')
    expect(editButton).toBeInTheDocument()
    
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalled()
  })

  it('shows follow button for other users profile', () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText('Follow')).toBeInTheDocument()
    expect(screen.getByText('Message')).toBeInTheDocument()
  })

  it('handles follow button click', async () => {
    const mockToggleFollow = vi.fn()
    mockUseFollow.mockReturnValue({
      stats: mockFollowStats,
      isLoading: false,
      toggleFollow: mockToggleFollow,
      refreshStats: vi.fn()
    })

    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    const followButton = screen.getByText('Follow')
    fireEvent.click(followButton)

    expect(mockToggleFollow).toHaveBeenCalled()
  })

  it('shows unfollow button when already following', () => {
    mockUseFollow.mockReturnValue({
      stats: { ...mockFollowStats, is_following: true },
      isLoading: false,
      toggleFollow: vi.fn(),
      refreshStats: vi.fn()
    })

    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText('Unfollow')).toBeInTheDocument()
  })

  it('shows loading state when follow action is in progress', () => {
    mockUseFollow.mockReturnValue({
      stats: mockFollowStats,
      isLoading: true,
      toggleFollow: vi.fn(),
      refreshStats: vi.fn()
    })

    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    // Find the disabled button (loading state)
    const buttons = screen.getAllByRole('button')
    const followButton = buttons.find(button => button.hasAttribute('disabled'))
    expect(followButton).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('handles message button click', () => {
    const mockOnMessage = vi.fn()
    render(<ProfileHeader user={mockUser} isOwnProfile={false} onMessage={mockOnMessage} />)

    const messageButton = screen.getByText('Message')
    fireEvent.click(messageButton)

    expect(mockOnMessage).toHaveBeenCalled()
  })

  it('formats large follower counts correctly', () => {
    const userWithLargeFollowing = {
      ...mockUser,
      followers_count: 1500000,
      following_count: 2500
    }

    mockUseFollow.mockReturnValue({
      stats: {
        followers_count: 1500000,
        following_count: 2500,
        is_following: false,
        is_followed_by: false
      },
      isLoading: false,
      toggleFollow: vi.fn(),
      refreshStats: vi.fn()
    })

    render(<ProfileHeader user={userWithLargeFollowing} />)

    // The component uses the stats from useFollow hook, not directly from user prop
    expect(screen.getByText('1.5M')).toBeInTheDocument() // followers
    expect(screen.getByText('2.5K')).toBeInTheDocument() // following
  })

  it('shows fallback avatar when image fails to load', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null }
    render(<ProfileHeader user={userWithoutAvatar} />)

    expect(screen.getByText('TU')).toBeInTheDocument() // initials
  })

  it('displays join date correctly', () => {
    render(<ProfileHeader user={mockUser} />)

    expect(screen.getByText('Joined January 2023')).toBeInTheDocument()
  })

  it('shows dropdown menu button', () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    // Find the dropdown trigger button (the one with ellipsis icon)
    const buttons = screen.getAllByRole('button')
    const dropdownButton = buttons.find(button => 
      button.getAttribute('aria-haspopup') === 'menu'
    )
    expect(dropdownButton).toBeInTheDocument()
  })
})