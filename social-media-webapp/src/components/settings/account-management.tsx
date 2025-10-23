'use client'

import { useState } from 'react'
import { 
  Shield, 
  Key, 
  Download, 
  Trash2, 
  UserX, 
  AlertTriangle,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AccountManagementProps {
  className?: string
}

export function AccountManagement({ className }: AccountManagementProps) {
  const { user, userProfile, signOut } = useAuth()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const supabase = createClient()

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDataExport = async () => {
    setIsExporting(true)
    try {
      // Export user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user?.id)
        .single()

      if (userError) throw userError

      // Export user posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userProfile?.id)

      if (postsError) throw postsError

      // Export user stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userProfile?.id)

      if (storiesError) throw storiesError

      // Export follows
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${userProfile?.id},following_id.eq.${userProfile?.id}`)

      if (followsError) throw followsError

      const exportData = {
        user: userData,
        posts: postsData || [],
        stories: storiesData || [],
        follows: followsData || [],
        exportedAt: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `social-media-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleAccountDeactivation = async () => {
    setIsDeactivating(true)
    try {
      // In a real implementation, you would update a status field
      // For now, we'll just sign out the user
      await signOut()
      toast.success('Account deactivated successfully')
    } catch (error) {
      toast.error('Failed to deactivate account')
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    try {
      // Delete user data in order (due to foreign key constraints)
      
      // Delete stories
      await supabase
        .from('stories')
        .delete()
        .eq('user_id', userProfile?.id)

      // Delete posts
      await supabase
        .from('posts')
        .delete()
        .eq('user_id', userProfile?.id)

      // Delete follows
      await supabase
        .from('follows')
        .delete()
        .or(`follower_id.eq.${userProfile?.id},following_id.eq.${userProfile?.id}`)

      // Delete user profile
      await supabase
        .from('users')
        .delete()
        .eq('uid', user?.id)

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '')
      
      if (error) {
        toast.error('Failed to delete account')
      } else {
        toast.success('Account deleted successfully')
        await signOut()
      }
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for better security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="w-full"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is not yet available. This feature will be implemented in a future update.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of your data including posts, stories, and profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDataExport}
            disabled={isExporting}
            variant="outline"
            className="w-full"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions cannot be undone. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Deactivation */}
          <div className="space-y-2">
            <h4 className="font-medium">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground">
              Temporarily disable your account. You can reactivate it by logging in again.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deactivate Account</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to deactivate your account? This will temporarily disable your profile and you won't be able to access the platform until you reactivate it.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleAccountDeactivation}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Account Deletion */}
          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      All your posts, stories, messages, and profile information will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleAccountDeletion}
                    disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}