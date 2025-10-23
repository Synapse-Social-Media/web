import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { accountService, SecuritySettings, LoginSession } from '@/lib/services/account-service'
import { toast } from 'sonner'

export function useAccountManagement() {
  const { user, userProfile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null)
  const [activeSessions, setActiveSessions] = useState<LoginSession[]>([])

  const changePassword = useCallback(async (_currentPassword: string, newPassword: string) => {
    if (!user) {
      toast.error('No user logged in')
      return { error: 'No user logged in' }
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return { error: 'Password must be at least 8 characters long' }
    }

    setIsLoading(true)
    try {
      const result = await accountService.changePassword(newPassword)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      toast.success('Password updated successfully')
      return {}
    } catch (error) {
      const errorMessage = 'Failed to update password'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const exportData = useCallback(async () => {
    if (!user || !userProfile) {
      toast.error('No user logged in')
      return
    }

    setIsLoading(true)
    try {
      const data = await accountService.exportUserData(user.id, userProfile.id)
      accountService.downloadDataAsJson(data)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsLoading(false)
    }
  }, [user, userProfile])

  const deactivateAccount = useCallback(async () => {
    if (!user) {
      toast.error('No user logged in')
      return { error: 'No user logged in' }
    }

    setIsLoading(true)
    try {
      const result = await accountService.deactivateAccount(user.id)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      toast.success('Account deactivated successfully')
      await signOut()
      return {}
    } catch (error) {
      const errorMessage = 'Failed to deactivate account'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [user, signOut])

  const deleteAccount = useCallback(async () => {
    if (!user || !userProfile) {
      toast.error('No user logged in')
      return { error: 'No user logged in' }
    }

    setIsLoading(true)
    try {
      const result = await accountService.deleteAccount(user.id, userProfile.id)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      toast.success('Account deleted successfully')
      await signOut()
      return {}
    } catch (error) {
      const errorMessage = 'Failed to delete account'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [user, userProfile, signOut])

  const loadSecuritySettings = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const settings = await accountService.getSecuritySettings(user.id)
      setSecuritySettings(settings)
    } catch (error) {
      toast.error('Failed to load security settings')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const updateSecuritySettings = useCallback(async (updates: Partial<SecuritySettings>) => {
    if (!user) {
      toast.error('No user logged in')
      return { error: 'No user logged in' }
    }

    try {
      const result = await accountService.updateSecuritySettings(user.id, updates)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      setSecuritySettings(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Security settings updated')
      return {}
    } catch (error) {
      const errorMessage = 'Failed to update security settings'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }, [user])

  const loadActiveSessions = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const sessions = await accountService.getActiveSessions(user.id)
      setActiveSessions(sessions)
    } catch (error) {
      toast.error('Failed to load active sessions')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const result = await accountService.revokeSession(sessionId)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      setActiveSessions(prev => prev.filter(session => session.id !== sessionId))
      toast.success('Session revoked successfully')
      return {}
    } catch (error) {
      const errorMessage = 'Failed to revoke session'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }, [])

  const revokeAllOtherSessions = useCallback(async () => {
    if (!user) {
      toast.error('No user logged in')
      return { error: 'No user logged in' }
    }

    try {
      const result = await accountService.revokeAllOtherSessions(user.id)
      
      if (result.error) {
        toast.error(result.error)
        return result
      }

      setActiveSessions(prev => prev.filter(session => session.is_current))
      toast.success('All other sessions revoked successfully')
      return {}
    } catch (error) {
      const errorMessage = 'Failed to revoke sessions'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }, [user])

  return {
    isLoading,
    securitySettings,
    activeSessions,
    changePassword,
    exportData,
    deactivateAccount,
    deleteAccount,
    loadSecuritySettings,
    updateSecuritySettings,
    loadActiveSessions,
    revokeSession,
    revokeAllOtherSessions
  }
}