'use client'

import { TrendingUp, Hash, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingTopic } from '@/lib/types/search'

interface TrendingTopicsProps {
  topics?: TrendingTopic[]
  isLoading?: boolean
  onTopicClick?: (topic: TrendingTopic) => void
  className?: string
  showHeader?: boolean
  maxItems?: number
}

export function TrendingTopics({
  topics = [],
  isLoading = false,
  onTopicClick,
  className,
  showHeader = true,
  maxItems = 10
}: TrendingTopicsProps) {
  const displayTopics = topics.slice(0, maxItems)

  const formatPostCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getTrendingBadgeVariant = (growthRate: number) => {
    if (growthRate >= 0.8) return 'destructive' // Hot trending
    if (growthRate >= 0.5) return 'default' // Trending
    return 'secondary' // Growing
  }

  const getTrendingLabel = (growthRate: number) => {
    if (growthRate >= 0.8) return 'Hot'
    if (growthRate >= 0.5) return 'Trending'
    return 'Growing'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Topics
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (displayTopics.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Topics
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending topics right now</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Topics
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {displayTopics.map((topic, index) => (
          <Button
            key={topic.id}
            variant="ghost"
            onClick={() => onTopicClick?.(topic)}
            className="w-full justify-between h-auto p-3 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-muted-foreground text-sm font-medium">
                  {index + 1}
                </span>
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {topic.hashtag}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPostCount(topic.post_count)} posts
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant={getTrendingBadgeVariant(topic.growth_rate)}
                className="text-xs"
              >
                {getTrendingLabel(topic.growth_rate)}
              </Badge>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
        
        {topics.length > maxItems && (
          <Button variant="ghost" className="w-full text-sm text-muted-foreground">
            Show more trending topics
          </Button>
        )}
      </CardContent>
    </Card>
  )
}