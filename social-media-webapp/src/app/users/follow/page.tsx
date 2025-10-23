'use client'

import { useState } from 'react'
import { Search, Users, UserPlus, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserSuggestions, FollowList } from '@/components/profile'
import { useAuth } from '@/lib/contexts/auth-context'

export default function FollowPage() {
  const { userProfile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be signed in to view and manage your connections
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Discover & Connect</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find new people to follow, manage your connections, and discover interesting users
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Suggestions */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Suggested for You
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Discover users based on your interests and connections
                  </p>
                </div>
              </div>
              <UserSuggestions limit={6} />
            </section>

            {/* Your Connections */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Your Connections
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Manage your followers and following
                  </p>
                </div>
              </div>
              <FollowList userId={userProfile.uid} />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="font-semibold">{userProfile.followers_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Following</span>
                  <span className="font-semibold">{userProfile.following_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-semibold">{userProfile.posts_count.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Quick Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserSuggestions 
                  variant="compact" 
                  limit={5} 
                  showHeader={false}
                />
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Follow users with similar interests to discover great content</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Engage with posts to build meaningful connections</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Use search to find specific users or topics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}