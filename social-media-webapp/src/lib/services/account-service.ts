import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

export interface AccountExportData {
  user: UserProfile
  posts: any[]
  stories: any[]
  follows: any[]
  exportedAt: string
}

export interface SecuritySettings {
  login_notifications: boolean
  suspicious_activity_alerts: boolean
  new_device_notifications: boolean
  password_change_notifications: boolean
}

export interface LoginSession {
  id: string
  ip_address: string
  user_agent: string
  location?: string
  last_active: string
  is_current: boolean
}

export class AccountService {
  private supabase = createClient()

  async changePassword(newPassword: string): Promise<{ error?: string }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to update password' }
    }
  }

  async exportUserData(userId: string, userProfileId: string): Promise<AccountExportData> {
    try {
      // Export user data
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('uid', userId)
        .single()

      if (userError) throw userError

      // Export user posts
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*')
        .eq('user_id', userProfileId)

      if (postsError) throw postsError

      // Export user stories
      const { data: storiesData, error: storiesError } = await this.supabase
        .from('stories')
        .select('*')
        .eq('user_id', userProfileId)

      if (storiesError) throw storiesError

      // Export follows
      const { data: followsData, error: followsError } = await this.supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${userProfileId},following_id.eq.${userProfileId}`)

      if (followsError) throw followsError

      return {
        user: userData,
        posts: postsData || [],
        stories: storiesData || [],
        follows: followsData || [],
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      throw new Error('Failed to export user data')
    }
  }

  async deactivateAccount(userId: string): Promise<{ error?: string }> {
    try {
      // In a real implementation, you would update a status field
      // For now, we'll update the user profile to indicate deactivation
      const { error } = await this.supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString()
          // In a real app, you'd have a status field like: status: 'deactivated'
        })
        .eq('uid', userId)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to deactivate account' }
    }
  }

  async deleteAccount(userId: string, userProfileId: string): Promise<{ error?: string }> {
    try {
      // Delete user data in order (due to foreign key constraints)
      
      // Delete story views first
      await this.supabase
        .from('story_views')
        .delete()
        .eq('viewer_id', userProfileId)

      // Delete stories
      await this.supabase
        .from('stories')
        .delete()
        .eq('user_id', userProfileId)

      // Delete reports
      await this.supabase
        .from('reports')
        .delete()
        .or(`reporter_id.eq.${userProfileId},reported_user_id.eq.${userProfileId}`)

      // Delete posts
      await this.supabase
        .from('posts')
        .delete()
        .eq('user_id', userProfileId)

      // Delete follows
      await this.supabase
        .from('follows')
        .delete()
        .or(`follower_id.eq.${userProfileId},following_id.eq.${userProfileId}`)

      // Delete user profile
      const { error: profileError } = await this.supabase
        .from('users')
        .delete()
        .eq('uid', userId)

      if (profileError) {
        return { error: profileError.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to delete account' }
    }
  }

  async getSecuritySettings(_userId: string): Promise<SecuritySettings> {
    try {
      // In a real implementation, you would fetch from a security_settings table
      // For now, return default settings
      return {
        login_notifications: true,
        suspicious_activity_alerts: true,
        new_device_notifications: true,
        password_change_notifications: true
      }
    } catch (error) {
      throw new Error('Failed to load security settings')
    }
  }

  async updateSecuritySettings(_userId: string, _settings: Partial<SecuritySettings>): Promise<{ error?: string }> {
    try {
      // In a real implementation, you would update the security_settings table
      // For now, we'll just simulate success
      return {}
    } catch (error) {
      return { error: 'Failed to update security settings' }
    }
  }

  async getActiveSessions(_userId: string): Promise<LoginSession[]> {
    try {
      // In a real implementation, you would fetch actual session data
      // For now, return mock data
      return [
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
    } catch (error) {
      throw new Error('Failed to load active sessions')
    }
  }

  async revokeSession(_sessionId: string): Promise<{ error?: string }> {
    try {
      // In a real implementation, you would revoke the specific session
      return {}
    } catch (error) {
      return { error: 'Failed to revoke session' }
    }
  }

  async revokeAllOtherSessions(_userId: string): Promise<{ error?: string }> {
    try {
      // In a real implementation, you would revoke all sessions except current
      return {}
    } catch (error) {
      return { error: 'Failed to revoke sessions' }
    }
  }

  downloadDataAsJson(data: AccountExportData, filename?: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `social-media-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const accountService = new AccountService()