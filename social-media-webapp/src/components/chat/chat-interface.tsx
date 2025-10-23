'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWithParticipants, User } from '@/lib/types/chat';
import { ChatList } from './chat-list';
import { ChatWindow } from './chat-window';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  currentUser: User;
  className?: string;
}

export function ChatInterface({ currentUser, className }: ChatInterfaceProps) {
  const [selectedChat, setSelectedChat] = useState<ChatWithParticipants | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('uid, username, display_name, avatar')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('uid', currentUser.uid)
        .limit(10);

      if (error) throw error;
      setSearchResults((data || []).map(user => ({
        ...user,
        id: user.uid,
        email: '',
        biography: '',
        profile_cover_image: '',
        account_premium: false,
        verify: false,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        created_at: '',
        updated_at: ''
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDirectChat = async (otherUser: User) => {
    try {
      // Check if chat already exists
      const { data: userChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.uid);

      if (!userChats || userChats.length === 0) {
        // No existing chats, create new one
      } else {
        // Get chat details for direct chats only
        const chatIds = userChats.map(uc => uc.chat_id);
        const { data: existingChats } = await supabase
          .from('chats')
          .select('*')
          .in('chat_id', chatIds)
          .eq('is_group', false);

        if (existingChats && existingChats.length > 0) {
          // Check if any of these chats include the other user
          for (const chat of existingChats) {
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.chat_id)
              .eq('user_id', otherUser.uid)
              .single();

            if (otherParticipant) {
              // Chat exists, select it
              const chatWithParticipants: ChatWithParticipants = {
                ...chat,
                participants: [
                  {
                    id: '',
                    chat_id: chat.chat_id,
                    user_id: currentUser.uid,
                    role: 'member',
                    joined_at: '',
                    is_admin: false,
                    can_send_messages: true,
                    notification_settings: { muted: false, sound: true },
                    user: currentUser
                  },
                  {
                    id: '',
                    chat_id: chat.chat_id,
                    user_id: otherUser.uid,
                    role: 'member',
                    joined_at: '',
                    is_admin: false,
                    can_send_messages: true,
                    notification_settings: { muted: false, sound: true },
                    user: otherUser
                  }
                ]
              };
              setSelectedChat(chatWithParticipants);
              setShowNewChatDialog(false);
              return;
            }
          }
        }
      }

      // Create new chat
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: chatError } = await supabase
        .from('chats')
        .insert([{
          chat_id: chatId,
          is_group: false,
          created_by: currentUser.uid,
          participants_count: 2,
          is_active: true
        }]);

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          {
            chat_id: chatId,
            user_id: currentUser.uid,
            role: 'member',
            is_admin: false,
            can_send_messages: true
          },
          {
            chat_id: chatId,
            user_id: otherUser.uid,
            role: 'member',
            is_admin: false,
            can_send_messages: true
          }
        ]);

      if (participantsError) throw participantsError;

      // Create chat object for selection
      const newChat: ChatWithParticipants = {
        id: '',
        chat_id: chatId,
        is_group: false,
        created_by: currentUser.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants_count: 2,
        is_active: true,
        participants: [
          {
            id: '',
            chat_id: chatId,
            user_id: currentUser.uid,
            role: 'member',
            joined_at: new Date().toISOString(),
            is_admin: false,
            can_send_messages: true,
            notification_settings: { muted: false, sound: true },
            user: currentUser
          },
          {
            id: '',
            chat_id: chatId,
            user_id: otherUser.uid,
            role: 'member',
            joined_at: new Date().toISOString(),
            is_admin: false,
            can_send_messages: true,
            notification_settings: { muted: false, sound: true },
            user: otherUser
          }
        ]
      };

      setSelectedChat(newChat);
      setShowNewChatDialog(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className={cn("flex h-full bg-white rounded-lg overflow-hidden", className)}>
      {/* Chat List - Hidden on mobile when chat is selected */}
      <div className={cn(
        "w-full md:w-80 border-r flex-shrink-0",
        isMobile && selectedChat && "hidden"
      )}>
        <ChatList
          currentUserId={currentUser.uid}
          selectedChatId={selectedChat?.chat_id}
          onChatSelect={setSelectedChat}
          onNewChat={() => setShowNewChatDialog(true)}
        />
      </div>

      {/* Chat Window - Hidden on mobile when no chat is selected */}
      <div className={cn(
        "flex-1 flex flex-col",
        isMobile && !selectedChat && "hidden"
      )}>
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUser={currentUser}
            onBack={isMobile ? handleBackToList : undefined}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-4">
                Choose a conversation from the list to start messaging
              </p>
              <Button onClick={() => setShowNewChatDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start new conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start new conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchQuery ? 'No users found' : 'Start typing to search users'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => createDirectChat(user)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.display_name || user.username}
                        </p>
                        {user.username && user.display_name && (
                          <p className="text-sm text-gray-500 truncate">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}