'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UserCard } from '@/components/profile/user-card'
import { PostCard } from '@/components/posts/post-card'
import { Hash, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  SearchResults as SearchResultsType, 
  UserSearchResult, 
  PostSearchResult, 
  HashtagSearchResult 
} from '@/lib/types/search'

interface SearchResultsProps {
  results: SearchResultsType[]
  isLoading?: boolean
  query: string
  onLoadMore?: () => void
  hasMore?: boolean
  className?: string
}

export function SearchResults({
  results,
  isLoading = false,
  query,
  onLoadMore,
  hasMore = false,
  className
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState('all')

  // Filter results by type
  const userResults = results.filter((r): r is UserSearchResult => r.type === 'user')
  const postResults = results.filter((r): r is PostSearchResult => r.type === 'post')
  const hashtagResults = results.filter((r): r is HashtagSearchResult => r.type === 'hashtag')

  const getTabCount = (type: string) => {
    switch (type) {
      case 'users':
        return userResults.length
      case 'posts':
        return postResults.length
      case 'hashtags':
        return hashtagResults.length
      default:
        return results.length
    }
  }

  const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  )

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-2">
        No {type} found for "{query}"
      </div>
      <div className="text-sm text-muted-foreground">
        Try adjusting your search terms or filters
      </div>
    </div>
  )

  const HashtagItem = ({ result }: { result: HashtagSearchResult }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Hash className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-medium">#{result.hashtag.tag}</div>
          <div className="text-sm text-muted-foreground">
            {result.hashtag.post_count.toLocaleString()} posts
          </div>
        </div>
      </div>
      {result.hashtag.trending_score && result.hashtag.trending_score > 0.7 && (
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Trending
        </Badge>
      )}
    </div>
  )

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-sm">
            All
            {results.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {results.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm">
            Users
            {userResults.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {userResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts" className="text-sm">
            Posts
            {postResults.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {postResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="text-sm">
            Tags
            {hashtagResults.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {hashtagResults.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <LoadingSkeleton count={6} />
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {/* Show top users first */}
              {userResults.slice(0, 3).map((result) => (
                <UserCard
                  key={result.id}
                  user={result.user}
                  showFollowButton
                  className="border rounded-lg p-4"
                />
              ))}
              
              {/* Show hashtags */}
              {hashtagResults.slice(0, 2).map((result) => (
                <HashtagItem key={result.id} result={result} />
              ))}
              
              {/* Show recent posts */}
              {postResults.slice(0, 3).map((result) => (
                <PostCard
                  key={result.id}
                  post={{
                    id: result.post.id,
                    content: result.post.content,
                    user_id: result.post.user_id,
                    created_at: result.post.created_at,
                    likes_count: result.post.likes_count,
                    comments_count: result.post.comments_count,
                    media_urls: null,
                    media_types: null,
                    post_type: 'text',
                    visibility: 'public',
                    shares_count: 0,
                    updated_at: result.post.created_at,
                    user: result.post.user
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="results" />
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : userResults.length > 0 ? (
            <div className="space-y-4">
              {userResults.map((result) => (
                <UserCard
                  key={result.id}
                  user={result.user}
                  showFollowButton
                  className="border rounded-lg p-4"
                />
              ))}
            </div>
          ) : (
            <EmptyState type="users" />
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : postResults.length > 0 ? (
            <div className="space-y-4">
              {postResults.map((result) => (
                <PostCard
                  key={result.id}
                  post={{
                    id: result.post.id,
                    content: result.post.content,
                    user_id: result.post.user_id,
                    created_at: result.post.created_at,
                    likes_count: result.post.likes_count,
                    comments_count: result.post.comments_count,
                    media_urls: null,
                    media_types: null,
                    post_type: 'text',
                    visibility: 'public',
                    shares_count: 0,
                    updated_at: result.post.created_at,
                    user: result.post.user
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="posts" />
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : hashtagResults.length > 0 ? (
            <div className="space-y-4">
              {hashtagResults.map((result) => (
                <HashtagItem key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <EmptyState type="hashtags" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}