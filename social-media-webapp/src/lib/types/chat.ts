export interface User {
  id: string;
  uid: string;
  email?: string;
  username?: string;
  display_name?: string;
  biography?: string;
  avatar?: string;
  profile_cover_image?: string;
  account_premium: boolean;
  verify: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  chat_id: string;
  is_group: boolean;
  chat_name?: string;
  chat_description?: string;
  chat_avatar?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: number;
  last_message_sender?: string;
  participants_count: number;
  is_active: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'audio';
  media_url?: string;
  media_type?: string;
  media_size?: number;
  media_duration?: number;
  created_at: number;
  updated_at: number;
  is_deleted: boolean;
  is_edited: boolean;
  edit_history?: any;
  reply_to_id?: string;
  forwarded_from?: string;
  delivery_status: 'sent' | 'delivered' | 'read';
  read_by: string[];
  reactions: Record<string, string[]>;
  sender?: User;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  added_by?: string;
  is_admin: boolean;
  can_send_messages: boolean;
  last_read_message_id?: string;
  last_read_at?: string;
  notification_settings: {
    muted: boolean;
    sound: boolean;
  };
  user?: User;
}

export interface ChatWithParticipants extends Chat {
  participants: ChatParticipant[];
}

export interface MessageWithSender extends Message {
  sender: User;
}