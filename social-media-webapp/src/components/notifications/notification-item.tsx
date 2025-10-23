'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Mail, 
  AtSign, 
  Eye, 
  Share, 
  Info,
  Gift,
  Sparkles,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Notification, NotificationType } from '@/lib/types/notification'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
  mention: AtSign,
  story_view: Eye,
  post_share: Share,
  system: Info,
  welcome: Gift,
  feature: Sparkles,
}

const notificationColors: Record<NotificationType, string> = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  follow: 'text-green-500',
  message: 'text-purple-500',
  mention: 'text-orange-500',
  story_view: 'text-cyan-500',
  post_share: 'text-indigo-500',
  system: 'text-gray-500',
  welcome: 'text-pink-500',
  feature: 'text-yellow-500',
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type]
  const iconColor = notificationColors[notification.type]
  
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    
    // Navigate to action URL if provided
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true 
  })

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2",
        notification.read 
          ? "border-l-transparent" 
          : "border-l-primary bg-muted/20"
      )}
      onClick={handleClick}
    >
      {/* Avatar or Icon */}
      <div className="flex-shrink-0">
        {notification.sender ? (
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.sender.avatar} />
              <AvatarFallback className="text-xs">
                {notification.sender.display_name?.charAt(0) || 
                 notification.sender.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border flex items-center justify-center",
              iconColor
            )}>
              <Icon className="h-2.5 w-2.5" />
            </div>
          </div>
        ) : (
          <div className={cn(
            "h-8 w-8 rounded-full bg-muted flex items-center justify-center",
            iconColor
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className={cn(
                "text-sm font-medium truncate",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </p>
            )}
            <p className={cn(
              "text-sm text-muted-foreground line-clamp-2",
              !notification.read && "text-foreground"
            )}>
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {timeAgo}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!notification.read && (
              <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {!notification.read && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsRead(notification.id)
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(notification.id)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Priority indicator */}
        {(notification.priority === 'high' || notification.priority === 'urgent') && (
          <div className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-1",
            notification.priority === 'urgent' 
              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
          )}>
            {notification.priority === 'urgent' ? 'Urgent' : 'High Priority'}
          </div>
        )}
      </div>
    </div>
  )
}