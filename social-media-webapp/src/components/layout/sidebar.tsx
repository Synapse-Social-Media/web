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
        <div className="flex h-full w-64 sm:w-72 flex-col border-r bg-card">
            {/* Logo/Brand */}
            <div className="flex h-14 sm:h-16 items-center border-b px-4 sm:px-6">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary" />
                    <span className="text-lg sm:text-xl font-bold">Social</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3 sm:p-4">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground touch-manipulation',
                                isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Create Post Button */}
            <div className="p-3 sm:p-4">
                <Button className="w-full touch-manipulation" size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Create Post</span>
                    <span className="sm:hidden">Post</span>
                </Button>
            </div>

            {/* User Profile */}
            {userProfile && (
                <div className="border-t p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                            <AvatarImage src={userProfile.avatar || undefined} />
                            <AvatarFallback className="text-xs sm:text-sm">
                                {userProfile.display_name?.charAt(0) || userProfile.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {userProfile.display_name || userProfile.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                @{userProfile.username}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}