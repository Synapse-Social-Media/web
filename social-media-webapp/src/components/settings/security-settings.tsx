'use client'

import { useState, useEffect } from 'react'
import { Shield, Clock, MapPin, Smartphone, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface SecuritySettingsProps {
  className?: string
}

interface LoginSession {
  id: string
  ip_address: string
  user_agent: string
  location?: string
  last_active: string
  is_current: boolean
}

export function SecuritySettings({ className }: SecuritySettingsProps) {
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [securitySettings, setSecuritySettings] = useState({
    login_notifications: true,
    suspicious_activity_alerts: true,
    new_device_notifications: true,
    password_change_notifications: true
  })

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, you would fetch actual session data
      // For now, we'll simulate some session data
      const mockSessions: LoginSession[] = [
        {
          id: '1',
          ip_address: '192.168.1.100',
          user_agent: 'Chrome 120.0.0.0 on Windows 10',
          location: 'New York, NY',
          last_active: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          ip_address: '10.0.0.50',
          user_agent: 'Safari 17.0 on iPhone',
          location: 'New York, NY',
          last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_current: false
        }
      ]
      
      setSessions(mockSessions)
    } catch (error) {
      toast.error('Failed to load security data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecuritySettingChange = async (key: keyof typeof securitySettings, value: boolean) => {
    try {
      setSecuritySettings(prev => ({ ...prev, [key]: value }))
      // In a real implementation, you would save this to the database
      toast.success('Security setting updated')
    } catch (error) {
      toast.error('Failed to update security setting')
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // In a real implementation, you would revoke the session
      setSessions(prev => prev.filter(session => session.id !== sessionId))
      toast.success('Session revoked successfully')
    } catch (error) {
      toast.error('Failed to revoke session')
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      // In a real implementation, you would revoke all sessions except current
      setSessions(prev => prev.filter(session => session.is_current))
      toast.success('All other sessions revoked successfully')
    } catch (error) {
      toast.error('Failed to revoke sessions')
    }
  }

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Active now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Notifications
          </CardTitle>
          <CardDescription>
            Get notified about important security events on your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="login-notifications">Login Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              id="login-notifications"
              checked={securitySettings.login_notifications}
              onCheckedChange={(checked) => handleSecuritySettingChange('login_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="suspicious-activity">Suspicious Activity Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get alerted about unusual account activity
              </p>
            </div>
            <Switch
              id="suspicious-activity"
              checked={securitySettings.suspicious_activity_alerts}
              onCheckedChange={(checked) => handleSecuritySettingChange('suspicious_activity_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-device">New Device Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your account is accessed from a new device
              </p>
            </div>
            <Switch
              id="new-device"
              checked={securitySettings.new_device_notifications}
              onCheckedChange={(checked) => handleSecuritySettingChange('new_device_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="password-change">Password Change Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your password is changed
              </p>
            </div>
            <Switch
              id="password-change"
              checked={securitySettings.password_change_notifications}
              onCheckedChange={(checked) => handleSecuritySettingChange('password_change_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage devices and browsers that are currently logged into your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading sessions...
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {session.is_current ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{session.user_agent}</span>
                          {session.is_current && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location || 'Unknown location'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActive(session.last_active)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          IP: {session.ip_address}
                        </div>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {sessions.filter(s => !s.is_current).length > 0 && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    onClick={handleRevokeAllSessions}
                    className="w-full"
                  >
                    Revoke All Other Sessions
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>
            Tips to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Use a strong password:</strong> Your password should be at least 12 characters long and include a mix of letters, numbers, and symbols.
            </AlertDescription>
          </Alert>

          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <strong>Enable two-factor authentication:</strong> Add an extra layer of security to your account (coming soon).
            </AlertDescription>
          </Alert>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Review active sessions regularly:</strong> Check for any unfamiliar devices or locations and revoke access if needed.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Keep your email secure:</strong> Make sure your email account is secure as it's used for account recovery.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}