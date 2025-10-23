'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PostCard } from './post-card'
import { CommentSystem } from './comment-system'
import { Separator } from '@/components/ui/separator'

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

interface PostModalProps {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLike?: (postId: string, liked: boolean) => void
  onShare?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
}

export function PostModal({
  post,
  open,
  onOpenChange,
  onLike,
  onShare,
  onEdit,
  onDelete
}: PostModalProps) {
  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <PostCard
              post={post}
              onLike={onLike}
              onShare={onShare}
              onEdit={onEdit}
              onDelete={onDelete}
              className="border-none shadow-none"
            />
            
            <Separator className="my-6" />
            
            <CommentSystem postId={post.id} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}