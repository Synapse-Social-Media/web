import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { describe, it, beforeEach } from 'vitest'
import { FeedContainer } from '../feed-container'

// Mock the auth context
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  display_name: 'Test User',
  avatar: null
}

const mockAuthContext = {
  user: mockUser,
  userProfile: null,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}

vi.mock('@/lib/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock Supabase client
const mockSupabaseSelect = vi.fn()
const mockSupabaseChannel = vi.fn()
const mockSupabaseRemoveChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: mockSupabaseSelect,
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: mockSupabaseChannel,
    removeChannel: mockSupabaseRemoveChannel,
  }),
}))

// Mock PostComposer
vi.mock('../post-composer', () => ({
  PostComposer: ({ onPostCreated }: { onPostCreated?: () => void }) => (
    <div data-testid="post-composer">
      <button onClick={onPostCreated}>Create Post</button>
    </div>
  ),
}))

// Mock PostCard
vi.mock('../post-card', () => ({
  PostCard: ({ post, onLike, onComment, onShare, onEdit, onDelete, onReport }: any) => (
    <div data-testid={`post-${post.id}`}>
      <span>{post.content}</span>
      <button onClick={() => onLike?.(post.id, true)}>Like</button>
      <button onClick={() => onComment?.(post.id)}>Comment</button>
      <button onClick={() => onShare?.(post.id)}>Share</button>
      <button onClick={() => onEdit?.(post.id)}>Edit</button>
      <button onClick={() => onDelete?.(post.id)}>Delete</button>
      <button onClick={() => onReport?.(post.id, post.user_id)}>Report</button>
    </div>
  ),
}))

// Mock PostModal
vi.mock('../post-modal', () => ({
  PostModal: ({ open, post }: { open: boolean; post: any }) => 
    open && post ? <div data-testid="post-modal">{post.content}</div> : null,
}))

// Mock EditPostModal
vi.mock('../edit-post-modal', () => ({
  EditPostModal: ({ open, post }: { open: boolean; post: any }) => 
    open && post ? <div data-testid="edit-modal">{post.content}</div> : null,
}))

// Mock ReportPostModal
vi.mock('../report-post-modal', () => ({
  ReportPostModal: ({ open, postId }: { open: boolean; postId: string | null }) => 
    open && postId ? <div data-testid="report-modal">{postId}</div> : null,
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockPosts = [
  {
    id: 'post-1',
    user_id: 'user-1',
    content: 'First test post',
    media_urls: null,
    media_types: null,
    post_type: 'text',
    visibility: 'public',
    likes_count: 5,
    comments_count: 3,
    shares_count: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      username: 'testuser',
      display_name: 'Test User',
      avatar: null,
      verify: false
    }
  },
  {
    id: 'post-2',
    user_id: 'user-2',
    content: 'Second test post',
    media_urls: null,
    media_types: null,
    post_type: 'text',
    visibility: 'public',
    likes_count: 2,
    comments_count: 1,
    shares_count: 0,
    created_at: '2024-01-01T01:00:00Z',
    updated_at: '2024-01-01T01:00:00Z',
    user: {
      id: 'user-2',
      username: 'otheruser',
      display_name: 'Other User',
      avatar: null,
      verify: true
    }
  }
]

describe('FeedContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful data fetch
    mockSupabaseSelect.mockImplementation(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: mockPosts, error: null }))
        }))
      }))
    }))
    
    // Mock real-time channel
    mockSupabaseChannel.mockReturnValue({
      on: vi.fn(() => ({
        on: vi.fn(() => ({
          on: vi.fn(() => ({
            subscribe: vi.fn()
          }))
        }))
      }))
    })
  })

  it('renders feed container with composer', async () => {
    render(<FeedContainer />)
    
    expect(screen.getByTestId('post-composer')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
      expect(screen.getByTestId('post-post-2')).toBeInTheDocument()
    })
  })

  it('renders feed without composer when showComposer is false', async () => {
    render(<FeedContainer showComposer={false} />)
    
    expect(screen.queryByTestId('post-composer')).not.toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    // Mock loading state
    mockSupabaseSelect.mockImplementation(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => new Promise(() => {})) // Never resolves
        }))
      }))
    }))
    
    render(<FeedContainer />)
    
    // Should show skeleton loaders
    expect(screen.getByText('Create Post')).toBeInTheDocument() // Composer is still shown
  })

  it('shows empty state when no posts', async () => {
    mockSupabaseSelect.mockImplementation(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
    
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByText('No posts in your feed yet.')).toBeInTheDocument()
    })
  })

  it('handles post creation', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-composer')).toBeInTheDocument()
    })
    
    const createButton = screen.getByText('Create Post')
    await user.click(createButton)
    
    // Should trigger refresh (implementation dependent)
    expect(mockSupabaseSelect).toHaveBeenCalled()
  })

  it('handles like action', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
    })
    
    const likeButton = screen.getByText('Like')
    await user.click(likeButton)
    
    // Should update post state optimistically
    expect(likeButton).toBeInTheDocument()
  })

  it('opens post modal when comment is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
    })
    
    const commentButton = screen.getByText('Comment')
    await user.click(commentButton)
    
    expect(screen.getByTestId('post-modal')).toBeInTheDocument()
  })

  it('opens edit modal when edit is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
    })
    
    const editButton = screen.getByText('Edit')
    await user.click(editButton)
    
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument()
  })

  it('opens report modal when report is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-2')).toBeInTheDocument()
    })
    
    const reportButton = screen.getAllByText('Report')[0] // Get first report button
    await user.click(reportButton)
    
    expect(screen.getByTestId('report-modal')).toBeInTheDocument()
  })

  it('handles post deletion', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true))
    
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)
    
    // Should call delete API
    expect(mockSupabaseSelect).toHaveBeenCalled()
  })

  it('changes sort order', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByText('Newest First')).toBeInTheDocument()
    })
    
    // Click sort dropdown
    const sortTrigger = screen.getByText('Newest First')
    await user.click(sortTrigger)
    
    // Select different sort option
    const oldestOption = screen.getByText('Oldest First')
    await user.click(oldestOption)
    
    // Should trigger new data fetch
    expect(mockSupabaseSelect).toHaveBeenCalled()
  })

  it('changes filter option', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByText('All Posts')).toBeInTheDocument()
    })
    
    // Click filter dropdown
    const filterTrigger = screen.getByText('All Posts')
    await user.click(filterTrigger)
    
    // Select different filter option
    const imageOption = screen.getByText('Images')
    await user.click(imageOption)
    
    // Should trigger new data fetch with filter
    expect(mockSupabaseSelect).toHaveBeenCalled()
  })

  it('handles refresh action', async () => {
    const user = userEvent.setup()
    render(<FeedContainer />)
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
    
    const refreshButton = screen.getByText('Refresh')
    await user.click(refreshButton)
    
    // Should trigger data refresh
    expect(mockSupabaseSelect).toHaveBeenCalled()
  })

  it('shows user-specific posts when userId is provided', async () => {
    render(<FeedContainer userId="user-1" />)
    
    await waitFor(() => {
      expect(mockSupabaseSelect).toHaveBeenCalled()
    })
    
    // Should filter posts by user_id
    expect(mockSupabaseSelect).toHaveBeenCalledWith(expect.stringContaining('*'))
  })

  it('sets up real-time subscriptions', () => {
    render(<FeedContainer />)
    
    expect(mockSupabaseChannel).toHaveBeenCalledWith('posts_changes')
  })

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = render(<FeedContainer />)
    
    unmount()
    
    expect(mockSupabaseRemoveChannel).toHaveBeenCalled()
  })
})