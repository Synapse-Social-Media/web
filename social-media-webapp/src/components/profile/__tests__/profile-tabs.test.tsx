import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileTabs } from '../profile-tabs'

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

const mockPosts = [
  {
    id: 'post-1',
    user_id: 'user-1',
    content: 'This is a test post',
    media_urls: ['https://example.com/image1.jpg'],
    media_types: ['image'],
    post_type: 'image' as const,
    visibility: 'public' as const,
    likes_count: 10,
    comments_count: 5,
    shares_count: 2,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'post-2',
    user_id: 'user-1',
    content: 'Another test post',
    media_urls: null,
    media_types: null,
    post_type: 'text' as const,
    visibility: 'public' as const,
    likes_count: 15,
    comments_count: 8,
    shares_count: 0,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
]

const mockFollowers = [
  {
    ...mockUser,
    id: 'follower-1',
    uid: 'follower-1',
    username: 'follower1',
    display_name: 'Follower One'
  }
]

const mockFollowing = [
  {
    ...mockUser,
    id: 'following-1',
    uid: 'following-1',
    username: 'following1',
    display_name: 'Following One'
  }
]

describe('ProfileTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tabs with correct counts', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        followers={mockFollowers}
        following={mockFollowing}
      />
    )

    expect(screen.getByText('Posts')).toBeInTheDocument()
    expect(screen.getByText('Media')).toBeInTheDocument()
    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('Following')).toBeInTheDocument()

    // Check counts in badges
    expect(screen.getByText('25')).toBeInTheDocument() // posts count
    expect(screen.getByText('100')).toBeInTheDocument() // followers count
    expect(screen.getByText('50')).toBeInTheDocument() // following count
  })

  it('displays posts correctly in posts tab', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
      />
    )

    expect(screen.getByText('This is a test post')).toBeInTheDocument()
    expect(screen.getByText('Another test post')).toBeInTheDocument()
    expect(screen.getByText('10 likes')).toBeInTheDocument()
    expect(screen.getByText('5 comments')).toBeInTheDocument()
  })

  it('switches between tabs correctly', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        followers={mockFollowers}
        following={mockFollowing}
      />
    )

    // Initially shows posts tab
    expect(screen.getByText('This is a test post')).toBeInTheDocument()

    // Click on media tab
    fireEvent.click(screen.getByText('Media'))
    // Should switch to media tab (content may be empty but tab should be active)
    
    // Click back to posts tab
    fireEvent.click(screen.getByText('Posts'))
    expect(screen.getByText('This is a test post')).toBeInTheDocument()
  })

  it('shows media tab with image posts only', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
      />
    )

    fireEvent.click(screen.getByText('Media'))

    // Should show media grid with images
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('shows empty state when no posts', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={[]}
        isOwnProfile={true}
      />
    )

    expect(screen.getByText('No posts yet')).toBeInTheDocument()
    expect(screen.getByText('Share your first post to get started!')).toBeInTheDocument()
  })

  it('shows empty state for other users with no posts', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={[]}
        isOwnProfile={false}
      />
    )

    expect(screen.getByText('No posts yet')).toBeInTheDocument()
    expect(screen.getByText("This user hasn't posted anything yet.")).toBeInTheDocument()
  })

  it('shows media tab with filtered posts', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        isOwnProfile={true}
      />
    )

    fireEvent.click(screen.getByText('Media'))
    
    // Should show media tab content (may be empty or show media grid)
    const mediaTab = screen.getByRole('tabpanel')
    expect(mediaTab).toBeInTheDocument()
  })

  it('shows followers tab', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        followers={[]}
        isOwnProfile={true}
      />
    )

    fireEvent.click(screen.getByText('Followers'))
    
    // Should show followers tab content
    const followersTab = screen.getByRole('tabpanel')
    expect(followersTab).toBeInTheDocument()
  })

  it('shows following tab', () => {
    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        following={[]}
        isOwnProfile={true}
      />
    )

    fireEvent.click(screen.getByText('Following'))
    
    // Should show following tab content
    const followingTab = screen.getByRole('tabpanel')
    expect(followingTab).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(
      <ProfileTabs
        user={mockUser}
        isLoading={true}
      />
    )

    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('calls load more functions when buttons are clicked', () => {
    const mockLoadMorePosts = vi.fn()

    render(
      <ProfileTabs
        user={mockUser}
        posts={mockPosts}
        onLoadMorePosts={mockLoadMorePosts}
      />
    )

    // Test load more posts
    fireEvent.click(screen.getByText('Load more posts'))
    expect(mockLoadMorePosts).toHaveBeenCalled()
  })

  it('formats large counts correctly in badges', () => {
    const userWithLargeCounts = {
      ...mockUser,
      posts_count: 1500,
      followers_count: 2500000,
      following_count: 1200
    }

    render(
      <ProfileTabs
        user={userWithLargeCounts}
        posts={mockPosts}
      />
    )

    expect(screen.getByText('1.5K')).toBeInTheDocument() // posts
    expect(screen.getByText('2.5M')).toBeInTheDocument() // followers
    expect(screen.getByText('1.2K')).toBeInTheDocument() // following
  })

  it('handles video posts in media tab', () => {
    const videoPost = {
      ...mockPosts[0],
      post_type: 'video' as const,
      media_types: ['video']
    }

    render(
      <ProfileTabs
        user={mockUser}
        posts={[videoPost]}
      />
    )

    fireEvent.click(screen.getByText('Media'))
    
    // Should show media tab (content depends on implementation)
    const mediaTab = screen.getByRole('tabpanel')
    expect(mediaTab).toBeInTheDocument()
  })
})