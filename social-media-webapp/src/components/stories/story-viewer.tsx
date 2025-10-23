'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play,
  MoreHorizontal,
  Heart,
  MessageCircle
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useStoryManagement } from '@/lib/hooks/use-story-management'
import type { UserStories, Story } from '@/lib/types/story'
import { cn } from '@/lib/utils'

interface StoryViewerProps {
  isOpen: boolean
  onClose: () => void
  userStoriesData: UserStories[]
  initialUserIndex?: number
  initialStoryIndex?: number
}

export function StoryViewer({ 
  isOpen, 
  onClose, 
  userStoriesData, 
  initialUserIndex = 0,
  initialStoryIndex = 0
}: StoryViewerProps) {
  const { userProfile } = useAuth()
  const { deleteStory, reportStory, isDeleting, isReporting } = useStoryManagement()
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  const currentUserStories = userStoriesData[currentUserIndex]
  const currentStory = currentUserStories?.stories[currentStoryIndex]
  const storyDuration = 5000 // 5 seconds per story

  // Mark story as viewed
  const markStoryAsViewed = useCallback(async (story: Story) => {
    if (!userProfile || !story) return

    try {
      // Check if already viewed
      const { data: existingView } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', story.id)
        .eq('viewer_id', userProfile.id)
        .single()

      if (!existingView) {
        await supabase
          .from('story_views')
          .insert({
            story_id: story.id,
            viewer_id: userProfile.id
          })

        // Update views count
        await supabase
          .from('stories')
          .update({ views_count: story.views_count + 1 })
          .eq('id', story.id)
      }
    } catch (error) {
      console.error('Error marking story as viewed:', error)
    }
  }, [userProfile, supabase])

  // Progress management
  const startProgress = useCallback(() => {
    if (isPaused) return

    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory()
          return 0
        }
        return prev + (100 / (storyDuration / 100))
      })
    }, 100)
  }, [isPaused, storyDuration])

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }, [])

  const resetProgress = useCallback(() => {
    stopProgress()
    setProgress(0)
  }, [stopProgress])

  // Navigation
  const goToNextStory = useCallback(() => {
    const currentUser = userStoriesData[currentUserIndex]
    if (!currentUser) return

    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
      resetProgress()
    } else if (currentUserIndex < userStoriesData.length - 1) {
      setCurrentUserIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
      resetProgress()
    } else {
      onClose()
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesData, onClose, resetProgress])

  const goToPreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
      resetProgress()
    } else if (currentUserIndex > 0) {
      const prevUser = userStoriesData[currentUserIndex - 1]
      setCurrentUserIndex(prev => prev - 1)
      setCurrentStoryIndex(prevUser.stories.length - 1)
      resetProgress()
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesData, resetProgress])

  const togglePause = () => {
    setIsPaused(prev => !prev)
  }

  const handleDeleteStory = async () => {
    if (!currentStory || !userProfile) return

    const success = await deleteStory(currentStory.id, userProfile.id)
    if (success) {
      // Move to next story or close if this was the last one
      goToNextStory()
    }
  }

  const handleReportStory = async () => {
    if (!currentStory || !userProfile) return

    const success = await reportStory(currentStory.id, userProfile.id, 'inappropriate_content')
    if (success) {
      // Continue viewing other stories
      goToNextStory()
    }
  }

  // Effects
  useEffect(() => {
    if (isOpen && currentStory) {
      markStoryAsViewed(currentStory)
      setIsLoading(true)
      
      // Simulate loading time for media
      const timer = setTimeout(() => {
        setIsLoading(false)
        startProgress()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isOpen, currentStory, markStoryAsViewed, startProgress])

  useEffect(() => {
    if (isPaused) {
      stopProgress()
    } else if (!isLoading) {
      startProgress()
    }
  }, [isPaused, isLoading, startProgress, stopProgress])

  useEffect(() => {
    return () => stopProgress()
  }, [stopProgress])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousStory()
          break
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          goToNextStory()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPreviousStory, goToNextStory, onClose])

  if (!currentUserStories || !currentStory) {
    return null
  }

  const timeAgo = formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })
  const isOwnStory = userProfile?.id === currentStory.user_id

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full h-full sm:h-[90vh] p-0 bg-black border-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {currentUserStories.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className={cn(
                    "h-full bg-white transition-all duration-100",
                    index < currentStoryIndex ? "w-full" : 
                    index === currentStoryIndex ? `w-[${progress}%]` : "w-0"
                  )}
                  style={index === currentStoryIndex ? { width: `${progress}%` } : undefined}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-2 right-2 z-20 flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUserStories.user.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {currentUserStories.user.display_name?.[0] || currentUserStories.user.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  {currentUserStories.user.display_name || currentUserStories.user.username}
                </span>
                {currentUserStories.user.verify && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    ✓
                  </Badge>
                )}
                <span className="text-white/70 text-xs">{timeAgo}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePause}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwnStory ? (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={handleDeleteStory}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete story'}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={handleReportStory}
                      disabled={isReporting}
                    >
                      {isReporting ? 'Reporting...' : 'Report story'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story content */}
          <div className="flex-1 relative">
            {/* Navigation areas */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-10"
              onClick={goToPreviousStory}
              disabled={currentUserIndex === 0 && currentStoryIndex === 0}
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-10"
              onClick={goToNextStory}
            />

            {/* Media content */}
            <div className="w-full h-full flex items-center justify-center">
              {currentStory.media_type === 'image' ? (
                <img
                  src={currentStory.media_url}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setIsLoading(false)}
                />
              ) : (
                <video
                  src={currentStory.media_url}
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  muted
                  onLoadedData={() => setIsLoading(false)}
                />
              )}

              {/* Text overlay */}
              {currentStory.text_overlay && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center text-lg font-medium drop-shadow-lg">
                    {currentStory.text_overlay}
                  </p>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          {currentUserIndex > 0 || currentStoryIndex > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={goToPreviousStory}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}

          {currentUserIndex < userStoriesData.length - 1 || 
           currentStoryIndex < currentUserStories.stories.length - 1 ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={goToNextStory}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}

          {/* Bottom actions */}
          <div className="absolute bottom-4 left-2 right-2 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-white/70 text-xs">
              {currentStoryIndex + 1} / {currentUserStories.stories.length}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}