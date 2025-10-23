'use client';

import { useEffect, useRef } from 'react';
import { ChatWithParticipants, User } from '@/lib/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Users,
  ArrowLeft 
} from 'lucide-react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatComposer } from '@/components/chat/chat-composer';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { PresenceIndicator } from '@/components/chat/presence-indicator';
import { useRealTimeMessages } from '@/lib/hooks/use-real-time-messages';
import { useTypingIndicator } from '@/lib/hooks/use-typing-indicator';
import { usePresence } from '@/lib/hooks/use-presence';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  chat: ChatWithParticipants;
  currentUser: User;
  onBack?: () => void;
  className?: string;
}

export function ChatWindow({ 
  chat, 
  currentUser, 
  onBack,
  className 
}: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time messages hook
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    sendMessage,
    retry
  } = useRealTimeMessages({
    chatId: chat.chat_id,
    currentUserId: currentUser.uid,
    enabled: !!chat.chat_id
  });

  // Typing indicator hook
  const {
    hasTypingUsers,
    typingText,
    handleInputChange,
    stopTyping
  } = useTypingIndicator({
    chatId: chat.chat_id,
    currentUserId: currentUser.uid,
    enabled: !!chat.chat_id
  });

  // Presence hook
  const {
    onlineCount,
    isUserOnline
  } = usePresence({
    chatId: chat.chat_id,
    currentUserId: currentUser.uid,
    enabled: !!chat.chat_id
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatDisplayName = () => {
    if (chat.is_group) {
      return chat.chat_name || 'Group Chat';
    }
    
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUser.uid);
    return otherParticipant?.user?.display_name || 
           otherParticipant?.user?.username || 
           'Unknown User';
  };

  const getChatAvatar = () => {
    if (chat.is_group) {
      return chat.chat_avatar;
    }
    
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUser.uid);
    return otherParticipant?.user?.avatar;
  };

  const getOtherParticipantId = () => {
    if (chat.is_group) return null;
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUser.uid);
    return otherParticipant?.user_id;
  };

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string, mediaSize?: number, mediaDuration?: number) => {
    try {
      // Stop typing indicator when sending message
      stopTyping();
      
      const messageTypeMap: Record<string, 'text' | 'image' | 'video' | 'file' | 'audio'> = {
        'image/': 'image',
        'video/': 'video',
        'audio/': 'audio'
      };

      let messageTypeResult: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text';
      if (mediaUrl && mediaType) {
        messageTypeResult = Object.entries(messageTypeMap).find(([prefix]) => 
          mediaType.startsWith(prefix)
        )?.[1] || 'file';
      }

      await sendMessage(content, messageTypeResult, mediaUrl, mediaType, mediaSize, mediaDuration);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load messages</p>
          <Button onClick={retry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={getChatAvatar()} />
            <AvatarFallback>
              {chat.is_group ? (
                <Users className="h-5 w-5" />
              ) : (
                getChatDisplayName().charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">{getChatDisplayName()}</h3>
              {!chat.is_group && getOtherParticipantId() && (
                <PresenceIndicator 
                  isOnline={isUserOnline(getOtherParticipantId()!)} 
                  size="sm"
                />
              )}
            </div>
            {chat.is_group ? (
              <p className="text-sm text-gray-500">
                {chat.participants_count} members
                {onlineCount > 0 && ` • ${onlineCount} online`}
              </p>
            ) : (
              getOtherParticipantId() && (
                <p className="text-sm text-gray-500">
                  {isUserOnline(getOtherParticipantId()!) ? 'Online' : 'Offline'}
                </p>
              )
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {hasMore && (
          <div className="text-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more messages'}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || 
              prevMessage.sender_id !== message.sender_id ||
              message.created_at - prevMessage.created_at > 300000; // 5 minutes

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUser.uid}
                showAvatar={showAvatar}
                showTimestamp={showAvatar}
              />
            );
          })}
        </div>
        
        {/* Typing Indicator */}
        <TypingIndicator 
          isVisible={hasTypingUsers}
          text={typingText}
        />
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Composer */}
      <div className="border-t bg-white">
        <ChatComposer
          onSendMessage={handleSendMessage}
          onTyping={handleInputChange}
          disabled={false}
        />
      </div>
    </div>
  );
}