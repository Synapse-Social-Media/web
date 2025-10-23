// Responsive breakpoint configuration and utilities

export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export type Breakpoint = keyof typeof breakpoints

// Responsive configuration for different components
export const responsiveConfig = {
  // Container max widths
  container: {
    xs: 'max-w-xs',
    sm: 'max-w-sm', 
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  },
  
  // Grid columns for different breakpoints
  grid: {
    mobile: {
      1: 'grid-cols-1',
      2: 'grid-cols-2'
    },
    tablet: {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2', 
      3: 'md:grid-cols-3'
    },
    desktop: {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6'
    }
  },
  
  // Spacing scales
  spacing: {
    xs: {
      x: 'space-x-1 sm:space-x-2',
      y: 'space-y-1 sm:space-y-2'
    },
    sm: {
      x: 'space-x-2 sm:space-x-3',
      y: 'space-y-2 sm:space-y-3'
    },
    md: {
      x: 'space-x-3 sm:space-x-4 lg:space-x-6',
      y: 'space-y-3 sm:space-y-4 lg:space-y-6'
    },
    lg: {
      x: 'space-x-4 sm:space-x-6 lg:space-x-8',
      y: 'space-y-4 sm:space-y-6 lg:space-y-8'
    }
  },
  
  // Padding scales
  padding: {
    none: '',
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    responsive: 'p-responsive'
  },
  
  // Text sizes
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    responsive: {
      xs: 'text-responsive-xs',
      sm: 'text-responsive-sm', 
      base: 'text-responsive-base',
      lg: 'text-responsive-lg',
      xl: 'text-responsive-xl'
    }
  },
  
  // Touch targets
  touch: {
    small: 'min-h-[40px] min-w-[40px]',
    medium: 'min-h-[44px] min-w-[44px]',
    large: 'min-h-[48px] min-w-[48px]'
  },
  
  // Interaction states
  interaction: {
    hover: 'hover:bg-accent hover:text-accent-foreground transition-colors duration-200',
    active: 'active:scale-95 active:bg-accent/50 transition-transform duration-100',
    focus: 'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
    disabled: 'disabled:opacity-50 disabled:pointer-events-none'
  },
  
  // Animation preferences
  animation: {
    reduced: 'motion-reduce:transition-none motion-reduce:animate-none',
    smooth: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-100 ease-out',
    slow: 'transition-all duration-300 ease-in-out'
  },
  
  // Layout utilities
  layout: {
    center: 'flex items-center justify-center',
    stack: 'flex flex-col',
    row: 'flex flex-row',
    between: 'flex items-center justify-between',
    around: 'flex items-center justify-around',
    stretch: 'flex items-stretch'
  }
} as const

// Media query strings for JavaScript usage
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Max width queries
  maxXs: `(max-width: ${breakpoints.xs - 1}px)`,
  maxSm: `(max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `(max-width: ${breakpoints.md - 1}px)`,
  maxLg: `(max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `(max-width: ${breakpoints.xl - 1}px)`,
  
  // Range queries
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  
  // Orientation queries
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  
  // Device specific
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
  
  // Accessibility
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)'
} as const

// Utility functions for responsive design
export const responsive = {
  // Get responsive classes for a given property
  getClasses: (property: keyof typeof responsiveConfig, size: string) => {
    return responsiveConfig[property]?.[size as keyof typeof responsiveConfig[typeof property]] || ''
  },
  
  // Check if current viewport matches breakpoint
  matches: (breakpoint: Breakpoint): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoints[breakpoint]
  },
  
  // Get current breakpoint
  getCurrentBreakpoint: (): Breakpoint => {
    if (typeof window === 'undefined') return 'lg'
    
    const width = window.innerWidth
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  },
  
  // Check if device is mobile
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoints.md
  },
  
  // Check if device is tablet
  isTablet: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg
  },
  
  // Check if device is desktop
  isDesktop: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoints.lg
  },
  
  // Check if device supports touch
  isTouch: (): boolean => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },
  
  // Check if device is in landscape mode
  isLandscape: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth > window.innerHeight
  },
  
  // Check if device is in portrait mode
  isPortrait: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= window.innerHeight
  },
  
  // Get device pixel ratio
  getPixelRatio: (): number => {
    if (typeof window === 'undefined') return 1
    return window.devicePixelRatio || 1
  },
  
  // Check if device has high DPI
  isHighDPI: (): boolean => {
    if (typeof window === 'undefined') return false
    return (window.devicePixelRatio || 1) > 1
  },
  
  // Get safe area insets (for devices with notches)
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 }
    
    const computedStyle = getComputedStyle(document.documentElement)
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
    }
  }
}

// CSS custom properties for responsive design
export const cssVariables = {
  // Responsive spacing
  '--spacing-xs': 'clamp(0.25rem, 1vw, 0.5rem)',
  '--spacing-sm': 'clamp(0.5rem, 2vw, 1rem)',
  '--spacing-md': 'clamp(1rem, 3vw, 1.5rem)',
  '--spacing-lg': 'clamp(1.5rem, 4vw, 2rem)',
  '--spacing-xl': 'clamp(2rem, 5vw, 3rem)',
  
  // Responsive font sizes
  '--text-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
  '--text-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
  '--text-base': 'clamp(1rem, 3vw, 1.125rem)',
  '--text-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
  '--text-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
  
  // Container widths
  '--container-xs': '20rem',
  '--container-sm': '24rem',
  '--container-md': '42rem',
  '--container-lg': '56rem',
  '--container-xl': '72rem',
  '--container-2xl': '80rem'
} as const

export default responsive