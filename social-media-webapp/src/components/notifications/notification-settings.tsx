'use client'

import { useState } from 'react'
import { Bell, Clock, Volume2, VolumeX, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NotificationSettings } from '@/lib/types/notification'
import { useNotifications } from '@/lib/contexts/notification-context'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettingsComponent({ className }: NotificationSettingsProps) {
  const {
    settings,
    updateSettings,
    pushPermission,
    isPushSupported,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush
  } = useNotifications()
  const [isSaving, setIsSaving] = useState(false)

  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsSaving(true)
    try {
      await updateSettings(newSettings)
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { [key]: value }
    saveSettings(newSettings)
  }

  const handleTimeChange = (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    const newSettings = { [key]: value }
    saveSettings(newSettings)
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (pushPermission === 'default') {
        const permission = await requestPushPermission()
        if (permission === 'granted') {
          await subscribeToPush()
          await saveSettings({ push_enabled: true })
        }
      } else if (pushPermission === 'granted') {
        await subscribeToPush()
        await saveSettings({ push_enabled: true })
      } else {
        toast.error('Push notifications are blocked. Please enable them in your browser settings.')
      }
    } else {
      await unsubscribeFromPush()
      await saveSettings({ push_enabled: false })
    }
  }

  if (!settings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading settings...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">General</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push-enabled">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  {isPushSupported 
                    ? 'Receive notifications in your browser'
                    : 'Not supported in this browser'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pushPermission === 'denied' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Please enable notifications in your browser settings')}
                >
                  Enable in Browser
                </Button>
              )}
              <Switch
                id="push-enabled"
                checked={settings.push_enabled && pushPermission === 'granted'}
                onCheckedChange={handlePushToggle}
                disabled={isSaving || !isPushSupported}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              {settings.do_not_disturb ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="do-not-disturb">Do Not Disturb</Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable all notifications
                </p>
              </div>
            </div>
            <Switch
              id="do-not-disturb"
              checked={settings.do_not_disturb}
              onCheckedChange={(checked) => handleToggle('do_not_disturb', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Types</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-notifications">Messages</Label>
              <Switch
                id="message-notifications"
                checked={settings.message_notifications}
                onCheckedChange={(checked) => handleToggle('message_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="follow-notifications">New Followers</Label>
              <Switch
                id="follow-notifications"
                checked={settings.follow_notifications}
                onCheckedChange={(checked) => handleToggle('follow_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="like-notifications">Likes</Label>
              <Switch
                id="like-notifications"
                checked={settings.like_notifications}
                onCheckedChange={(checked) => handleToggle('like_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="comment-notifications">Comments</Label>
              <Switch
                id="comment-notifications"
                checked={settings.comment_notifications}
                onCheckedChange={(checked) => handleToggle('comment_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="mention-notifications">Mentions</Label>
              <Switch
                id="mention-notifications"
                checked={settings.mention_notifications}
                onCheckedChange={(checked) => handleToggle('mention_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="story-notifications">Story Views</Label>
              <Switch
                id="story-notifications"
                checked={settings.story_notifications}
                onCheckedChange={(checked) => handleToggle('story_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="post-notifications">Post Interactions</Label>
              <Switch
                id="post-notifications"
                checked={settings.post_notifications}
                onCheckedChange={(checked) => handleToggle('post_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system-notifications">System Updates</Label>
              <Switch
                id="system-notifications"
                checked={settings.system_notifications}
                onCheckedChange={(checked) => handleToggle('system_notifications', checked)}
                disabled={isSaving || settings.do_not_disturb}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Quiet Hours</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">
                Reduce notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
              disabled={isSaving || settings.do_not_disturb}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>

        {isSaving && (
          <div className="text-center text-sm text-muted-foreground">
            Saving settings...
          </div>
        )}
      </CardContent>
    </Card>
  )
}