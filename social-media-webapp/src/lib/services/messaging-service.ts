'use client';

import { createClient } from '@/lib/supabase/client';
import { MessageWithSender } from '@/lib/types/chat';

export class MessagingService {
  private supabase = createClient();

  // Real-time message subscriptions
  subscribeToMessages(chatId: string, onMessage: (message: MessageWithSender) => void) {
    const channel = this.supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: messageWithSender, error: fetchError } = await this.supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey (
                uid,
                username,
                display_name,
                avatar
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithSender && !fetchError) {
            onMessage({
              ...messageWithSender,
              sender: messageWithSender.sender
            });
          } else if (fetchError) {
            console.error('Error fetching new message:', fetchError);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          // Handle message updates (read status, edits, etc.)
          const { data: messageWithSender, error: updateFetchError } = await this.supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey (
                uid,
                username,
                display_name,
                avatar
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithSender && !updateFetchError) {
            onMessage({
              ...messageWithSender,
              sender: messageWithSender.sender
            });
          } else if (updateFetchError) {
            console.error('Error fetching updated message:', updateFetchError);
          }
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Subscribe to typing indicators
  subscribeToTyping(chatId: string, onTyping: (userId: string, isTyping: boolean) => void) {
    const channel = this.supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        onTyping(payload.payload.userId, payload.payload.isTyping);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, userId: string, isTyping: boolean) {
    const channel = this.supabase.channel(`typing:${chatId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping }
    });
  }

  // Subscribe to user presence
  subscribeToPresence(chatId: string, userId: string, onPresenceChange: (users: any[]) => void) {
    const channel = this.supabase
      .channel(`presence:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        onPresenceChange(users);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        onPresenceChange(users);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        onPresenceChange(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await channel.track({
            userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Load messages with pagination
  async loadMessages(chatId: string, before?: number, limit: number = 50) {
    let query = this.supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          uid,
          username,
          display_name,
          avatar
        )
      `)
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;

    const messagesWithSender = (data || []).map(msg => ({
      ...msg,
      sender: msg.sender
    }));

    return messagesWithSender.reverse();
  }

  // Send message
  async sendMessage(
    chatId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text',
    mediaUrl?: string,
    mediaType?: string,
    mediaSize?: number,
    mediaDuration?: number
  ) {
    const messageData = {
      chat_id: chatId,
      sender_id: senderId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      media_type: mediaType,
      media_size: mediaSize,
      media_duration: mediaDuration,
      created_at: Date.now(),
      updated_at: Date.now(),
      delivery_status: 'sent' as const,
      read_by: [senderId], // Sender has read their own message
      reactions: {},
      is_deleted: false,
      is_edited: false
    };

    const { data, error } = await this.supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;

    // Update chat's last message
    await this.supabase
      .from('chats')
      .update({
        last_message: content,
        last_message_time: Date.now(),
        last_message_sender: senderId,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId);

    return data;
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]) {
    // Get current messages to update read_by array
    const { data: messages, error: fetchError } = await this.supabase
      .from('messages')
      .select('id, read_by')
      .in('id', messageIds)
      .eq('chat_id', chatId)
      .neq('sender_id', userId);

    if (fetchError) throw fetchError;

    // Update each message individually to handle read_by array
    for (const message of messages || []) {
      const currentReadBy = Array.isArray(message.read_by) ? message.read_by : [];
      
      // Only add if user hasn't already read this message
      if (!currentReadBy.includes(userId)) {
        const updatedReadBy = [...currentReadBy, userId];
        
        const { error } = await this.supabase
          .from('messages')
          .update({
            delivery_status: 'read',
            read_by: updatedReadBy
          })
          .eq('id', message.id);

        if (error) throw error;
      }
    }

    // Update participant's last read message
    await this.supabase
      .from('chat_participants')
      .update({
        last_read_message_id: messageIds[messageIds.length - 1],
        last_read_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  }

  // Get unread message count
  async getUnreadCount(chatId: string, userId: string) {
    // Get user's last read message timestamp
    const { data: participant } = await this.supabase
      .from('chat_participants')
      .select('last_read_at')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (!participant?.last_read_at) {
      // If no last read timestamp, count all messages
      const { count } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_deleted', false);

      return count || 0;
    }

    // Count messages after last read timestamp
    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('is_deleted', false)
      .gt('created_at', new Date(participant.last_read_at).getTime());

    return count || 0;
  }

  // Update message delivery status
  async updateDeliveryStatus(messageId: string, status: 'sent' | 'delivered' | 'read') {
    const { error } = await this.supabase
      .from('messages')
      .update({ delivery_status: status })
      .eq('id', messageId);

    if (error) throw error;
  }

  // Search messages
  async searchMessages(chatId: string, query: string, limit: number = 20) {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          uid,
          username,
          display_name,
          avatar
        )
      `)
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(msg => ({
      ...msg,
      sender: msg.sender
    }));
  }
}

export const messagingService = new MessagingService();