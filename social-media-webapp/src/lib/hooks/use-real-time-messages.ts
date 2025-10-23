'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageWithSender } from '@/lib/types/chat';
import { messagingService } from '@/lib/services/messaging-service';

interface UseRealTimeMessagesOptions {
  chatId: string;
  currentUserId: string;
  enabled?: boolean;
}

export function useRealTimeMessages({ 
  chatId, 
  currentUserId, 
  enabled = true 
}: UseRealTimeMessagesOptions) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messagesRef = useRef<MessageWithSender[]>([]);

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load initial messages
  const loadMessages = useCallback(async (before?: number) => {
    if (!enabled || !chatId) return;

    try {
      if (!before) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const newMessages = await messagingService.loadMessages(chatId, before, 50);
      
      if (before) {
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(newMessages.length === 50);

      // Mark messages as read
      if (newMessages.length > 0 && !before) {
        const messageIds = newMessages
          .filter(msg => msg.sender_id !== currentUserId)
          .map(msg => msg.id);
        
        if (messageIds.length > 0) {
          await messagingService.markMessagesAsRead(chatId, currentUserId, messageIds);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [chatId, currentUserId, enabled]);

  // Handle new messages from real-time subscription
  const handleNewMessage = useCallback((newMessage: MessageWithSender) => {
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        // Update existing message (for read status updates, etc.)
        return prev.map(msg => 
          msg.id === newMessage.id ? newMessage : msg
        );
      }
      
      // Add new message
      const updated = [...prev, newMessage];
      
      // Mark as read if it's not from current user
      if (newMessage.sender_id !== currentUserId) {
        messagingService.markMessagesAsRead(chatId, currentUserId, [newMessage.id]);
      }
      
      return updated;
    });
  }, [chatId, currentUserId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !chatId) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Load initial messages
    loadMessages();

    // Set up real-time subscription
    unsubscribeRef.current = messagingService.subscribeToMessages(
      chatId, 
      handleNewMessage
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId, enabled, loadMessages, handleNewMessage]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (messages.length > 0 && hasMore && !loadingMore) {
      loadMessages(messages[0]?.created_at);
    }
  }, [messages, hasMore, loadingMore, loadMessages]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text',
    mediaUrl?: string,
    mediaType?: string,
    mediaSize?: number,
    mediaDuration?: number
  ) => {
    try {
      await messagingService.sendMessage(
        chatId,
        currentUserId,
        content,
        messageType,
        mediaUrl,
        mediaType,
        mediaSize,
        mediaDuration
      );
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [chatId, currentUserId]);

  // Retry loading messages
  const retry = useCallback(() => {
    setError(null);
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    sendMessage,
    retry
  };
}