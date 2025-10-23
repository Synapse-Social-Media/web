'use client';

import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '@/lib/services/messaging-service';
import { createClient } from '@/lib/supabase/client';

interface UseUnreadMessagesOptions {
  userId: string;
  enabled?: boolean;
}

interface UnreadCount {
  chatId: string;
  count: number;
}

export function useUnreadMessages({ userId, enabled = true }: UseUnreadMessagesOptions) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  // Load initial unread counts for all user's chats
  const loadUnreadCounts = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      setLoading(true);

      // Get all chats where user is a participant
      const { data: userChats, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (participantsError) throw participantsError;

      const chatIds = (userChats || []).map(cp => cp.chat_id);
      
      if (chatIds.length === 0) {
        setUnreadCounts({});
        setTotalUnread(0);
        setLoading(false);
        return;
      }

      // Get unread counts for each chat
      const counts: Record<string, number> = {};
      let total = 0;

      await Promise.all(
        chatIds.map(async (chatId) => {
          try {
            const count = await messagingService.getUnreadCount(chatId, userId);
            counts[chatId] = count;
            total += count;
          } catch (error) {
            console.error(`Error getting unread count for chat ${chatId}:`, error);
            counts[chatId] = 0;
          }
        })
      );

      setUnreadCounts(counts);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, supabase]);

  // Subscribe to new messages to update unread counts
  useEffect(() => {
    if (!enabled || !userId) return;

    loadUnreadCounts();

    // Subscribe to all message changes
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const message = payload.new;
          
          // Only update if message is not from current user
          if (message.sender_id !== userId) {
            // Check if user is participant in this chat
            const { data: participant } = await supabase
              .from('chat_participants')
              .select('chat_id')
              .eq('chat_id', message.chat_id)
              .eq('user_id', userId)
              .single();

            if (participant) {
              // Increment unread count for this chat
              setUnreadCounts(prev => ({
                ...prev,
                [message.chat_id]: (prev[message.chat_id] || 0) + 1
              }));
              
              setTotalUnread(prev => prev + 1);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants'
        },
        async (payload) => {
          // Handle read status updates
          const participant = payload.new;
          
          if (participant.user_id === userId && participant.last_read_at) {
            // Recalculate unread count for this chat
            try {
              const count = await messagingService.getUnreadCount(participant.chat_id, userId);
              
              setUnreadCounts(prev => {
                const oldCount = prev[participant.chat_id] || 0;
                const newCounts = { ...prev, [participant.chat_id]: count };
                
                // Update total
                setTotalUnread(prevTotal => prevTotal - oldCount + count);
                
                return newCounts;
              });
            } catch (error) {
              console.error('Error updating unread count:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, supabase, loadUnreadCounts]);

  // Get unread count for specific chat
  const getUnreadCount = useCallback((chatId: string) => {
    return unreadCounts[chatId] || 0;
  }, [unreadCounts]);

  // Mark chat as read
  const markChatAsRead = useCallback(async (chatId: string) => {
    try {
      // Get latest message in chat
      const { data: latestMessage } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMessage) {
        // Update participant's last read message
        await supabase
          .from('chat_participants')
          .update({
            last_read_message_id: latestMessage.id,
            last_read_at: new Date().toISOString()
          })
          .eq('chat_id', chatId)
          .eq('user_id', userId);

        // Update local state
        const oldCount = unreadCounts[chatId] || 0;
        setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
        setTotalUnread(prev => prev - oldCount);
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  }, [userId, unreadCounts, supabase]);

  // Check if chat has unread messages
  const hasUnreadMessages = useCallback((chatId: string) => {
    return (unreadCounts[chatId] || 0) > 0;
  }, [unreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    loading,
    getUnreadCount,
    hasUnreadMessages,
    markChatAsRead,
    refresh: loadUnreadCounts
  };
}