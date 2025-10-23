'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Globe,
  Users,
  Lock
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface User {
  id: string
  username: string | null
  display_name: string | null
  avatar: string | null
  verify: boolean
}

interface Post {
  id: string
  user_id: string
  content: string | null
  media_urls: string[] | null
  media_types: string[] | null
  post_type: 'text' | 'image' | 'video' | 'mixed'
  visibility: 'public' | 'followers' | 'private'
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  user?: User
}

interface PostCardProps {
  post: Post
  onLike?: (postId: string, liked: boolean) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string, postUserId: string) => void
  className?: string
}

export function PostCard({ 
  post, 
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReport,
  className = ""
}: PostCardProps) {
  const { user: currentUser } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isLiking, setIsLiking] = useState(false)
  const supabase = createClient()

  const isOwnPost = currentUser?.id === post.user_id

  const handleLike = async () => {
    if (!currentUser || isLiking) return

    setIsLiking(true)
    const newLikedState = !isLiked
    
    // Optimistic update
    setIsLiked(newLikedState)
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)

    try {
      if (newLikedState) {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ 
            user_id: currentUser.id, 
            target_id: post.id, 
            target_type: 'post' 
          })
        
        if (error) throw error
      } else {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('target_id', post.id)
          .eq('target_type', 'post')
        
        if (error) throw error
      }

      onLike?.(post.id, newLikedState)
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!newLikedState)
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
      console.error('Error toggling like:', error)
      toast.error('Failed to update like. Please try again.')
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = () => {
    onComment?.(post.id)
  }

  const handleShare = () => {
    onShare?.(post.id)
  }

  const handleEdit = () => {
    onEdit?.(post.id)
  }

  const handleDelete = () => {
    onDelete?.(post.id)
  }

  const handleReport = () => {
    onReport?.(post.id, post.user_id)
  }

  const renderHashtagsAndMentions = (text: string) => {
    const parts = text.split(/(\s+)/)
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-blue-600 hover:underline cursor-pointer">
            {part}
          </span>
        )
      } else if (part.startsWith('@')) {
        return (
          <span key={index} className="text-green-600 hover:underline cursor-pointer">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />
      case 'followers':
        return <Users className="h-3 w-3" />
      case 'private':
        return <Lock className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user?.avatar || undefined} />
              <AvatarFallback>
                {post.user?.display_name?.[0] || post.user?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {post.user?.display_name || post.user?.username || 'Unknown User'}
                </span>
                {post.user?.verify && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.user?.username || 'unknown'}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon()}
                  <span className="capitalize">{post.visibility}</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleReport}>
                    Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {post.content && (
          <div className="mb-3 text-sm leading-relaxed">
            {renderHashtagsAndMentions(post.content)}
          </div>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-3">
            {post.media_urls.length === 1 ? (
              <div className="rounded-lg overflow-hidden">
                {post.media_types?.[0] === 'image' ? (
                  <img
                    src={post.media_urls[0]}
                    alt="Post media"
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <video
                    src={post.media_urls[0]}
                    controls
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    {post.media_types?.[index] === 'image' ? (
                      <img
                        src={url}
                        alt={`Post media ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={url}
                        className="w-full h-32 object-cover"
                        controls={false}
                        muted
                      />
                    )}
                    {index === 3 && post.media_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.media_urls.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleComment} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
              <Share className="h-4 w-4" />
              <span>{post.shares_count}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}