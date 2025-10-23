'use client'

import { cn } from '@/lib/utils'
import { ResponsiveContainer, ResponsiveGrid, ResponsiveStack, ResponsiveShow } from './responsive-container'

// Adaptive Card Component
interface AdaptiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function AdaptiveCard({ 
  children, 
  className, 
  padding = 'md',
  hover = true 
}: AdaptiveCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div className={cn(
      'bg-card border rounded-lg mobile-card transition-all duration-200',
      paddingClasses[padding],
      hover && 'desktop-hover cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

// Responsive Feed Layout
interface ResponsiveFeedLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  rightPanel?: React.ReactNode
  className?: string
}

export function ResponsiveFeedLayout({ 
  children, 
  sidebar, 
  rightPanel, 
  className 
}: ResponsiveFeedLayoutProps) {
  return (
    <ResponsiveContainer size="full" className={cn('min-h-screen', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Sidebar - Hidden on mobile */}
        {sidebar && (
          <ResponsiveShow above="lg">
            <aside className="lg:col-span-3 xl:col-span-2">
              {sidebar}
            </aside>
          </ResponsiveShow>
        )}
        
        {/* Main Content */}
        <main className={cn(
          'col-span-1',
          sidebar && rightPanel ? 'lg:col-span-6 xl:col-span-8' : 
          sidebar ? 'lg:col-span-9 xl:col-span-10' :
          rightPanel ? 'lg:col-span-9 xl:col-span-10' : 'lg:col-span-12'
        )}>
          {children}
        </main>
        
        {/* Right Panel - Hidden on mobile and tablet */}
        {rightPanel && (
          <ResponsiveShow above="xl">
            <aside className="xl:col-span-2">
              {rightPanel}
            </aside>
          </ResponsiveShow>
        )}
      </div>
    </ResponsiveContainer>
  )
}

// Responsive Modal/Dialog Layout
interface ResponsiveModalProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ResponsiveModal({ children, className, size = 'md' }: ResponsiveModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md lg:max-w-lg',
    lg: 'max-w-lg lg:max-w-2xl',
    xl: 'max-w-xl lg:max-w-4xl',
    full: 'max-w-full lg:max-w-6xl'
  }

  return (
    <div className={cn(
      'w-full mx-auto p-4 sm:p-6',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive Image Component
interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall'
  sizes?: string
}

export function ResponsiveImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'square',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: ResponsiveImageProps) {
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
        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </div>
  )
}

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small'
  className?: string
}

export function ResponsiveText({ children, variant = 'body', className }: ResponsiveTextProps) {
  const variantClasses = {
    h1: 'text-responsive-xl font-bold',
    h2: 'text-responsive-lg font-semibold',
    h3: 'text-responsive-base font-semibold',
    h4: 'text-responsive-sm font-medium',
    body: 'text-responsive-sm',
    caption: 'text-responsive-xs text-muted-foreground',
    small: 'text-xs text-muted-foreground'
  }

  if (variant === 'h1') {
    return <h1 className={cn(variantClasses[variant], className)}>{children}</h1>
  }
  if (variant === 'h2') {
    return <h2 className={cn(variantClasses[variant], className)}>{children}</h2>
  }
  if (variant === 'h3') {
    return <h3 className={cn(variantClasses[variant], className)}>{children}</h3>
  }
  if (variant === 'h4') {
    return <h4 className={cn(variantClasses[variant], className)}>{children}</h4>
  }

  return (
    <p className={cn(variantClasses[variant], className)}>
      {children}
    </p>
  )
}

// Responsive Button Group
interface ResponsiveButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical' | 'adaptive'
  spacing?: 'sm' | 'md' | 'lg'
}

export function ResponsiveButtonGroup({ 
  children, 
  className, 
  orientation = 'adaptive',
  spacing = 'md'
}: ResponsiveButtonGroupProps) {
  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col',
    adaptive: 'flex flex-col sm:flex-row'
  }

  const spacingClasses = {
    sm: orientation === 'adaptive' ? 'space-y-2 sm:space-y-0 sm:space-x-2' : 
        orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'adaptive' ? 'space-y-3 sm:space-y-0 sm:space-x-3' : 
        orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    lg: orientation === 'adaptive' ? 'space-y-4 sm:space-y-0 sm:space-x-4' : 
        orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
  }

  return (
    <div className={cn(
      orientationClasses[orientation],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive List Component
interface ResponsiveListProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'spacious'
  dividers?: boolean
}

export function ResponsiveList({ 
  children, 
  className, 
  variant = 'default',
  dividers = true 
}: ResponsiveListProps) {
  const variantClasses = {
    default: 'space-y-2 sm:space-y-3',
    compact: 'space-y-1 sm:space-y-2',
    spacious: 'space-y-4 sm:space-y-6'
  }

  return (
    <div className={cn(
      variantClasses[variant],
      dividers && 'divide-y divide-border',
      className
    )}>
      {children}
    </div>
  )
}

// Export all components
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveShow
}