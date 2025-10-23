'use client'

import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveStack, 
  ResponsiveShow,
  useResponsive,
  useMediaQuery
} from '@/components/layout/responsive-container'
import { 
  AdaptiveCard, 
  ResponsiveText,
  ResponsiveButtonGroup,
  ResponsiveList
} from '@/components/layout/responsive-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ResponsiveTestPage() {
  const { isMobile, isTablet, isDesktop, windowSize } = useResponsive()
  const isMobileQuery = useMediaQuery('(max-width: 767px)')

  return (
    <div className="min-h-screen bg-background p-responsive">
      <ResponsiveContainer size="xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <ResponsiveText variant="h1">Responsive Design Test</ResponsiveText>
            <ResponsiveText variant="body" className="text-muted-foreground">
              Testing responsive breakpoints and adaptive layouts
            </ResponsiveText>
            
            {/* Breakpoint Info */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant={isMobile ? "default" : "secondary"}>
                Mobile: {isMobile ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={isTablet ? "default" : "secondary"}>
                Tablet: {isTablet ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={isDesktop ? "default" : "secondary"}>
                Desktop: {isDesktop ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                Width: {windowSize.width}px
              </Badge>
            </div>
          </div>

          {/* Responsive Grid */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Responsive Grid</ResponsiveText>
            <ResponsiveGrid 
              cols={{ mobile: 1, tablet: 2, desktop: 3 }}
              gap="md"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <AdaptiveCard key={i} className="bg-muted">
                  <ResponsiveText variant="h4">Card {i + 1}</ResponsiveText>
                  <ResponsiveText variant="caption">
                    This card adapts to different screen sizes
                  </ResponsiveText>
                </AdaptiveCard>
              ))}
            </ResponsiveGrid>
          </AdaptiveCard>

          {/* Responsive Stack */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Responsive Stack</ResponsiveText>
            <ResponsiveStack 
              direction={{ mobile: 'col', tablet: 'row', desktop: 'row' }}
              spacing="md"
              align="center"
            >
              <div className="bg-primary text-primary-foreground p-4 rounded-lg flex-1">
                <ResponsiveText variant="h4">Item 1</ResponsiveText>
              </div>
              <div className="bg-secondary text-secondary-foreground p-4 rounded-lg flex-1">
                <ResponsiveText variant="h4">Item 2</ResponsiveText>
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded-lg flex-1">
                <ResponsiveText variant="h4">Item 3</ResponsiveText>
              </div>
            </ResponsiveStack>
          </AdaptiveCard>

          {/* Responsive Visibility */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Responsive Visibility</ResponsiveText>
            <div className="space-y-4">
              <ResponsiveShow below="md">
                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                  <ResponsiveText variant="body">
                    📱 This content is only visible on mobile devices
                  </ResponsiveText>
                </div>
              </ResponsiveShow>
              
              <ResponsiveShow only="md">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                  <ResponsiveText variant="body">
                    📱 This content is only visible on tablet devices
                  </ResponsiveText>
                </div>
              </ResponsiveShow>
              
              <ResponsiveShow above="lg">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                  <ResponsiveText variant="body">
                    🖥️ This content is only visible on desktop devices
                  </ResponsiveText>
                </div>
              </ResponsiveShow>
            </div>
          </AdaptiveCard>

          {/* Responsive Button Group */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Responsive Button Group</ResponsiveText>
            <ResponsiveButtonGroup 
              orientation="adaptive" 
              spacing="md"
            >
              <Button className="touch-target">Primary Action</Button>
              <Button variant="secondary" className="touch-target">Secondary</Button>
              <Button variant="outline" className="touch-target">Tertiary</Button>
            </ResponsiveButtonGroup>
          </AdaptiveCard>

          {/* Touch-Friendly Elements */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Touch-Friendly Elements</ResponsiveText>
            <ResponsiveList variant="default" dividers>
              <div className="touch-target p-4 hover:bg-accent rounded-lg cursor-pointer">
                <ResponsiveText variant="body">Touch-friendly list item 1</ResponsiveText>
                <ResponsiveText variant="caption">Minimum 44px touch target</ResponsiveText>
              </div>
              <div className="touch-target p-4 hover:bg-accent rounded-lg cursor-pointer">
                <ResponsiveText variant="body">Touch-friendly list item 2</ResponsiveText>
                <ResponsiveText variant="caption">Optimized for mobile interaction</ResponsiveText>
              </div>
              <div className="touch-target p-4 hover:bg-accent rounded-lg cursor-pointer">
                <ResponsiveText variant="body">Touch-friendly list item 3</ResponsiveText>
                <ResponsiveText variant="caption">Active states for feedback</ResponsiveText>
              </div>
            </ResponsiveList>
          </AdaptiveCard>

          {/* Responsive Typography */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Responsive Typography</ResponsiveText>
            <div className="space-y-4">
              <ResponsiveText variant="h1">Heading 1 - Scales with viewport</ResponsiveText>
              <ResponsiveText variant="h2">Heading 2 - Fluid typography</ResponsiveText>
              <ResponsiveText variant="h3">Heading 3 - Clamp-based sizing</ResponsiveText>
              <ResponsiveText variant="body">
                Body text that maintains readability across all device sizes. 
                The text size adapts smoothly using CSS clamp() functions for optimal reading experience.
              </ResponsiveText>
              <ResponsiveText variant="caption">
                Caption text for additional information and metadata
              </ResponsiveText>
            </div>
          </AdaptiveCard>

          {/* Media Query Test */}
          <AdaptiveCard>
            <ResponsiveText variant="h2" className="mb-4">Media Query Hook Test</ResponsiveText>
            <div className="space-y-2">
              <ResponsiveText variant="body">
                Media query hook result: {isMobileQuery ? 'Mobile' : 'Desktop+'}
              </ResponsiveText>
              <ResponsiveText variant="caption">
                This uses the useMediaQuery hook to detect screen size
              </ResponsiveText>
            </div>
          </AdaptiveCard>
        </div>
      </ResponsiveContainer>
    </div>
  )
}