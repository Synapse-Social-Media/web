'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ProfileHeader, ProfileTabs } from '@/components/profile'
import { Database } from '@/lib/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Post = Database['public']['Tables']['posts']['Row']

// Mock data for demonstration
const mockUser: User = {
  id: '1',
  uid: 'user-1',
  email: 'john.doe@example.com',
  username: 'johndoe',
  display_name: 'John Doe',
  biography: 'Software developer passionate about creating amazing user experiences. Love to travel and explore new technologies.',
  avatar: null,
  profile_cover_image: null,
  account_premium: false,
  verify: true,
  followers_count: 1250,
  following_count: 890,
  posts_count: 42,
  created_at: '2023-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z'
}

const mockPosts: Post[] = [
  {
    id: '1',
    user_id: '1',
    content: 'Just finished building an amazing new feature! The profile components are looking great with shadcn/ui. Really excited to share this with everyone.',
    media_urls: null,
    media_types: null,
    post_type: 'text',
    visibility: 'public',
    likes_count: 24,
    comments_count: 8,
    shares_count: 3,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    user_id: '1',
    content: 'Beautiful sunset from my weekend hike! Nature never fails to inspire.',
    media_urls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'],
    media_types: ['image'],
    post_type: 'image',
    visibility: 'public',
    likes_count: 156,
    comments_count: 23,
    shares_count: 12,
    created_at: '2024-01-18T18:45:00Z',
    updated_at: '2024-01-18T18:45:00Z'
  }
]

const mockFollowers: User[] = [
  {
    id: '2',
    uid: 'user-2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    display_name: 'Jane Smith',
    biography: 'UI/UX Designer creating beautiful digital experiences',
    avatar: null,
    profile_cover_image: null,
    account_premium: true,
    verify: false,
    followers_count: 890,
    following_count: 456,
    posts_count: 78,
    created_at: '2023-03-10T09:15:00Z',
    updated_at: '2024-01-10T09:15:00Z'
  }
]

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data loading
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set mock data
      setUser(mockUser)
      setPosts(mockPosts)
      setFollowers(mockFollowers)
      setFollowing([])
      setIsFollowing(false)
      
      setIsLoading(false)
    }

    loadUserData()
  }, [username])

  const handleFollow = () => {
    setIsFollowing(true)
    // In real app, make API call here
    console.log('Following user:', user?.username)
  }

  const handleUnfollow = () => {
    setIsFollowing(false)
    // In real app, make API call here
    console.log('Unfollowing user:', user?.username)
  }

  const handleMessage = () => {
    // In real app, navigate to chat or open message modal
    console.log('Opening message for user:', user?.username)
  }

  const handleEdit = () => {
    // In real app, open edit profile modal
    console.log('Opening edit profile')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Header Skeleton */}
          <div className="bg-card rounded-lg border">
            <div className="h-48 md:h-64 bg-muted animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="flex items-end justify-between -mt-20">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-24 h-9 bg-muted animate-pulse rounded" />
                  <div className="w-24 h-9 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-48 h-8 bg-muted animate-pulse rounded" />
                <div className="w-32 h-5 bg-muted animate-pulse rounded" />
                <div className="w-full max-w-md h-4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
          
          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="w-full h-4 bg-muted animate-pulse rounded" />
                    <div className="w-full h-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground">
            The user @{username} doesn't exist or has been deactivated.
          </p>
        </div>
      </div>
    )
  }

  const isOwnProfile = user.username === 'johndoe' // In real app, check against current user

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onMessage={handleMessage}
          onEdit={handleEdit}
        />
        
        <ProfileTabs
          user={user}
          posts={posts}
          followers={followers}
          following={following}
          isOwnProfile={isOwnProfile}
          isLoading={false}
        />
      </div>
    </div>
  )
}