'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    Search,
    MessageCircle,
    Bell,
    User,
    Settings,
    Plus,
    Bookmark,
    Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/contexts/auth-context'

const navigationItems = [
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
    },
    {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
    },
    {
        name: 'Bookmarks',
        href: '/bookmarks',
        icon: Bookmark,
    },
    {
        name: 'Communities',
        href: '/communities',
        icon: Users,
    },
    {
        name: 'Profile',
        href: '/profile',
        icon: User,
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { userProfile } = useAuth()

    return (
        <div className="flex h-full w-64 tablet-sidebar-width desktop-sidebar-width flex-col border-r bg-card safe-area-inset-left">
            {/* Logo/Brand */}
            <div className="flex h-14 sm:h-16 items-center border-b px-responsive safe-area-inset-top">
                <Link href="/" className="flex items-center space-responsive-x touch-target">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex-shrink-0" />
                    <span className="text-responsive-lg font-bold truncate">Social</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-responsive">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center space-responsive-x rounded-lg px-3 py-3 sm:py-2.5 text-responsive-sm font-medium transition-all duration-200 touch-target mobile-nav-item desktop-hover',
                                'hover:bg-accent hover:text-accent-foreground active:scale-95',
                                isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Create Post Button */}
            <div className="p-responsive">
                <Button className="w-full touch-target desktop-hover" size="lg">
                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline text-responsive-sm">Create Post</span>
                    <span className="sm:hidden text-responsive-sm">Post</span>
                </Button>
            </div>

            {/* User Profile */}
            {userProfile && (
                <div className="border-t p-responsive safe-area-inset-bottom">
                    <div className="flex items-center space-responsive-x">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarImage src={userProfile.avatar || undefined} />
                            <AvatarFallback className="text-responsive-sm">
                                {userProfile.display_name?.charAt(0) || userProfile.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-responsive-sm font-medium truncate">
                                {userProfile.display_name || userProfile.username}
                            </p>
                            <p className="text-responsive-xs text-muted-foreground truncate">
                                @{userProfile.username}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}