'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, Hash, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SearchSuggestion } from '@/lib/types/search'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  suggestions?: SearchSuggestion[]
  isLoading?: boolean
  className?: string
  showSuggestions?: boolean
}

export function SearchBar({
  placeholder = "Search users, posts, and hashtags...",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  className,
  showSuggestions = true
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const showSuggestionsDropdown = showSuggestions && isFocused && (query.length > 0 || suggestions.length > 0)

  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    // Trigger search as user types (debounced in parent component)
    onSearch?.(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query.trim())
      setIsFocused(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsFocused(false)
    onSuggestionSelect?.(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionsDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  const clearSearch = () => {
    setQuery('')
    setSelectedIndex(-1)
    onSearch?.('')
    inputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-muted-foreground" />
      case 'hashtag':
        return <Hash className="h-4 w-4 text-muted-foreground" />
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 sm:h-11"
          disabled={isLoading}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3",
                    selectedIndex === index && "bg-muted"
                  )}
                >
                  {suggestion.type === 'user' && suggestion.avatar ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={suggestion.avatar} />
                      <AvatarFallback className="text-xs">
                        {suggestion.text.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    getSuggestionIcon(suggestion.type)
                  )}
                  <span className="flex-1 text-sm">{suggestion.text}</span>
                  {suggestion.type === 'recent' && (
                    <Badge variant="secondary" className="text-xs">
                      Recent
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No suggestions found
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Start typing to search...
            </div>
          )}
        </div>
      )}
    </div>
  )
}