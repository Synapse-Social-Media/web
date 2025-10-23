'use client';

import { MessageWithSender } from '@/lib/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Reply, 
  Heart, 
  Download,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  showTimestamp 
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const renderMediaContent = () => {
    if (!message.media_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={message.media_url}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // TODO: Open image in full screen viewer
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'video':
        return (
          <div className="relative group max-w-xs">
            <video
              src={message.media_url}
              className="rounded-lg cursor-pointer"
              controls
              preload="metadata"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 max-w-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {message.media_duration ? `${Math.floor(message.media_duration / 60)}:${(message.media_duration % 60).toString().padStart(2, '0')}` : 'Audio message'}
              </p>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 max-w-xs">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {message.media_type?.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.content || 'File attachment'}
              </p>
              <p className="text-xs text-gray-600">
                {message.media_size ? `${(message.media_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex items-end space-x-2 group",
        isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback>
            {message.sender?.display_name?.charAt(0) || 
             message.sender?.username?.charAt(0) || 
             'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer for alignment when no avatar */}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-xs lg:max-w-md",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name for group chats */}
        {showAvatar && !isOwn && (
          <p className="text-xs text-gray-600 mb-1 px-3">
            {message.sender?.display_name || message.sender?.username}
          </p>
        )}

        {/* Message bubble */}
        <div className={cn(
          "relative rounded-2xl px-4 py-2 max-w-full break-words",
          isOwn 
            ? "bg-blue-500 text-white rounded-br-md" 
            : "bg-gray-100 text-gray-900 rounded-bl-md",
          message.message_type !== 'text' && "p-2"
        )}>
          {/* Media content */}
          {renderMediaContent()}
          
          {/* Text content */}
          {message.content && message.message_type === 'text' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Message status indicators */}
          {isOwn && (
            <div className="flex items-center justify-end mt-1 space-x-1">
              <span className="text-xs opacity-70">
                {formatTimestamp(message.created_at)}
              </span>
              {message.delivery_status === 'read' && (
                <div className="w-3 h-3 rounded-full bg-white/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp for received messages */}
        {showTimestamp && !isOwn && (
          <p className="text-xs text-gray-500 mt-1 px-3">
            {formatTimestamp(message.created_at)}
          </p>
        )}
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className={cn(
          "flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}