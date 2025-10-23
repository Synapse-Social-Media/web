'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X } from 'lucide-react'

export function ProfileSetup() {
  const { user, userProfile, updateProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [displayName, setDisplayName] = useState(userProfile?.display_name || '')
  const [biography, setBiography] = useState(userProfile?.biography || '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar || '')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState(userProfile?.profile_cover_image || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Avatar image must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setAvatar(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Cover image must be less than 10MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    if (displayName.length < 2) {
      setError('Display name must be at least 2 characters')
      return
    }

    if (biography.length > 160) {
      setError('Biography must be less than 160 characters')
      return
    }

    setLoading(true)

    try {
      let avatarUrl = userProfile?.avatar || ''
      let coverImageUrl = userProfile?.profile_cover_image || ''

      // Upload avatar if selected
      if (avatar && user) {
        const avatarPath = `avatars/${user.id}/${Date.now()}`
        avatarUrl = await uploadImage(avatar, 'avatars', avatarPath)
      }

      // Upload cover image if selected
      if (coverImage && user) {
        const coverPath = `covers/${user.id}/${Date.now()}`
        coverImageUrl = await uploadImage(coverImage, 'covers', coverPath)
      }

      // Update profile
      const { error } = await updateProfile({
        display_name: displayName.trim(),
        biography: biography.trim() || null,
        avatar: avatarUrl || null,
        profile_cover_image: coverImageUrl || null,
      })

      if (error) {
        setError(error)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Profile setup error:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  const removeAvatar = () => {
    setAvatar(null)
    setAvatarPreview('')
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview('')
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete your profile</CardTitle>
          <CardDescription className="text-center">
            Add some details to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Cover Image Section */}
            <div className="space-y-2">
              <Label>Cover Image (Optional)</Label>
              <div className="relative">
                <div className="w-full h-32 bg-muted rounded-lg overflow-hidden relative">
                  {coverImagePreview ? (
                    <>
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeCoverImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={loading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Cover Image
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Avatar Section */}
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback>
                      {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeAvatar}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarPreview ? 'Change Picture' : 'Add Picture'}
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How should people know you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <Label htmlFor="biography">Bio (Optional)</Label>
              <Textarea
                id="biography"
                placeholder="Tell us a bit about yourself..."
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                disabled={loading}
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {biography.length}/160 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}