'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PostCard } from './post-card'
import { PostComposer } from './post-composer'
import { PostModal } from './post-modal'
import { EditPostModal } from './edit-post-modal'
import { ReportPostModal } from './report-post-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'
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

interface FeedContainerProps {
  showComposer?: boolean
  userId?: string // If provided, shows posts from specific user
  className?: string
}

type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_commented'
type FilterOption = 'all' | 'text' | 'image' | 'video' | 'mixed'

const POSTS_PER_PAGE = 10

export function FeedContainer({ 
  showComposer = true, 
  userId,
  className = ""
}: FeedContainerProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [page, setPage] = useState(0)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportPostUserId, setReportPostUserId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastPostElementRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const loadPosts = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, display_name, avatar, verify)
        `)

      // Apply user filter if specified
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        // For main feed, only show public posts and posts from followed users
        // For now, just show public posts
        query = query.eq('visibility', 'public')
      }

      // Apply post type filter
      if (filterBy !== 'all') {
        query = query.eq('post_type', filterBy)
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'most_liked':
          query = query.order('likes_count', { ascending: false })
          break
        case 'most_commented':
          query = query.order('comments_count', { ascending: false })
          break
      }

      // Apply pagination
      const from = pageNum * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error

      const newPosts = data || []
      
      if (reset || pageNum === 0) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }

      setHasMore(newPosts.length === POSTS_PER_PAGE)
      setPage(pageNum)

    } catch (error) {
      console.error('Error loading posts:', error)
      toast.error('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [userId, sortBy, filterBy, supabase])

  // Load posts on mount and when filters change
  useEffect(() => {
    loadPosts(0, true)
  }, [loadPosts])

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          // Add new post to the beginning of the feed if it matches current filters
          const newPost = payload.new as Post
          if (!userId || newPost.user_id === userId) {
            if (filterBy === 'all' || newPost.post_type === filterBy) {
              // Fetch the complete post with user data
              supabase
                .from('posts')
                .select(`
                  *,
                  user:users(id, username, display_name, avatar, verify)
                `)
                .eq('id', newPost.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setPosts(prev => [data, ...prev])
                  }
                })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          const updatedPost = payload.new as Post
          setPosts(prev => prev.map(post => 
            post.id === updatedPost.id 
              ? { ...post, ...updatedPost }
              : post
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          const deletedPost = payload.old as Post
          setPosts(prev => prev.filter(post => post.id !== deletedPost.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, filterBy])

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadPosts(page + 1)
        }
      },
      { threshold: 1.0 }
    )

    if (lastPostElementRef.current) {
      observerRef.current.observe(lastPostElementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, loadingMore, hasMore, page, loadPosts])

  const handlePostCreated = () => {
    // Refresh the feed when a new post is created
    loadPosts(0, true)
  }

  const handleRefresh = () => {
    loadPosts(0, true)
  }

  const handleLike = (postId: string, liked: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes_count: liked ? post.likes_count + 1 : post.likes_count - 1 
          }
        : post
    ))
  }

  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setSelectedPost(post)
      setPostModalOpen(true)
    }
  }

  const handleShare = (_postId: string) => {
    // TODO: Implement share functionality
    toast.success('Share functionality coming soon!')
  }

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setSelectedPost(post)
      setEditModalOpen(true)
    }
  }

  const handleReport = (postId: string, postUserId: string) => {
    setReportPostId(postId)
    setReportPostUserId(postUserId)
    setReportModalOpen(true)
  }

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ))
    setSelectedPost(updatedPost)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(post => post.id !== postId))
      setPostModalOpen(false)
      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showComposer && (
          <div className="p-4 border rounded-lg">
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Post Composer */}
      {showComposer && user && (
        <PostComposer onPostCreated={handlePostCreated} />
      )}

      {/* Filters and Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="mixed">Mixed Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
              <SelectItem value="most_commented">Most Commented</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {userId ? 'No posts found for this user.' : 'No posts in your feed yet.'}
            </p>
            {!userId && (
              <p className="text-sm text-muted-foreground mt-2">
                Follow some users or create your first post to get started!
              </p>
            )}
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostElementRef : null}
            >
              <PostCard
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
              />
            </div>
          ))
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading more posts...</span>
            </div>
          </div>
        )}

        {/* End of feed indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You've reached the end of the feed
            </p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        onLike={handleLike}
        onShare={handleShare}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        post={selectedPost}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onPostUpdated={handlePostUpdated}
      />

      {/* Report Post Modal */}
      <ReportPostModal
        postId={reportPostId}
        postUserId={reportPostUserId}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </div>
  )
}