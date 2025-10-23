'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/story'

interface StoryRingProps {
  user: User
  hasStories: boolean
  hasUnviewed: boolean
  onClick: () => void
  className?: string
}

export function StoryRing({ 
  user, 
  hasStories, 
  hasUnviewed, 
  onClick, 
  className 
}: StoryRingProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-1 cursor-pointer touch-target",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        {/* Story ring indicator */}
        {hasStories && (
          <div 
            className={cn(
              "absolute inset-0 rounded-full p-0.5",
              hasUnviewed 
                ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500" 
                : "bg-gray-300"
            )}
          >
            <div className="w-full h-full rounded-full bg-background p-0.5">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {user.display_name?.[0] || user.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        )}
        
        {/* Regular avatar when no stories */}
        {!hasStories && (
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {user.display_name?.[0] || user.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <span className="text-xs text-center max-w-16 truncate">
        {user.display_name || user.username || 'Unknown'}
      </span>
    </div>
  )
}