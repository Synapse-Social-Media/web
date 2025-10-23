'use client'

import { Search, Menu, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/contexts/auth-context'
import { NotificationCenter } from '@/components/notifications'

interface TopBarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const { setTheme } = useTheme()
  const { userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-responsive safe-area-inset-top safe-area-inset-left safe-area-inset-right">
      {/* Left side - Menu button (mobile) and Search */}
      <div className="flex items-center space-responsive-x flex-1 min-w-0">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden flex-shrink-0 touch-target"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative max-w-xs sm:max-w-md lg:max-w-lg w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            className="pl-10 pr-4 text-responsive-sm h-10 sm:h-11 touch-target"
          />
        </div>
      </div>

      {/* Right side - Notifications, Theme toggle, User menu */}
      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        {/* Notifications - Hidden on very small screens */}
        <NotificationCenter className="hidden xs:flex" />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 touch-target">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setTheme('light')} className="touch-target">
              <Sun className="mr-2 h-4 w-4" />
              <span className="text-responsive-sm">Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="touch-target">
              <Moon className="mr-2 h-4 w-4" />
              <span className="text-responsive-sm">Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="touch-target">
              <Monitor className="mr-2 h-4 w-4" />
              <span className="text-responsive-sm">System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        {userProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0 touch-target">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                  <AvatarImage src={userProfile.avatar || undefined} />
                  <AvatarFallback className="text-responsive-xs">
                    {userProfile.display_name?.charAt(0) || userProfile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 sm:w-64" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-3">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-responsive-sm">
                    {userProfile.display_name || userProfile.username}
                  </p>
                  <p className="w-[180px] sm:w-[200px] truncate text-responsive-xs text-muted-foreground">
                    @{userProfile.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="touch-target text-responsive-sm">Profile</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings" className="touch-target text-responsive-sm">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="touch-target text-responsive-sm">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}