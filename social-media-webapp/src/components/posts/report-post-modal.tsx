'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, Flag } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ReportPostModalProps {
  postId: string | null
  postUserId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const reportReasons = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech or discrimination' },
  { value: 'violence', label: 'Violence or dangerous content' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'copyright', label: 'Copyright infringement' },
  { value: 'misinformation', label: 'False or misleading information' },
  { value: 'other', label: 'Other (please specify)' }
]

export function ReportPostModal({ 
  postId, 
  postUserId, 
  open, 
  onOpenChange 
}: ReportPostModalProps) {
  const { user } = useAuth()
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!user || !postId || !postUserId) {
      toast.error('Unable to submit report. Please try again.')
      return
    }

    if (!selectedReason) {
      toast.error('Please select a reason for reporting this post')
      return
    }

    if (selectedReason === 'other' && !description.trim()) {
      toast.error('Please provide a description for your report')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: postUserId,
          target_id: postId,
          target_type: 'post',
          reason: selectedReason,
          description: description.trim() || null
        })

      if (error) throw error

      toast.success('Report submitted successfully. We will review it shortly.')
      
      // Reset form
      setSelectedReason('')
      setDescription('')
      onOpenChange(false)

    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedReason('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Help us understand what's happening with this post. Your report is anonymous.
          </p>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this post?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label 
                    htmlFor={reason.value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {(selectedReason === 'other' || selectedReason) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {selectedReason === 'other' ? 'Please describe the issue' : 'Additional details (optional)'}
              </Label>
              <Textarea
                placeholder="Provide more context about why you're reporting this post..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !description.trim())}
              variant="destructive"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}