'use client'

import { useState } from 'react'
import { Grid3X3, Image as ImageIcon, Users, UserCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/lib/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Post = Database['public']['Tables']['posts']['Row']

interface ProfileTabsProps {
  user: User
  posts?: Post[]
  followers?: User[]
  following?: User[]
  isOwnProfile?: boolean
  isLoading?: boolean
  onLoadMorePosts?: () => void
  onLoadMoreFollowers?: () => void
  onLoadMoreFollowing?: () => void
}

export function ProfileTabs({
  user,
  posts = [],
  followers = [],
  following = [],
  isOwnProfile = false,
  isLoading = false,
  onLoadMorePosts,
  onLoadMoreFollowers,
  onLoadMoreFollowing
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('posts')

  const mediaPosts = posts.filter(post => 
    post.post_type === 'image' || 
    post.post_type === 'video' || 
    post.post_type === 'mixed'
  )

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {post.content && (
            <p className="text-sm line-clamp-3">{post.content}</p>
          )}
          
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.slice(0, 4).map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {post.media_urls && post.media_urls.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{post.media_urls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{formatCount(post.likes_count)} likes</span>
              <span>{formatCount(post.comments_count)} comments</span>
              {post.shares_count > 0 && (
                <span>{formatCount(post.shares_count)} shares</span>
              )}
            </div>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const MediaGrid = ({ posts }: { posts: Post[] }) => (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {posts.map((post) => (
        post.media_urls?.map((url, index) => (
          <div
            key={`${post.id}-${index}`}
            className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={url}
              alt={`Media from post ${post.id}`}
              className="w-full h-full object-cover"
            />
            {post.post_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-2">
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                </div>
              </div>
            )}
          </div>
        ))
      ))}
    </div>
  )

  const UserCard = ({ user: userItem, showFollowButton = false }: { user: User; showFollowButton?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {userItem.avatar ? (
                <img
                  src={userItem.avatar}
                  alt={userItem.display_name || userItem.username || ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {(userItem.display_name || userItem.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {userItem.display_name || userItem.username}
                </h3>
                {userItem.verify && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    ✓
                  </Badge>
                )}
              </div>
              {userItem.username && userItem.display_name && (
                <p className="text-xs text-muted-foreground truncate">
                  @{userItem.username}
                </p>
              )}
              {userItem.biography && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {userItem.biography}
                </p>
              )}
            </div>
          </div>
          
          {showFollowButton && !isOwnProfile && (
            <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors">
              Follow
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="posts" className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden sm:inline">Posts</span>
          <Badge variant="secondary" className="ml-1">
            {formatCount(user.posts_count)}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger value="media" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Media</span>
          <Badge variant="secondary" className="ml-1">
            {formatCount(mediaPosts.length)}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger value="followers" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Followers</span>
          <Badge variant="secondary" className="ml-1">
            {formatCount(user.followers_count)}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger value="following" className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Following</span>
          <Badge variant="secondary" className="ml-1">
            {formatCount(user.following_count)}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-32 bg-muted rounded animate-pulse" />
                      <div className="flex gap-4">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {onLoadMorePosts && (
                <div className="text-center">
                  <button
                    onClick={onLoadMorePosts}
                    className="text-sm text-primary hover:underline"
                  >
                    Load more posts
                  </button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No posts yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile 
                    ? "Share your first post to get started!" 
                    : "This user hasn't posted anything yet."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="media" className="mt-6">
        {mediaPosts.length > 0 ? (
          <MediaGrid posts={mediaPosts} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No media yet</h3>
              <p className="text-sm text-muted-foreground">
                {isOwnProfile 
                  ? "Share photos and videos to see them here!" 
                  : "This user hasn't shared any media yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="followers" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : followers.length > 0 ? (
            <>
              {followers.map((follower) => (
                <UserCard key={follower.id} user={follower} showFollowButton />
              ))}
              {onLoadMoreFollowers && (
                <div className="text-center">
                  <button
                    onClick={onLoadMoreFollowers}
                    className="text-sm text-primary hover:underline"
                  >
                    Load more followers
                  </button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No followers yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile 
                    ? "When people follow you, they'll appear here." 
                    : "This user doesn't have any followers yet."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="following" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : following.length > 0 ? (
            <>
              {following.map((followedUser) => (
                <UserCard key={followedUser.id} user={followedUser} />
              ))}
              {onLoadMoreFollowing && (
                <div className="text-center">
                  <button
                    onClick={onLoadMoreFollowing}
                    className="text-sm text-primary hover:underline"
                  >
                    Load more following
                  </button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Not following anyone yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile 
                    ? "Find people to follow and they'll appear here." 
                    : "This user isn't following anyone yet."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}