'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  X,
  Type,
  Palette
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StoryComposerProps {
  isOpen: boolean
  onClose: () => void
  onStoryCreated?: () => void
}

export function StoryComposer({ isOpen, onClose, onStoryCreated }: StoryComposerProps) {
  const { userProfile } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [textOverlay, setTextOverlay] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'close_friends'>('public')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const backgroundColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ]

  const
nst handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userProfile?.id}-${Date.now()}.${fileExt}`
    const filePath = `stories/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return publicUrl
  }  cons
t handleSubmit = async () => {
    if (!selectedFile || !userProfile) {
      toast.error('Please select a file')
      return
    }

    setIsUploading(true)

    try {
      // Upload file
      const mediaUrl = await uploadFile(selectedFile)
      
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Create story record
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: userProfile.id,
          media_url: mediaUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
          text_overlay: textOverlay || null,
          background_color: backgroundColor !== '#000000' ? backgroundColor : null,
          visibility,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error

      toast.success('Story created successfully!')
      onStoryCreated?.()
      handleClose()
    } catch (error) {
      console.error('Error creating story:', error)
      toast.error('Failed to create story. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    clearFile()
    setTextOverlay('')
    setBackgroundColor('#000000')
    setVisibility('public')
    onClose()
  }  r
eturn (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload area */}
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Gallery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Or drag and drop a file here
                </p>
              </div>
            </div>
          ) : (
            /* Preview area */
            <div className="relative">
              <div 
                className="relative w-full h-64 rounded-lg overflow-hidden"
                style={{ backgroundColor }}
              >
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={previewUrl!}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={previewUrl!}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                
                {/* Text overlay preview */}
                {textOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <p className="text-white text-center text-lg font-medium drop-shadow-lg">
                      {textOverlay}
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Story customization */}
          {selectedFile && (
            <div className="space-y-4">
              {/* Text overlay */}
              <div className="space-y-2">
                <Label htmlFor="text-overlay" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Overlay
                </Label>
                <Textarea
                  id="text-overlay"
                  placeholder="Add text to your story..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Background color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Background Color
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {backgroundColors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        backgroundColor === color ? "border-primary" : "border-muted"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="close_friends">Close Friends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}