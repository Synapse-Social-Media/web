'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const mobileNavItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageCircle,
    badge: 2,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 3,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden safe-area-inset-bottom safe-area-inset-left safe-area-inset-right landscape-mobile-nav">
      <div className="flex h-16 landscape-mobile-nav items-center justify-around px-1 sm:px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 rounded-lg px-2 sm:px-3 py-2 text-responsive-xs font-medium transition-all duration-200 relative min-w-0 flex-1 touch-target mobile-nav-item',
                'hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-accent/50',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon className={cn(
                  'h-5 w-5 sm:h-6 sm:w-6 transition-all duration-200',
                  isActive && 'fill-current scale-110'
                )} />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs leading-none flex items-center justify-center animate-pulse"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "truncate text-xs transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}