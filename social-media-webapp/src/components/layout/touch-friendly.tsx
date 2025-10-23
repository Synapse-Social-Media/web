'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useResponsive } from './responsive-container'

// Touch-friendly button wrapper
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ children, className, size = 'md', variant = 'default', ...props }, ref) => {
    const { isTouch } = useResponsive()
    
    const sizeClasses = {
      sm: isTouch ? 'min-h-[44px] min-w-[44px] px-3 py-2' : 'min-h-[36px] px-2 py-1',
      md: isTouch ? 'min-h-[48px] min-w-[48px] px-4 py-3' : 'min-h-[40px] px-3 py-2',
      lg: isTouch ? 'min-h-[52px] min-w-[52px] px-6 py-4' : 'min-h-[44px] px-4 py-3'
    }
    
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          'touch-manipulation select-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

TouchButton.displayName = 'TouchButton'

// Touch-friendly link wrapper
interface TouchLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const TouchLink = forwardRef<HTMLAnchorElement, TouchLinkProps>(
  ({ children, className, size = 'md', ...props }, ref) => {
    const { isTouch } = useResponsive()
    
    const sizeClasses = {
      sm: isTouch ? 'min-h-[44px] px-3 py-2' : 'min-h-[36px] px-2 py-1',
      md: isTouch ? 'min-h-[48px] px-4 py-3' : 'min-h-[40px] px-3 py-2',
      lg: isTouch ? 'min-h-[52px] px-6 py-4' : 'min-h-[44px] px-4 py-3'
    }
    
    return (
      <a
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          'hover:bg-accent hover:text-accent-foreground active:scale-95',
          'touch-manipulation select-none',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)

TouchLink.displayName = 'TouchLink'

// Touch-friendly input wrapper
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const { isTouch } = useResponsive()
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'touch-manipulation',
            isTouch ? 'min-h-[48px] text-base' : 'min-h-[40px] text-sm', // Prevent iOS zoom
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

TouchInput.displayName = 'TouchInput'

// Responsive scroll container
interface ResponsiveScrollProps {
  children: React.ReactNode
  className?: string
  direction?: 'vertical' | 'horizontal' | 'both'
}

export function ResponsiveScroll({ 
  children, 
  className, 
  direction = 'vertical' 
}: ResponsiveScrollProps) {
  const { isTouch } = useResponsive()
  
  const scrollClasses = {
    vertical: 'overflow-y-auto overflow-x-hidden',
    horizontal: 'overflow-x-auto overflow-y-hidden',
    both: 'overflow-auto'
  }
  
  return (
    <div
      className={cn(
        scrollClasses[direction],
        isTouch && 'mobile-scroll', // Smooth scrolling on touch devices
        'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        className
      )}
    >
      {children}
    </div>
  )
}

// Adaptive spacing component
interface AdaptiveSpacingProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  direction?: 'x' | 'y' | 'all'
  className?: string
}

export function AdaptiveSpacing({ 
  children, 
  size = 'md', 
  direction = 'all',
  className 
}: AdaptiveSpacingProps) {
  const { isMobile } = useResponsive()
  
  const spacingMap = {
    xs: isMobile ? 'p-2' : 'p-1',
    sm: isMobile ? 'p-3' : 'p-2',
    md: isMobile ? 'p-4' : 'p-3',
    lg: isMobile ? 'p-6' : 'p-4',
    xl: isMobile ? 'p-8' : 'p-6'
  }
  
  const directionMap = {
    x: spacingMap[size].replace('p-', 'px-'),
    y: spacingMap[size].replace('p-', 'py-'),
    all: spacingMap[size]
  }
  
  return (
    <div className={cn(directionMap[direction], className)}>
      {children}
    </div>
  )
}

// Device-aware image component
interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall'
  loading?: 'lazy' | 'eager'
  sizes?: string
}

export function ResponsiveImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'square',
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: ResponsiveImageProps) {
  const { isHighDPI, isMobile } = useResponsive()
  
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[16/9]',
    tall: 'aspect-[3/4]'
  }
  
  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg bg-muted',
      aspectClasses[aspectRatio],
      className
    )}>
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={loading}
        className={cn(
          'object-cover w-full h-full transition-transform duration-300',
          !isMobile && 'hover:scale-105', // Only add hover effect on non-touch devices
          isHighDPI && 'image-rendering-crisp-edges' // Better rendering on high DPI
        )}
      />
    </div>
  )
}