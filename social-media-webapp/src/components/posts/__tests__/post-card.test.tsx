import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { describe, it, beforeEach } from 'vitest'
import { PostCard } from '../post-card'

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
const mockSupabaseInsert = vi.fn()
const mockSupabaseDelete = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: mockSupabaseDelete,
          })),
        })),
      })),
    })),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}))

const mockPost = {
  id: 'post-1',
  user_id: 'user-2',
  content: 'This is a test post with #hashtag and @mention',
  media_urls: null,
  media_types: null,
  post_type: 'text' as const,
  visibility: 'public' as const,
  likes_count: 5,
  comments_count: 3,
  shares_count: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user: {
    id: 'user-2',
    username: 'otheruser',
    display_name: 'Other User',
    avatar: null,
    verify: true
  }
}

const mockOwnPost = {
  ...mockPost,
  user_id: 'user-1',
  user: {
    ...mockPost.user,
    id: 'user-1',
    username: 'testuser',
    display_name: 'Test User'
  }
}

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseInsert.mockResolvedValue({ error: null })
    mockSupabaseDelete.mockResolvedValue({ error: null })
  })

  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('Other User')).toBeInTheDocument()
    expect(screen.getByText('@otheruser')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    expect(screen.getByText('This is a test post with #hashtag and @mention')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // likes count
    expect(screen.getByText('3')).toBeInTheDocument() // comments count
    expect(screen.getByText('1')).toBeInTheDocument() // shares count
  })

  it('shows verified badge for verified users', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('highlights hashtags and mentions', () => {
    render(<PostCard post={mockPost} />)
    
    const hashtag = screen.getByText('#hashtag')
    const mention = screen.getByText('@mention')
    
    expect(hashtag).toHaveClass('text-blue-600')
    expect(mention).toHaveClass('text-green-600')
  })

  it('shows visibility icon correctly', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('calls onLike when like button is clicked', async () => {
    const user = userEvent.setup()
    const onLike = vi.fn()
    render(<PostCard post={mockPost} onLike={onLike} />)
    
    const likeButton = screen.getByRole('button', { name: /5/i })
    await user.click(likeButton)
    
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        target_id: 'post-1',
        target_type: 'post'
      })
    })
  })

  it('calls onComment when comment button is clicked', async () => {
    const user = userEvent.setup()
    const onComment = vi.fn()
    render(<PostCard post={mockPost} onComment={onComment} />)
    
    const commentButton = screen.getByRole('button', { name: /3/i })
    await user.click(commentButton)
    
    expect(onComment).toHaveBeenCalledWith('post-1')
  })

  it('calls onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    render(<PostCard post={mockPost} onShare={onShare} />)
    
    const shareButton = screen.getByRole('button', { name: /1/i })
    await user.click(shareButton)
    
    expect(onShare).toHaveBeenCalledWith('post-1')
  })

  it('shows edit and delete options for own posts', async () => {
    const user = userEvent.setup()
    render(<PostCard post={mockOwnPost} />)
    
    const moreButton = screen.getByRole('button', { name: '' }) // More options button
    await user.click(moreButton)
    
    expect(screen.getByText('Edit post')).toBeInTheDocument()
    expect(screen.getByText('Delete post')).toBeInTheDocument()
  })

  it('shows report option for other users posts', async () => {
    const user = userEvent.setup()
    render(<PostCard post={mockPost} />)
    
    const moreButton = screen.getByRole('button', { name: '' }) // More options button
    await user.click(moreButton)
    
    expect(screen.getByText('Report post')).toBeInTheDocument()
  })

  it('calls onEdit when edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<PostCard post={mockOwnPost} onEdit={onEdit} />)
    
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)
    
    const editButton = screen.getByText('Edit post')
    await user.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith('post-1')
  })

  it('calls onDelete when delete is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<PostCard post={mockOwnPost} onDelete={onDelete} />)
    
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)
    
    const deleteButton = screen.getByText('Delete post')
    await user.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledWith('post-1')
  })

  it('calls onReport when report is clicked', async () => {
    const user = userEvent.setup()
    const onReport = vi.fn()
    render(<PostCard post={mockPost} onReport={onReport} />)
    
    const moreButton = screen.getByRole('button', { name: '' })
    await user.click(moreButton)
    
    const reportButton = screen.getByText('Report post')
    await user.click(reportButton)
    
    expect(onReport).toHaveBeenCalledWith('post-1', 'user-2')
  })

  it('renders media content when present', () => {
    const postWithMedia = {
      ...mockPost,
      media_urls: ['https://example.com/image.jpg'],
      media_types: ['image'],
      post_type: 'image' as const
    }
    
    render(<PostCard post={postWithMedia} />)
    
    const image = screen.getByAltText('Post media')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('renders multiple media items in grid', () => {
    const postWithMultipleMedia = {
      ...mockPost,
      media_urls: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ],
      media_types: ['image', 'image', 'image'],
      post_type: 'image' as const
    }
    
    render(<PostCard post={postWithMultipleMedia} />)
    
    expect(screen.getByAltText('Post media 1')).toBeInTheDocument()
    expect(screen.getByAltText('Post media 2')).toBeInTheDocument()
    expect(screen.getByAltText('Post media 3')).toBeInTheDocument()
  })

  it('shows optimistic like update', async () => {
    const user = userEvent.setup()
    render(<PostCard post={mockPost} />)
    
    const likeButton = screen.getByRole('button', { name: /5/i })
    await user.click(likeButton)
    
    // Should immediately show updated count (optimistic update)
    expect(screen.getByText('6')).toBeInTheDocument()
  })
})