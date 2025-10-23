'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { StoryRing } from './story-ring'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import type { UserStories } from '@/lib/types/story'

interface StoriesBarProps {
  onCreateStory: () => void
  onViewStory: (userStories: UserStories, startIndex?: number) => void
  className?: string
}

export function StoriesBar({ onCreateStory, onViewStory, className }: StoriesBarProps) {
  const { userProfile } = useAuth()
  const [userStoriesData, setUserStoriesData] = useState<UserStories[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      
      // Get stories from followed users and current user
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:users(id, username, display_name, avatar, verify)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group stories by user
      const groupedStories = stories?.reduce((acc, story) => {
        const userId = story.user_id
        if (!acc[userId]) {
          acc[userId] = {
            user: story.user,
            stories: [],
            hasUnviewed: false
          }
        }
        acc[userId].stories.push(story)
        return acc
      }, {} as Record<string, UserStories>) || {}

      // Check for unviewed stories
      if (userProfile) {
        for (const userStories of Object.values(groupedStories)) {
          const { data: viewedStories } = await supabase
            .from('story_views')
            .select('story_id')
            .eq('viewer_id', userProfile.id)
            .in('story_id', userStories.stories.map(s => s.id))

          const viewedStoryIds = new Set(viewedStories?.map(v => v.story_id) || [])
          userStories.hasUnviewed = userStories.stories.some(s => !viewedStoryIds.has(s.id))
        }
      }

      setUserStoriesData(Object.values(groupedStories))
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStoryClick = (userStories: UserStories) => {
    onViewStory(userStories)
  }

  if (loading) {
    return (
      <div className={className}>
        <ScrollArea className="w-full">
          <div className="flex gap-4 p-4">
            {/* Loading skeletons */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className={className}>
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {/* Create story button */}
          {userProfile && (
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-dashed"
                onClick={onCreateStory}
              >
                <Plus className="h-6 w-6" />
              </Button>
              <span className="text-xs text-center max-w-16 truncate">
                Your Story
              </span>
            </div>
          )}

          {/* User stories */}
          {userStoriesData.map((userStories) => (
            <StoryRing
              key={userStories.user.id}
              user={userStories.user}
              hasStories={userStories.stories.length > 0}
              hasUnviewed={userStories.hasUnviewed}
              onClick={() => handleStoryClick(userStories)}
            />
          ))}

          {/* Empty state */}
          {userStoriesData.length === 0 && !loading && (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-muted-foreground text-sm">
                No stories available. Be the first to share one!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}