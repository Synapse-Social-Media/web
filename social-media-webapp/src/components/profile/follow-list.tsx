'use client'

import { useState } from 'react'
import { Search, Users, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserCard } from './user-card'
import { useFollowList } from '@/lib/hooks/use-follow-list'
import { useAuth } from '@/lib/contexts/auth-context'
import { followService } from '@/lib/services/follow-service'
import { toast } from 'sonner'

interface FollowListProps {
  userId: string
  initialTab?: 'followers' | 'following'
  className?: string
}

export function FollowList({ userId, initialTab = 'followers', className = '' }: FollowListProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
  const [search, setSearch] = useState('')

  const {
    users: followers,
    loading: followersLoading,
    hasMore: followersHasMore,
    totalCount: followersCount,
    loadMore: loadMoreFollowers,
    refresh: refreshFollowers
  } = useFollowList({
    userId,
    type: 'followers',
    search,
    enabled: activeTab === 'followers'
  })

  const {
    users: following,
    loading: followingLoading,
    hasMore: followingHasMore,
    totalCount: followingCount,
    loadMore: loadMoreFollowing,
    refresh: refreshFollowing
  } = useFollowList({
    userId,
    type: 'following',
    search,
    enabled: activeTab === 'following'
  })

  const handleFollow = async (targetUserId: string) => {
    try {
      const { error } = await followService.followUser(targetUserId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User followed successfully')
        // Refresh the current list to update follow states
        if (activeTab === 'followers') {
          refreshFollowers()
        } else {
          refreshFollowing()
        }
      }
    } catch (error) {
      toast.error('Failed to follow user')
    }
  }

  const handleUnfollow = async (targetUserId: string) => {
    try {
      const { error } = await followService.unfollowUser(targetUserId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User unfollowed successfully')
        // Refresh the current list to update follow states
        if (activeTab === 'followers') {
          refreshFollowers()
        } else {
          refreshFollowing()
        }
      }
    } catch (error) {
      toast.error('Failed to unfollow user')
    }
  }

  const currentUsers = activeTab === 'followers' ? followers : following
  const currentLoading = activeTab === 'followers' ? followersLoading : followingLoading
  const currentHasMore = activeTab === 'followers' ? followersHasMore : followingHasMore
  const loadMore = activeTab === 'followers' ? loadMoreFollowers : loadMoreFollowing

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followers' | 'following')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Followers ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-3 mt-4">
            {currentLoading && currentUsers.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No followers found</p>
                {search && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {currentUsers.map((relationship) => {
                  const relationshipUser = relationship.user
                  if (!relationshipUser) return null

                  return (
                    <UserCard
                      key={relationship.id}
                      user={relationshipUser}
                      variant="compact"
                      showFollowButton={user?.id !== relationshipUser.uid}
                      isCurrentUser={user?.id === relationshipUser.uid}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                    />
                  )
                })}

                {currentHasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={currentLoading}
                    >
                      {currentLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3 mt-4">
            {currentLoading && currentUsers.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not following anyone yet</p>
                {search && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {currentUsers.map((relationship) => {
                  const relationshipUser = relationship.user
                  if (!relationshipUser) return null

                  return (
                    <UserCard
                      key={relationship.id}
                      user={relationshipUser}
                      variant="compact"
                      showFollowButton={user?.id !== relationshipUser.uid}
                      isCurrentUser={user?.id === relationshipUser.uid}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                    />
                  )
                })}

                {currentHasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={currentLoading}
                    >
                      {currentLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}