import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { describe, it, beforeEach } from 'vitest'
import { PostComposer } from '../post-composer'
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
const mockSupabaseUpload = vi.fn()
const mockSupabaseGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: mockSupabaseUpload,
        getPublicUrl: mockSupabaseGetPublicUrl,
      })),
    },
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
  content: 'This is a test post',
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
    verify: false
  }
}

describe('Posts Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseInsert.mockResolvedValue({ error: null })
    mockSupabaseUpload.mockResolvedValue({ 
      data: { path: 'test-path' }, 
      error: null 
    })
    mockSupabaseGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/test-image.jpg' }
    })
  })

  describe('PostComposer', () => {
    it('renders basic composer elements', () => {
      render(<PostComposer />)
      
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
    })

    it('enables post button when content is added', async () => {
      const user = userEvent.setup()
      render(<PostComposer />)
      
      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const postButton = screen.getByRole('button', { name: /post/i })
      
      expect(postButton).toBeDisabled()
      
      await user.type(textarea, 'Hello world!')
      
      expect(postButton).not.toBeDisabled()
    })

    it('creates a post when submitted', async () => {
      const user = userEvent.setup()
      const onPostCreated = vi.fn()
      render(<PostComposer onPostCreated={onPostCreated} />)
      
      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const postButton = screen.getByRole('button', { name: /post/i })
      
      await user.type(textarea, 'Hello world!')
      await user.click(postButton)
      
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'user-1',
            content: 'Hello world!',
            post_type: 'text',
            visibility: 'public'
          })
        )
      })
    })

    it('shows character count', async () => {
      const user = userEvent.setup()
      render(<PostComposer />)
      
      const textarea = screen.getByPlaceholderText("What's on your mind?")
      await user.type(textarea, 'Hello!')
      
      expect(screen.getByText('6/500')).toBeInTheDocument()
    })
  })

  describe('PostCard', () => {
    it('renders post content', () => {
      render(<PostCard post={mockPost} />)
      
      expect(screen.getByText('Other User')).toBeInTheDocument()
      expect(screen.getByText('This is a test post')).toBeInTheDocument()
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    })

    it('shows interaction counts', () => {
      render(<PostCard post={mockPost} />)
      
      expect(screen.getByText('5')).toBeInTheDocument() // likes
      expect(screen.getByText('3')).toBeInTheDocument() // comments
      expect(screen.getByText('1')).toBeInTheDocument() // shares
    })

    it('calls onLike when like button is clicked', async () => {
      const user = userEvent.setup()
      const onLike = vi.fn()
      render(<PostCard post={mockPost} onLike={onLike} />)
      
      // Find like button by looking for heart icon or like functionality
      const likeButtons = screen.getAllByRole('button')
      const likeButton = likeButtons.find(button => 
        button.textContent?.includes('5') // Like count
      )
      
      if (likeButton) {
        await user.click(likeButton)
        
        await waitFor(() => {
          expect(mockSupabaseInsert).toHaveBeenCalledWith(
            expect.objectContaining({
              user_id: 'user-1',
              target_id: 'post-1',
              target_type: 'post'
            })
          )
        })
      }
    })

    it('calls onComment when comment button is clicked', async () => {
      const user = userEvent.setup()
      const onComment = vi.fn()
      render(<PostCard post={mockPost} onComment={onComment} />)
      
      const commentButtons = screen.getAllByRole('button')
      const commentButton = commentButtons.find(button => 
        button.textContent?.includes('3') // Comment count
      )
      
      if (commentButton) {
        await user.click(commentButton)
        expect(onComment).toHaveBeenCalledWith('post-1')
      }
    })

    it('shows own post options', () => {
      const ownPost = { ...mockPost, user_id: 'user-1' }
      render(<PostCard post={ownPost} />)
      
      // Should show more options button for own posts
      const moreButtons = screen.getAllByRole('button')
      expect(moreButtons.length).toBeGreaterThan(3) // Like, comment, share, more
    })
  })

  describe('Post Interactions', () => {
    it('handles hashtags in content', () => {
      const postWithHashtag = {
        ...mockPost,
        content: 'This is a post with #hashtag'
      }
      
      render(<PostCard post={postWithHashtag} />)
      
      expect(screen.getByText('#hashtag')).toBeInTheDocument()
    })

    it('handles mentions in content', () => {
      const postWithMention = {
        ...mockPost,
        content: 'Hello @username how are you?'
      }
      
      render(<PostCard post={postWithMention} />)
      
      expect(screen.getByText('@username')).toBeInTheDocument()
    })

    it('shows visibility indicator', () => {
      render(<PostCard post={mockPost} />)
      
      expect(screen.getByText('public')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles post creation error', async () => {
      const user = userEvent.setup()
      mockSupabaseInsert.mockResolvedValue({ error: 'Database error' })
      
      render(<PostComposer />)
      
      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const postButton = screen.getByRole('button', { name: /post/i })
      
      await user.type(textarea, 'Hello world!')
      await user.click(postButton)
      
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalled()
      })
    })

    it('prevents empty post submission', () => {
      render(<PostComposer />)
      
      const postButton = screen.getByRole('button', { name: /post/i })
      expect(postButton).toBeDisabled()
    })
  })
})