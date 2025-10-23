'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, UserMinus, MessageCircle, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Database } from '@/lib/types/database.types'

type User = Database['public']['Tables']['users']['Row']

interface UserCardProps {
  user: User
  variant?: 'default' | 'compact' | 'suggestion'
  showFollowButton?: boolean
  showMessageButton?: boolean
  isFollowing?: boolean
  isCurrentUser?: boolean
  onFollow?: (userId: string) => void
  onUnfollow?: (userId: string) => void
  onMessage?: (userId: string) => void
  className?: string
}

export function UserCard({
  user,
  variant = 'default',
  showFollowButton = true,
  showMessageButton = false,
  isFollowing = false,
  isCurrentUser = false,
  onFollow,
  onUnfollow,
  onMessage,
  className = ''
}: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFollowClick = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      if (isFollowing) {
        await onUnfollow?.(user.uid)
      } else {
        await onFollow?.(user.uid)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageClick = () => {
    onMessage?.(user.uid)
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = user.display_name || user.username || 'Unknown User'
  const username = user.username

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors ${className}`}>
        <Link href={`/profile/${username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} alt={displayName} />
            <AvatarFallback className="text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              {user.verify && (
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                  ✓
                </Badge>
              )}
            </div>
            {username && user.display_name && (
              <p className="text-xs text-muted-foreground truncate">@{username}</p>
            )}
          </div>
        </Link>

        {!isCurrentUser && showFollowButton && (
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollowClick}
            disabled={isLoading}
            className="ml-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isFollowing ? (
              <>
                <UserMinus className="h-3 w-3 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'suggestion') {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <Link href={`/profile/${username}`}>
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarImage src={user.avatar || undefined} alt={displayName} />
                <AvatarFallback className="text-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="space-y-1">
              <Link href={`/profile/${username}`}>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{displayName}</h3>
                  {user.verify && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                      ✓
                    </Badge>
                  )}
                </div>
              </Link>
              
              {username && user.display_name && (
                <p className="text-xs text-muted-foreground">@{username}</p>
              )}
              
              {user.biography && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {user.biography}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
                <span>{formatCount(user.followers_count)} followers</span>
                <span>{formatCount(user.posts_count)} posts</span>
              </div>
            </div>

            {!isCurrentUser && showFollowButton && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollowClick}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link href={`/profile/${username}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || undefined} alt={displayName} />
                <AvatarFallback>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0 space-y-1">
              <Link href={`/profile/${username}`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{displayName}</h3>
                  {user.verify && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                      ✓
                    </Badge>
                  )}
                  {user.account_premium && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 bg-yellow-100 text-yellow-800">
                      ⭐
                    </Badge>
                  )}
                </div>
              </Link>
              
              {username && user.display_name && (
                <p className="text-sm text-muted-foreground truncate">@{username}</p>
              )}
              
              {user.biography && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {user.biography}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>{formatCount(user.followers_count)} followers</span>
                <span>{formatCount(user.following_count)} following</span>
                <span>{formatCount(user.posts_count)} posts</span>
              </div>
            </div>
          </div>

          {!isCurrentUser && (
            <div className="flex items-center gap-2 ml-3">
              {showFollowButton && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowClick}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}

              {showMessageButton && (
                <Button variant="outline" size="sm" onClick={handleMessageClick}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Report User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}