'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService } from '@/lib/services/messaging-service';

interface PresenceUser {
  userId: string;
  online_at: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

interface UsePresenceOptions {
  chatId: string;
  currentUserId: string;
  enabled?: boolean;
}

export function usePresence({ 
  chatId, 
  currentUserId, 
  enabled = true 
}: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle presence changes
  const handlePresenceChange = useCallback((users: PresenceUser[]) => {
    // Filter out current user from the list
    const otherUsers = users.filter(user => user.userId !== currentUserId);
    setOnlineUsers(otherUsers);
  }, [currentUserId]);

  // Set up presence subscription
  useEffect(() => {
    if (!enabled || !chatId) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setIsOnline(true);

    // Set up presence subscription
    unsubscribeRef.current = messagingService.subscribeToPresence(
      chatId,
      currentUserId,
      handlePresenceChange
    );

    return () => {
      setIsOnline(false);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId, currentUserId, enabled, handlePresenceChange]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsOnline(false);
      } else {
        setIsOnline(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Get online status for a specific user
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(user => user.userId === userId);
  }, [onlineUsers]);

  // Get online users count (excluding current user)
  const onlineCount = onlineUsers.length;

  // Get online users list with details
  const getOnlineUsers = useCallback(() => {
    return onlineUsers;
  }, [onlineUsers]);

  // Check if any users are online
  const hasOnlineUsers = onlineUsers.length > 0;

  return {
    onlineUsers,
    onlineCount,
    isOnline,
    hasOnlineUsers,
    isUserOnline,
    getOnlineUsers
  };
}