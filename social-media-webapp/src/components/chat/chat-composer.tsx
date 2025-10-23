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
import { VoiceRecorder } from './voice-recorder';
import { FileUploadProgress } from './file-upload-progress';

interface ChatComposerProps {
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: string, mediaSize?: number, mediaDuration?: number) => void;
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { progress: number; url?: string; type?: string; size?: number }>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if ((!message.trim() && uploadingFiles.size === 0) || disabled) return;

    try {
      // Send text message if there's content
      if (message.trim()) {
        await onSendMessage(message.trim());
      }

      // Send uploaded files
      for (const [, fileData] of uploadingFiles) {
        if (fileData.url) {
          await onSendMessage('', fileData.url, fileData.type, fileData.size);
        }
      }
      
      // Reset form
      setMessage('');
      setUploadingFiles(new Map());
      setShowEmojiPicker(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileUploadComplete = (url: string, type: string, size: number) => {
    setUploadingFiles(prev => {
      const updated = new Map(prev);
      const fileId = `${url}-${Date.now()}`;
      updated.set(fileId, { progress: 100, url, type, size });
      return updated;
    });
  };

  const handleFileUploadError = (error: string) => {
    console.error('File upload error:', error);
  };

  const handleFileUploadCancel = () => {
    setPendingFiles([]);
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const fileName = `voice-${Date.now()}.webm`;
      const filePath = `chat-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      await onSendMessage('Voice message', urlData.publicUrl, 'audio/webm', audioBlob.size, duration);
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
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

  const toggleVoiceRecorder = () => {
    setShowVoiceRecorder(!showVoiceRecorder);
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

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSendVoiceMessage={handleVoiceMessage}
          onCancel={() => setShowVoiceRecorder(false)}
          disabled={disabled}
        />
      )}

      {/* File Upload Progress */}
      {pendingFiles.map((file) => {
        return (
          <FileUploadProgress
            key={file.name + file.size}
            file={file}
            onComplete={(url, type) => handleFileUploadComplete(url, type, file.size)}
            onError={handleFileUploadError}
            onCancel={handleFileUploadCancel}
          />
        );
      })}

      {/* Uploaded Files Preview */}
      {Array.from(uploadingFiles.entries()).map(([uploadId, fileData]) => (
        fileData.url && (
          <div key={uploadId} className="p-3 border-b bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {fileData.type?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={fileData.url}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                      <File className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-700">Ready to send</p>
                  <p className="text-xs text-green-600">{formatFileSize(fileData.size || 0)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileUploadCancel}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      ))}

      {/* Composer */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment Button */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Voice/Send Button */}
          <div className="flex-shrink-0">
            {message.trim() || uploadingFiles.size > 0 ? (
              <Button
                onClick={handleSend}
                disabled={disabled}
                size="sm"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoiceRecorder}
                disabled={disabled}
                className={cn(
                  "h-10 w-10 p-0 rounded-full",
                  showVoiceRecorder && "bg-red-500 text-white"
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