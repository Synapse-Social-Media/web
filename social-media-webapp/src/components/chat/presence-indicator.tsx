'use client';

import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  text?: string;
}

export function PresenceIndicator({ 
  isOnline, 
  size = 'md', 
  className,
  showText = false,
  text
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (showText) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className={cn(
          "rounded-full border-2 border-white",
          sizeClasses[size],
          isOnline ? "bg-green-500" : "bg-gray-400"
        )} />
        <span className={cn(
          textSizeClasses[size],
          isOnline ? "text-green-600" : "text-gray-500"
        )}>
          {text || (isOnline ? 'Online' : 'Offline')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full border-2 border-white",
      sizeClasses[size],
      isOnline ? "bg-green-500" : "bg-gray-400",
      className
    )} />
  );
}