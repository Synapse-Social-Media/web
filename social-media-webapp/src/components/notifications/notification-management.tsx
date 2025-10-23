'use client'

import { useState } from 'react'
import { Bell, Settings, History, TestTube } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NotificationSettingsComponent } from './notification-settings'
import { NotificationHistory } from './notification-history'
import { useNotifications } from '@/lib/contexts/notification-context'
import { pushNotificationService } from '@/lib/services/push-notification-service'
import { toast } from 'sonner'

interface NotificationManagementProps {
  className?: string
}

export function NotificationManagement({ className }: NotificationManagementProps) {
  const { isPushSupported, pushPermission } = useNotifications()
  const [isTestingPush, setIsTestingPush] = useState(false)

  const handleTestPushNotification = async () => {
    setIsTestingPush(true)
    try {
      await pushNotificationService.testNotification()
      toast.success('Test notification sent!')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      toast.error('Failed to send test notification')
    } finally {
      setIsTestingPush(false)
    }
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notification Management</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences and view your notification history
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <NotificationSettingsComponent />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Notifications
              </CardTitle>
              <CardDescription>
                Test your notification settings to make sure everything is working correctly
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Push Notification Test</h3>
                    <p className="text-sm text-muted-foreground">
                      Send a test push notification to this device
                    </p>
                  </div>
                  <Button
                    onClick={handleTestPushNotification}
                    disabled={!isPushSupported || pushPermission !== 'granted' || isTestingPush}
                  >
                    {isTestingPush ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">In-App Notification Test</h3>
                    <p className="text-sm text-muted-foreground">
                      Show a test toast notification
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast('Test Notification', {
                        description: 'This is a test in-app notification',
                        action: {
                          label: 'Action',
                          onClick: () => toast.success('Action clicked!')
                        }
                      })
                    }}
                  >
                    Show Toast
                  </Button>
                </div>

                {!isPushSupported && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Push notifications are not supported in this browser
                      </p>
                    </div>
                  </div>
                )}

                {isPushSupported && pushPermission === 'denied' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Push notifications are blocked. Please enable them in your browser settings.
                      </p>
                    </div>
                  </div>
                )}

                {isPushSupported && pushPermission === 'default' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Enable push notifications in the Settings tab to test them.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}