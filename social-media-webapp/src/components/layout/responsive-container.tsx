'use client'

import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full'
}

export function ResponsiveContainer({ 
  children, 
  className, 
  size = 'lg' 
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      'container mx-auto px-3 sm:px-4 lg:px-6',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}

// Hook for responsive breakpoints
export function useResponsive() {
  // This would typically use a media query hook in a real app
  // For now, we'll return static values since we're focusing on CSS-based responsive design
  return {
    isMobile: false, // Would be determined by window.innerWidth < 768
    isTablet: false, // Would be determined by window.innerWidth >= 768 && window.innerWidth < 1024
    isDesktop: true, // Would be determined by window.innerWidth >= 1024
  }
}