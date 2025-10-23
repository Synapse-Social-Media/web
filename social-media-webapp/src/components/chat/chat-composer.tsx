'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  Mic,
  X,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import { createClient } from '@/lib/supabase/client';

interface ChatComposerProps {
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({ 
  onSendMessage, 
  onTyping,
  disabled = false,
  placeholder = "Type a message..." 
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const handleSend = async () => {
    if ((!message.trim() && !attachedFile) || disabled || uploading) return;

    try {
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;

      // Upload file if attached
      if (attachedFile) {
        setUploading(true);
        
        const fileExt = attachedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
        mediaType = attachedFile.type;
      }

      // Send message
      await onSendMessage(message.trim() || attachedFile?.name || '', mediaUrl, mediaType);
      
      // Reset form
      setMessage('');
      setAttachedFile(null);
      setShowEmojiPicker(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const startRecording = () => {
    // TODO: Implement voice recording
    setIsRecording(true);
  };

  const stopRecording = () => {
    // TODO: Implement voice recording
    setIsRecording(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
          />
        </div>
      )}

      {/* File Preview */}
      {attachedFile && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {attachedFile.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={URL.createObjectURL(attachedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <File className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeAttachedFile}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment Button */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="h-10 w-10 p-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          {/* Image Button */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || uploading}
              className="h-10 w-10 p-0"
            >
              <Image className="h-5 w-5" />
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
                onTyping?.();
              }}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || uploading}
              className={cn(
                "min-h-[40px] max-h-[120px] resize-none pr-12",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
              rows={1}
            />
            
            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled || uploading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Voice/Send Button */}
          <div className="flex-shrink-0">
            {message.trim() || attachedFile ? (
              <Button
                onClick={handleSend}
                disabled={disabled || uploading}
                size="sm"
                className="h-10 w-10 p-0 rounded-full"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                disabled={disabled}
                className={cn(
                  "h-10 w-10 p-0 rounded-full",
                  isRecording && "bg-red-500 text-white"
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*"
      />
    </div>
  );
}