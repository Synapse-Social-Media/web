'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  text: string;
  className?: string;
}

export function TypingIndicator({ isVisible, text, className }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 animate-fade-in",
      className
    )}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{text}</span>
    </div>
  );
}