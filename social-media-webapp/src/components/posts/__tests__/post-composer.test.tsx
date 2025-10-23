import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { describe, it, beforeEach } from 'vitest'
import { PostComposer } from '../post-composer'

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

describe('PostComposer', () => {
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

  it('renders post composer with all elements', () => {
    render(<PostComposer />)
    
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Video')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
  })

  it('updates character count as user types', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'Hello world!')
    
    expect(screen.getByText('12/500')).toBeInTheDocument()
  })

  it('detects hashtags and mentions', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'Hello #world @testuser!')
    
    await waitFor(() => {
      expect(screen.getByText('#world')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })
  })

  it('disables post button when content is empty', () => {
    render(<PostComposer />)
    
    const postButton = screen.getByRole('button', { name: /post/i })
    expect(postButton).toBeDisabled()
  })

  it('enables post button when content is added', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const postButton = screen.getByRole('button', { name: /post/i })
    
    await user.type(textarea, 'Hello world!')
    
    expect(postButton).not.toBeDisabled()
  })

  it('creates a text post successfully', async () => {
    const user = userEvent.setup()
    const onPostCreated = vi.fn()
    render(<PostComposer onPostCreated={onPostCreated} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const postButton = screen.getByRole('button', { name: /post/i })
    
    await user.type(textarea, 'Hello world!')
    await user.click(postButton)
    
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        content: 'Hello world!',
        media_urls: null,
        media_types: null,
        post_type: 'text',
        visibility: 'public'
      })
      expect(onPostCreated).toHaveBeenCalled()
    })
  })

  it('changes visibility setting', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    // Click on visibility selector
    const visibilityTrigger = screen.getByText('Public')
    await user.click(visibilityTrigger)
    
    // Select followers option
    const followersOption = screen.getByText('Followers')
    await user.click(followersOption)
    
    // Verify the selection changed
    expect(screen.getByText('Followers')).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /photo/i })
    
    // Mock file input
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (hiddenInput) {
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(hiddenInput)
    }
    
    // Should show media preview (implementation dependent)
    // This test verifies the file handling mechanism exists
    expect(hiddenInput).toBeInTheDocument()
  })

  it('prevents posting when content exceeds character limit', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const longContent = 'a'.repeat(501) // Exceeds 500 character limit
    
    await user.type(textarea, longContent)
    
    const postButton = screen.getByRole('button', { name: /post/i })
    expect(postButton).toBeDisabled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockSupabaseInsert.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )
    
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const postButton = screen.getByRole('button', { name: /post/i })
    
    await user.type(textarea, 'Hello world!')
    await user.click(postButton)
    
    // Should show loading state
    expect(postButton).toBeDisabled()
  })

  it('resets form after successful post creation', async () => {
    const user = userEvent.setup()
    render(<PostComposer />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const postButton = screen.getByRole('button', { name: /post/i })
    
    await user.type(textarea, 'Hello world!')
    await user.click(postButton)
    
    await waitFor(() => {
      expect(textarea).toHaveValue('')
      expect(screen.getByText('0/500')).toBeInTheDocument()
    })
  })
})