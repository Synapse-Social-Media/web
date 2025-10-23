'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWithParticipants } from '@/lib/types/chat';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Users } from 'lucide-react';
import { useUnreadMessages } from '@/lib/hooks/use-unread-messages';
import { PresenceIndicator } from '@/components/chat/presence-indicator';
import { cn } from '@/lib/utils';

interface ChatListProps {
  currentUserId: string;
  selectedChatId?: string;
  onChatSelect: (chat: ChatWithParticipants) => void;
  onNewChat: () => void;
}

export function ChatList({ 
  currentUserId, 
  selectedChatId, 
  onChatSelect, 
  onNewChat 
}: ChatListProps) {
  const [chats, setChats] = useState<ChatWithParticipants[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Unread messages hook
  const {
    getUnreadCount,
    hasUnreadMessages,
    markChatAsRead,
    totalUnread
  } = useUnreadMessages({
    userId: currentUserId,
    enabled: !!currentUserId
  });

  useEffect(() => {
    loadChats();
  }, [currentUserId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      // Get chats where user is a participant
      const { data: userChats, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (participantsError) throw participantsError;

      const chatIds = (userChats || []).map(cp => cp.chat_id);
      
      if (chatIds.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Get chat details
      const { data: chatDetails, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('chat_id', chatIds);

      if (chatsError) throw chatsError;

      // Get all participants for each chat
      const { data: allParticipants, error: allParticipantsError } = await supabase 
       .from('chat_participants')
        .select(`
          chat_id,
          user_id,
          role,
          is_admin,
          users (
            uid,
            username,
            display_name,
            avatar
          )
        `)
        .in('chat_id', chatIds);

      if (allParticipantsError) throw allParticipantsError;

      // Group participants by chat_id
      const participantsByChat = (allParticipants || []).reduce((acc, participant) => {
        if (!participant?.chat_id || !participant.users) return acc;
        
        if (!acc[participant.chat_id]) {
          acc[participant.chat_id] = [];
        }
        const user = Array.isArray(participant.users) ? participant.users[0] : participant.users as any;
        // @ts-ignore - Supabase relation handling
        acc[participant.chat_id].push({
          ...participant,
          user: user
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Combine chats with their participants
      const chatsWithParticipants: ChatWithParticipants[] = (chatDetails || []).map(chat => ({
        ...chat,
        participants: participantsByChat[chat.chat_id] || []
      }));

      // Sort by last message time
      chatsWithParticipants.sort((a, b) => 
        (b.last_message_time || 0) - (a.last_message_time || 0)
      );

      setChats(chatsWithParticipants);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by chat name for group chats
    if (chat.is_group && chat.chat_name) {
      return chat.chat_name.toLowerCase().includes(query);
    }
    
    // Search by participant names for direct chats
    return chat.participants.some(participant => 
      participant.user?.username?.toLowerCase().includes(query) ||
      participant.user?.display_name?.toLowerCase().includes(query)
    );
  });

  const getChatDisplayName = (chat: ChatWithParticipants) => {
    if (chat.is_group) {
      return chat.chat_name || 'Group Chat';
    }
    
    // For direct chats, show the other participant's name
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUserId);
    return otherParticipant?.user?.display_name || 
           otherParticipant?.user?.username || 
           'Unknown User';
  };

  const getChatAvatar = (chat: ChatWithParticipants) => {
    if (chat.is_group) {
      return chat.chat_avatar;
    }
    
    // For direct chats, show the other participant's avatar
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUserId);
    return otherParticipant?.user?.avatar;
  };

  const formatLastMessageTime = (timestamp?: number) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">Messages</h2>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </div>
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onChatSelect(chat);
                  // Mark chat as read when selected
                  if (hasUnreadMessages(chat.chat_id)) {
                    markChatAsRead(chat.chat_id);
                  }
                }}
                className={cn(
                  "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                  selectedChatId === chat.chat_id && "bg-blue-50 border-r-2 border-blue-500"
                )}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getChatAvatar(chat)} />
                      <AvatarFallback>
                        {chat.is_group ? (
                          <Users className="h-6 w-6" />
                        ) : (
                          getChatDisplayName(chat).charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Unread badge */}
                    {hasUnreadMessages(chat.chat_id) && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full"
                      >
                        {getUnreadCount(chat.chat_id)}
                      </Badge>
                    )}
                    
                    {/* Group member count or online indicator */}
                    {chat.is_group ? (
                      <Badge 
                        variant="secondary" 
                        className="absolute -bottom-1 -right-1 text-xs px-1"
                      >
                        {chat.participants_count}
                      </Badge>
                    ) : (
                      <div className="absolute -bottom-1 -right-1">
                        <PresenceIndicator 
                          isOnline={false} // TODO: Implement presence for chat list
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "font-medium truncate",
                        hasUnreadMessages(chat.chat_id) && "font-semibold"
                      )}>
                        {getChatDisplayName(chat)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatLastMessageTime(chat.last_message_time)}
                      </span>
                    </div>
                    
                    {chat.last_message && (
                      <p className={cn(
                        "text-sm truncate mt-1",
                        hasUnreadMessages(chat.chat_id) 
                          ? "text-gray-900 font-medium" 
                          : "text-gray-600"
                      )}>
                        {chat.last_message_sender === currentUserId ? 'You: ' : ''}
                        {chat.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}