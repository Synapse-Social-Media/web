export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  type: NotificationType;
  title?: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  expires_at?: string;
  sender?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar?: string;
  };
}

export type NotificationType = 
  | 'like'
  | 'comment' 
  | 'follow'
  | 'message'
  | 'mention'
  | 'story_view'
  | 'post_share'
  | 'system'
  | 'welcome'
  | 'feature';

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  message_notifications: boolean;
  post_notifications: boolean;
  follow_notifications: boolean;
  like_notifications: boolean;
  comment_notifications: boolean;
  mention_notifications: boolean;
  story_notifications: boolean;
  system_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  do_not_disturb: boolean;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  latest: Notification;
  notifications: Notification[];
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  device_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}