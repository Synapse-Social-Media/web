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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden safe-area-inset-bottom">
      <div className="flex h-16 items-center justify-around px-1 sm:px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 rounded-lg px-2 sm:px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground relative min-w-0 flex-1 touch-manipulation active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  'h-5 w-5',
                  isActive && 'fill-current'
                )} />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs leading-none flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="truncate text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}