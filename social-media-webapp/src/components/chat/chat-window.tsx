'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWithParticipants, MessageWithSender, User } from '@/lib/types/chat';
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
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (chat.chat_id) {
      loadMessages();
      subscribeToMessages();
    }
  }, [chat.chat_id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (before?: number) => {
    try {
      if (!before) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
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
        .eq('chat_id', chat.chat_id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) throw error;

      const messagesWithSender = (data || []).map(msg => ({
        ...msg,
        sender: msg.sender
      }));

      if (before) {
        setMessages(prev => [...messagesWithSender.reverse(), ...prev]);
      } else {
        setMessages(messagesWithSender.reverse());
      }

      setHasMore((data || []).length === 50);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${chat.chat_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.chat_id}`
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: messageWithSender } = await supabase
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

          if (messageWithSender) {
            setMessages(prev => [...prev, {
              ...messageWithSender,
              sender: messageWithSender.sender
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = () => {
    if (messages.length > 0 && hasMore && !loadingMore) {
      loadMessages(messages[0]?.created_at);
    }
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

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const messageData = {
        chat_id: chat.chat_id,
        sender_id: currentUser.uid,
        content,
        message_type: mediaUrl ? (mediaType?.startsWith('image/') ? 'image' : 'file') : 'text',
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      // Update chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_time: Date.now(),
          last_message_sender: currentUser.uid,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chat.chat_id);

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
            <h3 className="font-medium">{getChatDisplayName()}</h3>
            {chat.is_group && (
              <p className="text-sm text-gray-500">
                {chat.participants_count} members
              </p>
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
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Composer */}
      <div className="border-t bg-white">
        <ChatComposer
          onSendMessage={handleSendMessage}
          disabled={false}
        />
      </div>
    </div>
  );
}