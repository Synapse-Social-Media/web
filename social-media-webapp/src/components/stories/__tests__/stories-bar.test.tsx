import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { StoriesBar } from '../stories-bar'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gt: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
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

const renderStoriesBar = () => {
  const mockOnCreateStory = vi.fn()
  const mockOnViewStory = vi.fn()

  return {
    ...render(
      <StoriesBar
        onCreateStory={mockOnCreateStory}
        onViewStory={mockOnViewStory}
      />
    ),
    mockOnCreateStory,
    mockOnViewStory
  }
}

describe('StoriesBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create story button for authenticated user', async () => {
    renderStoriesBar()

    await waitFor(() => {
      expect(screen.getByText('Your Story')).toBeInTheDocument()
    })
  })

  it('shows loading skeletons initially', () => {
    renderStoriesBar()

    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('calls onCreateStory when create button is clicked', async () => {
    const user = userEvent.setup()
    const { mockOnCreateStory } = renderStoriesBar()

    await waitFor(() => {
      expect(screen.getByText('Your Story')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Your Story').closest('div')?.querySelector('button')
    if (createButton) {
      await user.click(createButton)
      expect(mockOnCreateStory).toHaveBeenCalledTimes(1)
    }
  })

  it('shows empty state when no stories available', async () => {
    renderStoriesBar()

    await waitFor(() => {
      expect(screen.getByText('No stories available. Be the first to share one!')).toBeInTheDocument()
    })
  })
})