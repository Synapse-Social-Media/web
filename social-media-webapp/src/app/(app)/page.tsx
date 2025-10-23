import { FeedContainer } from '@/components/posts/feed-container'

export default function Home() {
  return (
    <div className="w-full">
      <FeedContainer showComposer={true} />
    </div>
  )
}
