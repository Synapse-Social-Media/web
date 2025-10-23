'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, Search, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { NotificationItem } from './notification-item'
import { Notification, NotificationType } from '@/lib/types/notification'
import { useNotifications } from '@/lib/contexts/notification-context'
import { notificationService } from '@/lib/services/notification-service'
import { useAuth } from '@/lib/contexts/auth-context'
import { toast } from 'sonner'

interface NotificationHistoryProps {
  className?: string
}

export function NotificationHistory({ className }: NotificationHistoryProps) {
  const { userProfile } = useAuth()
  const { markAsRead, deleteNotification } = useNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (userProfile) {
      loadNotifications(true)
    }
  }, [userProfile])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, typeFilter, statusFilter])

  const loadNotifications = async (reset = false) => {
    if (!userProfile) return
    
    setIsLoading(true)
    try {
      const currentPage = reset ? 0 : page
      const data = await notificationService.getNotifications(userProfile.uid, currentPage, 50)
      
      if (reset) {
        setNotifications(data)
        setPage(0)
      } else {
        setNotifications(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === 50)
      if (!reset) {
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to load notification history:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = notifications

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notification => 
        statusFilter === 'read' ? notification.read : !notification.read
      )
    }

    setFilteredNotifications(filtered)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    if (!userProfile) return
    
    try {
      // Delete all notifications for the user
      const promises = notifications.map(n => notificationService.deleteNotification(n.id))
      await Promise.all(promises)
      
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Notification History
        </CardTitle>
        <CardDescription>
          View and manage your notification history
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="like">Likes</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="follow">Follows</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="mention">Mentions</SelectItem>
              <SelectItem value="story_view">Story Views</SelectItem>
              <SelectItem value="post_share">Shares</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'read' | 'unread')}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </p>
          
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification List */}
        <ScrollArea className="h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No notifications match your filters'
                  : 'No notifications yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => loadNotifications(false)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}