// Comprehensive responsive utilities for the social media app

import { breakpoints } from './responsive'

// Responsive class generator
export function generateResponsiveClasses(
  baseClasses: string,
  responsiveOverrides: Partial<Record<keyof typeof breakpoints, string>>
): string {
  let classes = baseClasses
  
  Object.entries(responsiveOverrides).forEach(([breakpoint, override]) => {
    if (breakpoint === 'xs') {
      classes += ` xs:${override}`
    } else {
      classes += ` ${breakpoint}:${override}`
    }
  })
  
  return classes
}

// Touch-friendly size calculator
export function getTouchFriendlySize(baseSize: number, isTouch: boolean): number {
  return isTouch ? Math.max(baseSize, 44) : baseSize
}

// Responsive spacing calculator
export function getResponsiveSpacing(
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  isMobile: boolean
): string {
  const mobileSpacing = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }
  
  const desktopSpacing = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6'
  }
  
  return isMobile ? mobileSpacing[size] : desktopSpacing[size]
}

// Adaptive grid columns
export function getAdaptiveGridCols(
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3
): string {
  let classes = `grid-cols-${mobile}`
  
  if (tablet !== mobile) {
    classes += ` md:grid-cols-${tablet}`
  }
  
  if (desktop !== tablet) {
    classes += ` lg:grid-cols-${desktop}`
  }
  
  return classes
}

// Responsive text size
export function getResponsiveTextSize(
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl',
  isMobile: boolean
): string {
  const mobileText = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  
  const desktopText = {
    xs: 'text-sm',
    sm: 'text-base',
    base: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }
  
  return isMobile ? mobileText[size] : desktopText[size]
}

// Device capability detection
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return {
      hasTouch: false,
      hasHover: false,
      hasPointer: false,
      supportsWebP: false,
      supportsAvif: false,
      prefersReducedMotion: false,
      prefersDarkMode: false,
      prefersHighContrast: false
    }
  }
  
  return {
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasHover: window.matchMedia('(hover: hover)').matches,
    hasPointer: window.matchMedia('(pointer: fine)').matches,
    supportsWebP: (() => {
      const canvas = document.createElement('canvas')
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    })(),
    supportsAvif: (() => {
      const canvas = document.createElement('canvas')
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
    })(),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches
  }
}

// Responsive image source generator
export function getResponsiveImageSrc(
  baseSrc: string,
  width: number,
  devicePixelRatio: number = 1
): string {
  const actualWidth = Math.ceil(width * devicePixelRatio)
  
  // If using a CDN or image service, append width parameter
  if (baseSrc.includes('supabase') || baseSrc.includes('cloudinary')) {
    const separator = baseSrc.includes('?') ? '&' : '?'
    return `${baseSrc}${separator}w=${actualWidth}&q=80&f=auto`
  }
  
  return baseSrc
}

// Responsive container query helper
export function getContainerQuery(minWidth: number): string {
  return `@container (min-width: ${minWidth}px)`
}

// Adaptive layout helper
export function getAdaptiveLayout(
  isMobile: boolean,
  isTablet: boolean,
  _isDesktop: boolean
): {
  containerClass: string
  gridClass: string
  spacingClass: string
  textClass: string
} {
  if (isMobile) {
    return {
      containerClass: 'max-w-full px-4',
      gridClass: 'grid-cols-1 gap-4',
      spacingClass: 'space-y-4',
      textClass: 'text-sm'
    }
  }
  
  if (isTablet) {
    return {
      containerClass: 'max-w-4xl px-6',
      gridClass: 'grid-cols-2 gap-6',
      spacingClass: 'space-y-6',
      textClass: 'text-base'
    }
  }
  
  // Desktop layout (default)
  return {
    containerClass: 'max-w-6xl px-8',
    gridClass: 'grid-cols-3 gap-8',
    spacingClass: 'space-y-8',
    textClass: 'text-lg'
  }
}

// Performance-optimized responsive image sizes
export function getOptimizedImageSizes(
  maxWidth?: number
): string {
  const sizes = []
  
  // Mobile sizes
  sizes.push('(max-width: 475px) 100vw')
  sizes.push('(max-width: 640px) 100vw')
  
  // Tablet sizes
  sizes.push('(max-width: 768px) 50vw')
  sizes.push('(max-width: 1024px) 33vw')
  
  // Desktop sizes
  if (maxWidth) {
    sizes.push(`${maxWidth}px`)
  } else {
    sizes.push('25vw')
  }
  
  return sizes.join(', ')
}

// Accessibility-aware responsive utilities
export function getA11yResponsiveClasses(
  prefersReducedMotion: boolean,
  prefersHighContrast: boolean
): string {
  let classes = ''
  
  if (prefersReducedMotion) {
    classes += ' motion-reduce:transition-none motion-reduce:animate-none'
  }
  
  if (prefersHighContrast) {
    classes += ' high-contrast:border-2 high-contrast:border-current'
  }
  
  return classes
}

export default {
  generateResponsiveClasses,
  getTouchFriendlySize,
  getResponsiveSpacing,
  getAdaptiveGridCols,
  getResponsiveTextSize,
  getDeviceCapabilities,
  getResponsiveImageSrc,
  getContainerQuery,
  getAdaptiveLayout,
  getOptimizedImageSizes,
  getA11yResponsiveClasses
}