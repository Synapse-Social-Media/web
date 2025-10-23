'use client'

import { UserCard, UserSuggestions, FollowList } from '@/components/profile'
import { Database } from '@/lib/types/database.types'
import { followService } from '@/lib/services/follow-service'
import { toast } from 'sonner'

type User = Database['public']['Tables']['users']['Row']

const mockUsers: User[] = [
  {
    id: '1',
    uid: 'user-1',
    email: 'alice.johnson@example.com',
    username: 'alicejohnson',
    display_name: 'Alice Johnson',
    biography: 'Product designer passionate about creating intuitive user experiences. Coffee enthusiast ☕',
    avatar: null,
    profile_cover_image: null,
    account_premium: false,
    verify: true,
    followers_count: 2340,
    following_count: 567,
    posts_count: 89,
    created_at: '2023-02-20T11:30:00Z',
    updated_at: '2024-01-20T11:30:00Z'
  },
  {
    id: '2',
    uid: 'user-2',
    email: 'bob.smith@example.com',
    username: 'bobsmith',
    display_name: 'Bob Smith',
    biography: 'Full-stack developer building the future of web applications. Open source contributor.',
    avatar: null,
    profile_cover_image: null,
    account_premium: true,
    verify: false,
    followers_count: 1890,
    following_count: 234,
    posts_count: 156,
    created_at: '2023-01-05T14:15:00Z',
    updated_at: '2024-01-15T14:15:00Z'
  },
  {
    id: '3',
    uid: 'user-3',
    email: 'carol.white@example.com',
    username: 'carolwhite',
    display_name: 'Carol White',
    biography: 'Digital marketing strategist helping brands grow online. Travel blogger on weekends.',
    avatar: null,
    profile_cover_image: null,
    account_premium: false,
    verify: true,
    followers_count: 5670,
    following_count: 1234,
    posts_count: 234,
    created_at: '2022-11-10T16:45:00Z',
    updated_at: '2024-01-10T16:45:00Z'
  }
]

export default function UsersPage() {
  const handleFollow = async (userId: string) => {
    try {
      const { error } = await followService.followUser(userId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User followed successfully')
      }
    } catch (error) {
      toast.error('Failed to follow user')
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      const { error } = await followService.unfollowUser(userId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('User unfollowed successfully')
      }
    } catch (error) {
      toast.error('Failed to unfollow user')
    }
  }

  const handleMessage = (userId: string) => {
    console.log('Messaging user:', userId)
    toast.info('Messaging feature coming soon!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Follow System Demo</h1>
          <p className="text-muted-foreground">
            Showcasing the follow system with user suggestions, follow lists, and user cards
          </p>
        </div>

        {/* User Suggestions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">User Suggestions</h2>
          <p className="text-muted-foreground">
            Discover new users to follow based on mutual connections and interests
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserSuggestions limit={5} />
            <UserSuggestions variant="compact" showHeader={true} limit={8} />
          </div>
        </section>

        {/* Follow Lists */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Follow Lists</h2>
          <p className="text-muted-foreground">
            Browse followers and following lists with search and pagination
          </p>
          <div className="max-w-2xl">
            <FollowList 
              userId="user-1" 
              initialTab="followers"
            />
          </div>
        </section>

        {/* Default Variant */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Default Variant</h2>
          <p className="text-muted-foreground">
            Full-featured user cards with follow buttons and action menus
          </p>
          <div className="grid gap-4">
            {mockUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                variant="default"
                showFollowButton={true}
                showMessageButton={true}
                isFollowing={user.id === '2'}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onMessage={handleMessage}
              />
            ))}
          </div>
        </section>

        {/* Compact Variant */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Compact Variant</h2>
          <p className="text-muted-foreground">
            Minimal user cards perfect for lists and search results
          </p>
          <div className="bg-card border rounded-lg p-4 space-y-2">
            {mockUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                variant="compact"
                showFollowButton={true}
                isFollowing={user.id === '1'}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>
        </section>

        {/* Suggestion Variant */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Suggestion Variant</h2>
          <p className="text-muted-foreground">
            Card-based layout perfect for user suggestions and discovery
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                variant="suggestion"
                showFollowButton={true}
                isFollowing={user.id === '3'}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}