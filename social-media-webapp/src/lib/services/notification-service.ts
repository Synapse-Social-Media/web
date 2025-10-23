import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationSettings, PushToken } from '@/lib/types/notification';

export class NotificationService {
  private supabase = createClient();

  // Get user notifications with pagination
  async getNotifications(userId: string, page = 0, limit = 20): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }

    return count || 0;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read' | 'read_at'>): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('notification_settings')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }

    return data?.notification_settings || null;
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        notification_settings: settings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
    
    return channel;
  }

  // Register push token
  async registerPushToken(token: PushToken): Promise<void> {
    const { error } = await this.supabase
      .from('push_tokens')
      .upsert([token]);

    if (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Remove push token
  async removePushToken(userId: string, token: string): Promise<void> {
    const { error } = await this.supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();