import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { StoryComposer } from '../story-composer'

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({ error: null })),
      getPublicUrl: vi.fn(() => ({ 
        data: { publicUrl: 'https://example.com/story.jpg' } 
      }))
    }))
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ error: null }))
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock auth context
const mockAuthContext = {
  user: { id: '1' },
  userProfile: {
    id: '1',
    username: 'testuser',
    display_name: 'Test User',
    avatar: null
  },
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}

vi.mock('@/lib/contexts/auth-context', async () => ({
  ...await vi.importActual('@/lib/contexts/auth-context'),
  useAuth: () => mockAuthContext,
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const renderStoryComposer = (isOpen = true) => {
  const mockOnClose = vi.fn()
  const mockOnStoryCreated = vi.fn()

  return {
    ...render(
      <StoryComposer
        isOpen={isOpen}
        onClose={mockOnClose}
        onStoryCreated={mockOnStoryCreated}
      />
    ),
    mockOnClose,
    mockOnStoryCreated
  }
}

describe('StoryComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders create story dialog when open', () => {
    renderStoryComposer()

    expect(screen.getByText('Create Story')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('Camera')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderStoryComposer(false)

    expect(screen.queryByText('Create Story')).not.toBeInTheDocument()
  })

  it('shows file upload options', () => {
    renderStoryComposer()

    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('Camera')).toBeInTheDocument()
    expect(screen.getByText('Or drag and drop a file here')).toBeInTheDocument()
  })

  it('handles file selection and shows preview', async () => {
    const user = userEvent.setup()
    renderStoryComposer()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByText('Gallery').closest('button')?.nextElementSibling as HTMLInputElement

    if (fileInput) {
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByAltText('Story preview')).toBeInTheDocument()
      })
    }
  })

  it('shows customization options after file selection', async () => {
    const user = userEvent.setup()
    renderStoryComposer()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByText('Gallery').closest('button')?.nextElementSibling as HTMLInputElement

    if (fileInput) {
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('Text Overlay')).toBeInTheDocument()
        expect(screen.getByText('Background Color')).toBeInTheDocument()
        expect(screen.getByText('Visibility')).toBeInTheDocument()
      })
    }
  })

  it('allows text overlay input', async () => {
    const user = userEvent.setup()
    renderStoryComposer()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByText('Gallery').closest('button')?.nextElementSibling as HTMLInputElement

    if (fileInput) {
      await user.upload(fileInput, file)

      await waitFor(() => {
        const textArea = screen.getByPlaceholderText('Add text to your story...')
        expect(textArea).toBeInTheDocument()
      })

      const textArea = screen.getByPlaceholderText('Add text to your story...')
      await user.type(textArea, 'Test story text')
      expect(textArea).toHaveValue('Test story text')
    }
  })

  it('disables share button when no file selected', () => {
    renderStoryComposer()

    const shareButton = screen.getByText('Share Story')
    expect(shareButton).toBeDisabled()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { mockOnClose } = renderStoryComposer()

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})