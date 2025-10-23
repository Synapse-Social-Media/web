'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'

export default function ProfileRedirectPage() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (userProfile?.username) {
        router.replace(`/profile/${userProfile.username}`)
      } else {
        router.replace('/')
      }
    }
  }, [userProfile, loading, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Loading profile...</p>
    </div>
  )
}
