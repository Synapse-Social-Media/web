'use client'

import { RefreshCw, Sparkles, Users, TrendingUp, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCard } from './user-card'
import { useUserSuggestions } from '@/lib/hooks/use-user-suggestions'
import { useAuth } from '@/lib/contexts/auth-context'
import { followService } from '@/lib/services/follow-service'
import { toast } from 'sonner'

interface UserSuggestionsProps {
  limit?: number
  variant?: 'card' | 'compact'
  showHeader?: boolean
  className?: string
}

export function UserSuggestions({ 
  limit = 5, 
  variant = 'card',
  showHeader = true,
  className = '' 
}: UserSuggestionsProps) {
  const { user } = useAuth()
  const { suggestions, loading, refresh, removeSuggestion } = useUserSuggestions({ 
    limit,
    enabled: !!user 
  })

  const handleFollow = async (userId: string) => {
    try {
      const { error } = await followService.followUser(userId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User followed successfully')
        removeSuggestion(userId)
      }
    } catch (error) {
      toast.error('Failed to follow user')
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      const { error } = await followService.unfollowUser(userId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User unfollowed successfully')
        // Refresh suggestions to get new ones
        refresh()
      }
    } catch (error) {
      toast.error('Failed to unfollow user')
    }
  }

  const getSuggestionIcon = (reason: string) => {
    switch (reason) {
      case 'mutual_followers':
        return <Users className="h-3 w-3" />
      case 'popular':
        return <TrendingUp className="h-3 w-3" />
      case 'similar_interests':
        return <Sparkles className="h-3 w-3" />
      default:
        return <UserPlus className="h-3 w-3" />
    }
  }

  const getSuggestionLabel = (reason: string) => {
    switch (reason) {
      case 'mutual_followers':
        return 'Mutual connections'
      case 'popular':
        return 'Popular'
      case 'similar_interests':
        return 'Similar interests'
      default:
        return 'New user'
    }
  }

  if (!user) {
    return null
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Suggested for you</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No suggestions available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.uid} className="flex items-center justify-between">
                <UserCard
                  user={suggestion}
                  variant="compact"
                  showFollowButton={false}
                  className="flex-1 mr-3"
                />
                <div className="flex items-center gap-2">
                  {suggestion.suggestion_reason && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {getSuggestionIcon(suggestion.suggestion_reason)}
                      <span className="ml-1">{getSuggestionLabel(suggestion.suggestion_reason)}</span>
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleFollow(suggestion.uid)}
                  >
                    Follow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Suggested for you
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="h-8 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No suggestions available</p>
            <p className="text-sm mt-2">Check back later for new recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.uid} className="relative">
                <UserCard
                  user={suggestion}
                  variant="suggestion"
                  showFollowButton={true}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
                
                {suggestion.suggestion_reason && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {getSuggestionIcon(suggestion.suggestion_reason)}
                      <span className="ml-1">{getSuggestionLabel(suggestion.suggestion_reason)}</span>
                    </Badge>
                  </div>
                )}

                {suggestion.mutual_followers_count > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    {suggestion.mutual_followers_count} mutual follower{suggestion.mutual_followers_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}