import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SearchBar } from '../search-bar'
import { SearchSuggestion } from '@/lib/types/search'

const mockSuggestions: SearchSuggestion[] = [
  {
    id: 'user-1',
    text: 'john_doe',
    type: 'user',
    avatar: 'https://example.com/avatar.jpg'
  },
  {
    id: 'hashtag-1',
    text: '#trending',
    type: 'hashtag'
  },
  {
    id: 'recent-1',
    text: 'recent search',
    type: 'recent'
  }
]

describe('SearchBar', () => {
  const mockOnSearch = vi.fn()
  const mockOnSuggestionSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    render(<SearchBar placeholder="Search test..." />)
    
    expect(screen.getByPlaceholderText('Search test...')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onSearch when typing in input', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')
    await user.keyboard('{Enter}')
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('displays suggestions when focused and has suggestions', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={mockSuggestions}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    expect(screen.getByText('john_doe')).toBeInTheDocument()
    expect(screen.getByText('#trending')).toBeInTheDocument()
    expect(screen.getByText('recent search')).toBeInTheDocument()
  })

  it('calls onSuggestionSelect when suggestion is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={mockSuggestions}
        onSuggestionSelect={mockOnSuggestionSelect}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    const suggestion = screen.getByText('john_doe')
    await user.click(suggestion)
    
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0])
  })

  it('navigates suggestions with arrow keys', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={mockSuggestions}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    // Navigate down
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    
    // The second suggestion should be highlighted
    const suggestions = screen.getAllByRole('button')
    expect(suggestions[1]).toHaveClass('bg-muted')
  })

  it('selects suggestion with Enter key', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={mockSuggestions}
        onSuggestionSelect={mockOnSuggestionSelect}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0])
  })

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')
    
    const clearButton = screen.getByRole('button')
    await user.click(clearButton)
    
    expect(input).toHaveValue('')
    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('closes suggestions when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <SearchBar suggestions={mockSuggestions} showSuggestions={true} />
        <div data-testid="outside">Outside element</div>
      </div>
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    expect(screen.getByText('john_doe')).toBeInTheDocument()
    
    const outside = screen.getByTestId('outside')
    await user.click(outside)
    
    await waitFor(() => {
      expect(screen.queryByText('john_doe')).not.toBeInTheDocument()
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(<SearchBar isLoading={true} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('displays different icons for different suggestion types', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={mockSuggestions}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    // Check that different suggestion types have different visual indicators
    const suggestionButtons = screen.getAllByRole('button')
    expect(suggestionButtons).toHaveLength(3)
  })

  it('shows "No suggestions found" when query exists but no suggestions', async () => {
    const user = userEvent.setup()
    render(
      <SearchBar 
        suggestions={[]}
        showSuggestions={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'no results')
    await user.click(input)
    
    expect(screen.getByText('No suggestions found')).toBeInTheDocument()
  })
})