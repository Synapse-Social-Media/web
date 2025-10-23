'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Camera, Calendar, MoreHorizontal, UserPlus, UserMinus, MessageCircle, Share } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Database } from '@/lib/types/database.types'
import { useFollow } from '@/lib/hooks/use-follow'
import { useAuth } from '@/lib/contexts/auth-context'

type User = Database['public']['Tables']['users']['Row']

interface ProfileHeaderProps {
  user: User
  isOwnProfile?: boolean
  onMessage?: () => void
  onEdit?: () => void
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  onMessage,
  onEdit
}: ProfileHeaderProps) {
  const { user: currentUser } = useAuth()
  const [imageError, setImageError] = useState(false)
  
  const {
    stats,
    isLoading: followLoading,
    toggleFollow,
    refreshStats
  } = useFollow({
    userId: user.uid,
    initialStats: {
      followers_count: user.followers_count,
      following_count: user.following_count,
      is_following: false,
      is_followed_by: false
    }
  })

  // Refresh follow stats when component mounts
  useEffect(() => {
    if (!isOwnProfile && currentUser) {
      refreshStats()
    }
  }, [isOwnProfile, currentUser, refreshStats])

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

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden">
          {user.profile_cover_image && !imageError ? (
            <Image
              src={user.profile_cover_image}
              alt="Cover"
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
          )}
          
          {/* Cover Image Actions */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <Camera className="h-4 w-4 mr-2" />
                Edit Cover
              </Button>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-4 md:px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-20">
            <div className="relative">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background">
                <AvatarImage src={user.avatar || undefined} alt={user.display_name || user.username || ''} />
                <AvatarFallback className="text-2xl md:text-3xl font-semibold">
                  {getInitials(user.display_name || user.username || 'U')}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full p-0 bg-background border-2 border-background"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {isOwnProfile ? (
                <Button variant="outline" onClick={onEdit}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={stats.is_following ? "outline" : "default"}
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className="min-w-[100px]"
                  >
                    {followLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    ) : stats.is_following ? (
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
                  
                  <Button variant="outline" onClick={onMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" />
                    Share Profile
                  </DropdownMenuItem>
                  {!isOwnProfile && (
                    <>
                      <DropdownMenuItem className="text-red-600">
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Report User
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">
                {user.display_name || user.username}
              </h1>
              {user.verify && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  ✓ Verified
                </Badge>
              )}
              {user.account_premium && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  ⭐ Premium
                </Badge>
              )}
            </div>

            {user.username && user.display_name && (
              <p className="text-muted-foreground">@{user.username}</p>
            )}

            {user.biography && (
              <p className="text-sm md:text-base leading-relaxed max-w-2xl">
                {user.biography}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{formatCount(stats.following_count)}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{formatCount(stats.followers_count)}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{formatCount(user.posts_count)}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}