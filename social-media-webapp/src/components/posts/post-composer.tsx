'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
  ImageIcon, 
  VideoIcon, 
  X, 
  Globe, 
  Users, 
  Lock,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MediaFile {
  file: File
  url: string
  type: 'image' | 'video'
}

interface PostComposerProps {
  onPostCreated?: () => void
  placeholder?: string
  className?: string
}

export function PostComposer({ 
  onPostCreated, 
  placeholder = "What's on your mind?",
  className = ""
}: PostComposerProps) {
  const { user, userProfile } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }

      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        toast.error(`File ${file.name} is not supported. Please select images or videos.`)
        return
      }

      const url = URL.createObjectURL(file)
      const mediaFile: MediaFile = {
        file,
        url,
        type: isImage ? 'image' : 'video'
      }

      setMediaFiles(prev => [...prev, mediaFile])
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const removeMediaFile = useCallback((index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index]) {
        URL.revokeObjectURL(newFiles[index].url)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const detectHashtagsAndMentions = useCallback((text: string) => {
    const hashtags = text.match(/#[\w]+/g) || []
    const mentions = text.match(/@[\w]+/g) || []
    return { hashtags, mentions }
  }, [])

  const uploadMediaFiles = async (): Promise<{ urls: string[], types: string[] }> => {
    if (mediaFiles.length === 0) return { urls: [], types: [] }

    const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
      const fileExt = mediaFile.file.name.split('.').pop()
      const fileName = `${user?.id}/${Date.now()}-${index}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, mediaFile.file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(data.path)

      return {
        url: publicUrl,
        type: mediaFile.type
      }
    })

    const results = await Promise.all(uploadPromises)
    return {
      urls: results.map(r => r.url),
      types: results.map(r => r.type)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a post')
      return
    }

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Please add some content or media to your post')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload media files
      const { urls: mediaUrls, types: mediaTypes } = await uploadMediaFiles()

      // Determine post type
      let postType: 'text' | 'image' | 'video' | 'mixed' = 'text'
      if (mediaFiles.length > 0) {
        const hasImages = mediaTypes.includes('image')
        const hasVideos = mediaTypes.includes('video')
        
        if (hasImages && hasVideos) {
          postType = 'mixed'
        } else if (hasImages) {
          postType = 'image'
        } else if (hasVideos) {
          postType = 'video'
        }
      }

      // Create post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile?.uid || '',
          content: content.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_types: mediaTypes.length > 0 ? mediaTypes : null,
          post_type: postType,
          visibility
        })

      if (error) throw error

      // Reset form
      setContent('')
      setMediaFiles([])
      setVisibility('public')
      
      // Clean up object URLs
      mediaFiles.forEach(file => URL.revokeObjectURL(file.url))

      toast.success('Post created successfully!')
      onPostCreated?.()

    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post. Please try again.')
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

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile?.avatar || undefined} />
            <AvatarFallback>
              {userProfile?.display_name?.[0] || userProfile?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-none p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
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

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mediaFiles.map((mediaFile, index) => (
                  <div key={index} className="relative group">
                    {mediaFile.type === 'image' ? (
                      <img
                        src={mediaFile.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaFile.url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls={false}
                        muted
                      />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMediaFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Video
                </Button>

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
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
                  size="sm"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}