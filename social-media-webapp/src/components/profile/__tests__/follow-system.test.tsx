import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserSuggestions } from '../user-suggestions'
import { FollowList } from '../follow-list'
import { useUserSuggestions } from '@/lib/hooks/use-user-suggestions'
import { useFollowList } from '@/lib/hooks/use-follow-list'
import { useAuth } from '@/lib/contexts/auth-context'

// Mock the hooks
vi.mock('@/lib/hooks/use-user-suggestions')
vi.mock('@/lib/hooks/use-follow-list')
vi.mock('@/lib/contexts/auth-context')
vi.mock('@/lib/services/follow-service')

const mockUseUserSuggestions = vi.mocked(useUserSuggestions)
const mockUseFollowList = vi.mocked(useFollowList)
const mockUseAuth = vi.mocked(useAuth)

const mockUser = {
  id: 'user-1',
  uid: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  biography: 'Test bio',
  avatar: null,
  profile_cover_image: null,
  account_premium: false,
  verify: false,
  followers_count: 100,
  following_count: 50,
  posts_count: 25,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockSuggestions = [
  {
    ...mockUser,
    uid: 'user-2',
    username: 'suggested1',
    display_name: 'Suggested User 1',
    mutual_followers_count: 5,
    suggestion_reason: 'mutual_followers' as const
  }
]

describe('Follow System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      userProfile: mockUser,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn()
    })
  })

  describe('UserSuggestions', () => {
    it('renders user suggestions correctly', () => {
      mockUseUserSuggestions.mockReturnValue({
        suggestions: mockSuggestions,
        loading: false,
        error: null,
        refresh: vi.fn(),
        removeSuggestion: vi.fn()
      })

      render(<UserSuggestions />)

      expect(screen.getByText('Suggested for you')).toBeInTheDocument()
      expect(screen.getByText('Suggested User 1')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      mockUseUserSuggestions.mockReturnValue({
        suggestions: [],
        loading: true,
        error: null,
        refresh: vi.fn(),
        removeSuggestion: vi.fn()
      })

      render(<UserSuggestions />)

      expect(screen.getByText('Suggested for you')).toBeInTheDocument()
      // Should show loading skeletons
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(5)
    })

    it('shows empty state when no suggestions', () => {
      mockUseUserSuggestions.mockReturnValue({
        suggestions: [],
        loading: false,
        error: null,
        refresh: vi.fn(),
        removeSuggestion: vi.fn()
      })

      render(<UserSuggestions />)

      expect(screen.getByText('No suggestions available')).toBeInTheDocument()
    })
  })

  describe('FollowList', () => {
    it('renders follow list correctly', () => {
      // Mock both followers and following hooks
      mockUseFollowList
        .mockReturnValueOnce({
          users: [{
            id: 'follow-1',
            follower_id: 'user-2',
            following_id: 'user-1',
            created_at: '2023-01-01T00:00:00Z',
            user: mockUser
          }],
          loading: false,
          hasMore: false,
          totalCount: 1,
          error: null,
          loadMore: vi.fn(),
          refresh: vi.fn()
        })
        .mockReturnValueOnce({
          users: [],
          loading: false,
          hasMore: false,
          totalCount: 0,
          error: null,
          loadMore: vi.fn(),
          refresh: vi.fn()
        })

      render(<FollowList userId="user-1" />)

      expect(screen.getByText('Connections')).toBeInTheDocument()
      expect(screen.getByText('Followers (1)')).toBeInTheDocument()
      expect(screen.getByText('Following (0)')).toBeInTheDocument()
    })

    it('handles search functionality', async () => {
      const mockRefresh = vi.fn()
      mockUseFollowList
        .mockReturnValue({
          users: [],
          loading: false,
          hasMore: false,
          totalCount: 0,
          error: null,
          loadMore: vi.fn(),
          refresh: mockRefresh
        })
        .mockReturnValue({
          users: [],
          loading: false,
          hasMore: false,
          totalCount: 0,
          error: null,
          loadMore: vi.fn(),
          refresh: mockRefresh
        })

      render(<FollowList userId="user-1" />)

      const searchInput = screen.getByPlaceholderText('Search users...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(searchInput).toHaveValue('test')
    })
  })
})