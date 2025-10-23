'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'responsive'
  center?: boolean
}

const sizeClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full'
}

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-3',
  md: 'px-3 sm:px-4 lg:px-6',
  lg: 'px-4 sm:px-6 lg:px-8',
  responsive: 'px-responsive'
}

export function ResponsiveContainer({ 
  children, 
  className, 
  size = 'lg',
  padding = 'md',
  center = true
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      center && 'container mx-auto',
      sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8'
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridCols = cn(
    'grid',
    cols.mobile === 1 && 'grid-cols-1',
    cols.mobile === 2 && 'grid-cols-2',
    cols.tablet && cols.tablet === 2 && 'md:grid-cols-2',
    cols.tablet && cols.tablet === 3 && 'md:grid-cols-3',
    cols.desktop && cols.desktop === 2 && 'lg:grid-cols-2',
    cols.desktop && cols.desktop === 3 && 'lg:grid-cols-3',
    cols.desktop && cols.desktop === 4 && 'lg:grid-cols-4',
    gapClasses[gap]
  )

  return (
    <div className={cn(gridCols, className)}>
      {children}
    </div>
  )
}

// Responsive Stack Component
interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    mobile?: 'row' | 'col'
    tablet?: 'row' | 'col'
    desktop?: 'row' | 'col'
  }
  spacing?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

export function ResponsiveStack({ 
  children, 
  className, 
  direction = { mobile: 'col', tablet: 'row', desktop: 'row' },
  spacing = 'md',
  align = 'start',
  justify = 'start'
}: ResponsiveStackProps) {
  const stackClasses = cn(
    'flex',
    // Direction classes
    direction.mobile === 'row' ? 'flex-row' : 'flex-col',
    direction.tablet === 'row' ? 'md:flex-row' : 'md:flex-col',
    direction.desktop === 'row' ? 'lg:flex-row' : 'lg:flex-col',
    // Spacing classes
    spacing === 'sm' && (direction.mobile === 'row' ? 'space-x-2 md:space-x-3' : 'space-y-2 md:space-y-3'),
    spacing === 'md' && (direction.mobile === 'row' ? 'space-x-3 md:space-x-4 lg:space-x-6' : 'space-y-3 md:space-y-4 lg:space-y-6'),
    spacing === 'lg' && (direction.mobile === 'row' ? 'space-x-4 md:space-x-6 lg:space-x-8' : 'space-y-4 md:space-y-6 lg:space-y-8'),
    // Alignment classes
    align === 'start' && 'items-start',
    align === 'center' && 'items-center',
    align === 'end' && 'items-end',
    align === 'stretch' && 'items-stretch',
    // Justify classes
    justify === 'start' && 'justify-start',
    justify === 'center' && 'justify-center',
    justify === 'end' && 'justify-end',
    justify === 'between' && 'justify-between',
    justify === 'around' && 'justify-around'
  )

  return (
    <div className={cn(stackClasses, className)}>
      {children}
    </div>
  )
}

// Breakpoint definitions
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

// Hook for responsive breakpoints with proper SSR handling
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })
  const [deviceInfo, setDeviceInfo] = useState({
    isTouch: false,
    isLandscape: false,
    pixelRatio: 1,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
      setDeviceInfo({
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isLandscape: window.innerWidth > window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
      })
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const isMobile = windowSize.width > 0 && windowSize.width < breakpoints.md
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg
  const isDesktop = windowSize.width >= breakpoints.lg
  const isXs = windowSize.width > 0 && windowSize.width < breakpoints.xs
  const isSm = windowSize.width >= breakpoints.xs && windowSize.width < breakpoints.sm
  const isLg = windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl
  const isXl = windowSize.width >= breakpoints.xl

  return {
    windowSize,
    deviceInfo,
    isMobile,
    isTablet,
    isDesktop,
    isXs,
    isSm,
    isLg,
    isXl,
    // Convenience methods
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
    isTouch: deviceInfo.isTouch,
    isLandscape: deviceInfo.isLandscape,
    isPortrait: !deviceInfo.isLandscape,
    isHighDPI: deviceInfo.pixelRatio > 1,
  }
}

// Hook for media queries
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Responsive visibility component
interface ResponsiveShowProps {
  children: React.ReactNode
  above?: keyof typeof breakpoints
  below?: keyof typeof breakpoints
  only?: keyof typeof breakpoints
}

export function ResponsiveShow({ children, above, below, only }: ResponsiveShowProps) {
  const { windowSize } = useResponsive()

  if (windowSize.width === 0) {
    // SSR fallback - show content by default
    return <>{children}</>
  }

  if (only) {
    const bp = breakpoints[only]
    const nextBp = Object.values(breakpoints).find(val => val > bp) || Infinity
    const shouldShow = windowSize.width >= bp && windowSize.width < nextBp
    return shouldShow ? <>{children}</> : null
  }

  if (above && below) {
    const shouldShow = windowSize.width >= breakpoints[above] && windowSize.width < breakpoints[below]
    return shouldShow ? <>{children}</> : null
  }

  if (above) {
    const shouldShow = windowSize.width >= breakpoints[above]
    return shouldShow ? <>{children}</> : null
  }

  if (below) {
    const shouldShow = windowSize.width < breakpoints[below]
    return shouldShow ? <>{children}</> : null
  }

  return <>{children}</>
}