'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, File, Image, Video, Music } from 'lucide-react';

interface FileUploadProgressProps {
  file: File;
  onCancel: () => void;
  onComplete: (url: string, type: string) => void;
  onError: (error: string) => void;
}

export function FileUploadProgress({ 
  file, 
  onCancel, 
  onComplete, 
  onError 
}: FileUploadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file, preview]);

  const uploadFile = async () => {
    setUploading(true);
    setProgress(0);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;

      // Upload file (simulate progress for now)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      onComplete(urlData.publicUrl, file.type);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (file.type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex items-start space-x-3">
        {/* File Preview/Icon */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={uploading}
              className="flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-600">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          ) : (
            <Button
              onClick={uploadFile}
              size="sm"
              className="w-full"
            >
              Upload File
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}