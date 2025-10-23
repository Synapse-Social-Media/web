'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService } from '@/lib/services/messaging-service';

interface UseTypingIndicatorOptions {
  chatId: string;
  currentUserId: string;
  enabled?: boolean;
}

interface TypingUser {
  userId: string;
  username?: string;
  displayName?: string;
  lastTyping: number;
}

export function useTypingIndicator({ 
  chatId, 
  currentUserId, 
  enabled = true 
}: UseTypingIndicatorOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing events from other users
  const handleTyping = useCallback((userId: string, typing: boolean) => {
    if (userId === currentUserId) return; // Ignore own typing events

    setTypingUsers(prev => {
      const now = Date.now();
      
      if (typing) {
        // Add or update user typing status
        const existing = prev.find(user => user.userId === userId);
        if (existing) {
          return prev.map(user => 
            user.userId === userId 
              ? { ...user, lastTyping: now }
              : user
          );
        } else {
          return [...prev, { userId, lastTyping: now }];
        }
      } else {
        // Remove user from typing list
        return prev.filter(user => user.userId !== userId);
      }
    });
  }, [currentUserId]);

  // Set up real-time subscription for typing indicators
  useEffect(() => {
    if (!enabled || !chatId) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Set up typing subscription
    unsubscribeRef.current = messagingService.subscribeToTyping(
      chatId,
      handleTyping
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId, enabled, handleTyping]);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.lastTyping < 5000) // Remove after 5 seconds
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!enabled || isTyping) return;

    try {
      setIsTyping(true);
      await messagingService.sendTypingIndicator(chatId, currentUserId, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }, [chatId, currentUserId, enabled, isTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!enabled || !isTyping) return;

    try {
      setIsTyping(false);
      await messagingService.sendTypingIndicator(chatId, currentUserId, false);

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }, [chatId, currentUserId, enabled, isTyping]);

  // Debounced typing handler for input changes
  const handleInputChange = useCallback(() => {
    if (!enabled) return;

    startTyping();

    // Clear existing stop timeout
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    // Stop typing after 1 second of no input
    stopTypingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [enabled, startTyping, stopTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
      if (isTyping) {
        messagingService.sendTypingIndicator(chatId, currentUserId, false);
      }
    };
  }, [chatId, currentUserId, isTyping]);

  // Get typing display text
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName || typingUsers[0].username || 'Someone'} is typing...`;
    } else if (typingUsers.length === 2) {
      const names = typingUsers.map(user => user.displayName || user.username || 'Someone');
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  }, [typingUsers]);

  return {
    typingUsers,
    isTyping,
    hasTypingUsers: typingUsers.length > 0,
    typingText: getTypingText(),
    startTyping,
    stopTyping,
    handleInputChange
  };
}