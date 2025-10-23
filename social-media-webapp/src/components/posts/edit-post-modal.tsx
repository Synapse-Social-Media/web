'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Globe, 
  Users, 
  Lock,
  Loader2,
  Save
} from 'lucide-react'
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

interface EditPostModalProps {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostUpdated?: (updatedPost: Post) => void
}

export function EditPostModal({ 
  post, 
  open, 
  onOpenChange, 
  onPostUpdated 
}: EditPostModalProps) {
  const { user, userProfile } = useAuth()
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setContent(post.content || '')
      setVisibility(post.visibility)
    }
  }, [post])

  const detectHashtagsAndMentions = (text: string) => {
    const hashtags = text.match(/#[\w]+/g) || []
    const mentions = text.match(/@[\w]+/g) || []
    return { hashtags, mentions }
  }

  const handleSubmit = async () => {
    if (!user || !post) {
      toast.error('You must be logged in to edit posts')
      return
    }

    if (!content.trim() && (!post.media_urls || post.media_urls.length === 0)) {
      toast.error('Please add some content to your post')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          content: content.trim() || null,
          visibility,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select(`
          *,
          user:users(id, username, display_name, avatar, verify)
        `)
        .single()

      if (error) throw error

      toast.success('Post updated successfully!')
      onPostUpdated?.(data)
      onOpenChange(false)

    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Failed to update post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { hashtags, mentions } = detectHashtagsAndMentions(content)

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see this post' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see this post' }
  ] as const

  const selectedVisibility = visibilityOptions.find(option => option.value === visibility)

  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar || undefined} />
              <AvatarFallback>
                {userProfile?.display_name?.[0] || userProfile?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none border-none p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
                maxLength={500}
              />

              {/* Hashtags and Mentions Preview */}
              {(hashtags.length > 0 || mentions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((hashtag, index) => (
                    <Badge key={`hashtag-${index}`} variant="secondary" className="text-blue-600">
                      {hashtag}
                    </Badge>
                  ))}
                  {mentions.map((mention, index) => (
                    <Badge key={`mention-${index}`} variant="secondary" className="text-green-600">
                      {mention}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Media Preview (read-only) */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Media attachments (cannot be edited)
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {post.media_urls.map((url, index) => (
                      <div key={index} className="relative">
                        {post.media_types?.[index] === 'image' ? (
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg opacity-75"
                          />
                        ) : (
                          <video
                            src={url}
                            className="w-full h-32 object-cover rounded-lg opacity-75"
                            controls={false}
                            muted
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visibility Settings */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Visibility:</span>
                  <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                    <SelectTrigger className="w-auto border-none shadow-none">
                      <div className="flex items-center gap-2">
                        {selectedVisibility && <selectedVisibility.icon className="h-4 w-4" />}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {visibilityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {content.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && (!post.media_urls || post.media_urls.length === 0))}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}