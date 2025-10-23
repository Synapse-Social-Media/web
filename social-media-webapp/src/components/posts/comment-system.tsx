'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Reply, 
  MoreHorizontal,
  Send,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  media_url: string | null
  created_at: string
  updated_at: string
  likes_count: number
  replies_count: number
  is_deleted: boolean
  is_edited: boolean
  user?: User
  replies?: Comment[]
}

interface CommentSystemProps {
  postId: string
  className?: string
}

export function CommentSystem({ postId, className = "" }: CommentSystemProps) {
  const { user, userProfile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar, verify)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Organize comments into parent-child structure
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // First pass: create all comments
      data.forEach(comment => {
        const commentWithReplies = { ...comment, replies: [] }
        commentMap.set(comment.id, commentWithReplies)
        
        if (!comment.parent_comment_id) {
          rootComments.push(commentWithReplies)
        }
      })

      // Second pass: organize replies
      data.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id)
          if (parent) {
            parent.replies!.push(commentMap.get(comment.id)!)
          }
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [postId])

  // Real-time subscriptions for comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          loadComments() // Reload comments when new ones are added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          loadComments() // Reload comments when they're updated
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userProfile?.uid || '',
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userProfile?.uid || '',
          parent_comment_id: parentId,
          content: replyContent.trim()
        })

      if (error) throw error

      setReplyContent('')
      setReplyingTo(null)
      toast.success('Reply added successfully!')
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userProfile?.uid || '')
        .eq('target_id', commentId)
        .eq('target_type', 'comment')
        .single()

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userProfile?.uid || '')
          .eq('target_id', commentId)
          .eq('target_type', 'comment')

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: userProfile?.uid || '',
            target_id: commentId,
            target_type: 'comment'
          })

        if (error) throw error
      }

      // Reload comments to update like counts
      loadComments()
    } catch (error) {
      console.error('Error toggling comment like:', error)
      toast.error('Failed to update like')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)

      if (error) throw error

      loadComments()
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
    const isOwnComment = userProfile?.uid === comment.user_id

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar || undefined} />
            <AvatarFallback>
              {comment.user?.display_name?.[0] || comment.user?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {comment.user?.display_name || comment.user?.username || 'Unknown User'}
                </span>
                {comment.user?.verify && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    ✓
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                {comment.is_edited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeComment(comment.id)}
                className="h-6 px-2 text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                {comment.likes_count > 0 && comment.likes_count}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="h-6 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {isOwnComment && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive">
                      Delete comment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={userProfile?.avatar ?? undefined} />
                  <AvatarFallback>
                    {userProfile?.display_name?.[0] || userProfile?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    maxLength={500}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || submitting}
                    >
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 mb-4">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold">
        Comments ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
      </h3>

      {/* New comment form */}
      {userProfile && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile.avatar || undefined} />
            <AvatarFallback>
              {userProfile.display_name?.[0] || userProfile.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              size="sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}