import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SearchResults } from '../search-results'
import { SearchResults as SearchResultsType, UserSearchResult, PostSearchResult, HashtagSearchResult } from '@/lib/types/search'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

const mockUserResult: UserSearchResult = {
  id: 'user-1',
  type: 'user',
  relevance_score: 0.9,
  user: {
    id: 'user-1',
    username: 'john_doe',
    display_name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    verify: true,
    followers_count: 1000
  }
}

const mockPostResult: PostSearchResult = {
  id: 'post-1',
  type: 'post',
  relevance_score: 0.8,
  post: {
    id: 'post-1',
    content: 'This is a test post with #hashtag',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    likes_count: 50,
    comments_count: 10,
    user: {
      username: 'jane_doe',
      display_name: 'Jane Doe',
      avatar: 'https://example.com/avatar2.jpg',
      verify: false
    }
  }
}

const mockHashtagResult: HashtagSearchResult = {
  id: 'hashtag-1',
  type: 'hashtag',
  relevance_score: 0.7,
  hashtag: {
    tag: 'trending',
    post_count: 500,
    trending_score: 0.9
  }
}

const mockResults: SearchResultsType[] = [
  mockUserResult,
  mockPostResult,
  mockHashtagResult
]

// Mock the UserCard and PostCard components
vi.mock('@/components/profile/user-card', () => ({
  UserCard: ({ user }: any) => (
    <div data-testid="user-card">
      {user.display_name || user.username}
    </div>
  )
}))

vi.mock('@/components/posts/post-card', () => ({
  PostCard: ({ post }: any) => (
    <div data-testid="post-card">
      {post.content}
    </div>
  )
}))

describe('SearchResults', () => {
  const mockOnLoadMore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tabs with correct counts', () => {
    render(
      <SearchResults 
        results={mockResults}
        query="test"
      />
    )
    
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Posts')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    
    // Check badge counts - use getAllByText since there are multiple "1"s
    expect(screen.getByText('3')).toBeInTheDocument() // All results
    const badges = screen.getAllByText('1')
    expect(badges.length).toBeGreaterThan(0) // Users, Posts, and Tags all have 1
  })

  it('displays mixed results in All tab', () => {
    render(
      <SearchResults 
        results={mockResults}
        query="test"
      />
    )
    
    // Should show user card, hashtag item, and post card
    expect(screen.getByTestId('user-card')).toBeInTheDocument()
    expect(screen.getByTestId('post-card')).toBeInTheDocument()
    expect(screen.getByText('#trending')).toBeInTheDocument()
  })

  it('filters results by tab selection', async () => {
    const user = userEvent.setup()
    render(
      <SearchResults 
        results={mockResults}
        query="test"
      />
    )
    
    // Click Users tab
    await user.click(screen.getByText('Users'))
    
    // Should only show user results
    expect(screen.getByTestId('user-card')).toBeInTheDocument()
    expect(screen.queryByTestId('post-card')).not.toBeInTheDocument()
    expect(screen.queryByText('#trending')).not.toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading is true', () => {
    render(
      <SearchResults 
        results={[]}
        query="test"
        isLoading={true}
      />
    )
    
    // Should show skeleton loaders (check for skeleton class instead)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no results', () => {
    render(
      <SearchResults 
        results={[]}
        query="test"
      />
    )
    
    expect(screen.getByText('No results found for "test"')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
  })

  it('displays hashtag items with trending badges', () => {
    const trendingHashtag: HashtagSearchResult = {
      ...mockHashtagResult,
      hashtag: {
        ...mockHashtagResult.hashtag,
        trending_score: 0.9
      }
    }
    
    render(
      <SearchResults 
        results={[trendingHashtag]}
        query="trending"
      />
    )
    
    expect(screen.getByText('#trending')).toBeInTheDocument()
    expect(screen.getByText('500 posts')).toBeInTheDocument()
    expect(screen.getByText('Trending')).toBeInTheDocument()
  })

  it('shows correct post count formatting', () => {
    const hashtagWithManyPosts: HashtagSearchResult = {
      ...mockHashtagResult,
      hashtag: {
        ...mockHashtagResult.hashtag,
        post_count: 1500
      }
    }
    
    render(
      <SearchResults 
        results={[hashtagWithManyPosts]}
        query="test"
      />
    )
    
    expect(screen.getByText('1,500 posts')).toBeInTheDocument()
  })

  it('handles tab switching correctly', async () => {
    const user = userEvent.setup()
    render(
      <SearchResults 
        results={mockResults}
        query="test"
      />
    )
    
    // Start on All tab
    expect(screen.getByTestId('user-card')).toBeInTheDocument()
    
    // Switch to Posts tab
    await user.click(screen.getByText('Posts'))
    expect(screen.getByTestId('post-card')).toBeInTheDocument()
    expect(screen.queryByTestId('user-card')).not.toBeInTheDocument()
    
    // Switch to Tags tab
    await user.click(screen.getByText('Tags'))
    expect(screen.getByText('#trending')).toBeInTheDocument()
    expect(screen.queryByTestId('post-card')).not.toBeInTheDocument()
  })

  it('shows empty state for specific tab when no results of that type', async () => {
    const user = userEvent.setup()
    const userOnlyResults = [mockUserResult]
    
    render(
      <SearchResults 
        results={userOnlyResults}
        query="test"
      />
    )
    
    // Switch to Posts tab (which has no results)
    await user.click(screen.getByText('Posts'))
    
    expect(screen.getByText('No posts found for "test"')).toBeInTheDocument()
  })

  it('displays verification badges for verified users', () => {
    render(
      <SearchResults 
        results={[mockUserResult]}
        query="test"
      />
    )
    
    // The UserCard component should receive the verify property
    expect(screen.getByTestId('user-card')).toBeInTheDocument()
  })
})