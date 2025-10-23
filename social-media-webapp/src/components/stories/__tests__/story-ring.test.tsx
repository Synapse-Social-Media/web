import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { StoryRing } from '../story-ring'
import type { User } from '@/lib/types/story'

const mockUser: User = {
  id: '1',
  username: 'testuser',
  display_name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  verify: true
}

describe('StoryRing', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user avatar and name', () => {
    render(
      <StoryRing
        user={mockUser}
        hasStories={false}
        hasUnviewed={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows story ring when user has stories', () => {
    const { container } = render(
      <StoryRing
        user={mockUser}
        hasStories={true}
        hasUnviewed={false}
        onClick={mockOnClick}
      />
    )

    const storyRing = container.querySelector('.bg-gray-300')
    expect(storyRing).toBeInTheDocument()
  })

  it('shows unviewed story ring with gradient', () => {
    const { container } = render(
      <StoryRing
        user={mockUser}
        hasStories={true}
        hasUnviewed={true}
        onClick={mockOnClick}
      />
    )

    const gradientRing = container.querySelector('.bg-gradient-to-tr')
    expect(gradientRing).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    render(
      <StoryRing
        user={mockUser}
        hasStories={true}
        hasUnviewed={false}
        onClick={mockOnClick}
      />
    )

    fireEvent.click(screen.getByText('Test User').closest('div')!)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('displays fallback initials when no avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null }
    render(
      <StoryRing
        user={userWithoutAvatar}
        hasStories={false}
        hasUnviewed={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('displays username when no display name', () => {
    const userWithoutDisplayName = { ...mockUser, display_name: null }
    render(
      <StoryRing
        user={userWithoutDisplayName}
        hasStories={false}
        hasUnviewed={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
})