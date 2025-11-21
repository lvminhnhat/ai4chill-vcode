'use client'

import { useSession } from 'next-auth/react'
import { LogoutButton } from './LogoutButton'
import { User } from 'lucide-react'

/**
 * Header component with app branding and user authentication controls
 *
 * Features:
 * - Responsive design with mobile-first approach
 * - Shows app name/logo on the left
 * - Shows user info and logout button on the right (only when authenticated)
 * - Dark mode support using Tailwind CSS
 * - Clean and minimal design
 */
export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* App Logo/Name - Left side */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">A</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Auth App</h1>
        </div>

        {/* User Info and Logout - Right side */}
        {session && (
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {session.user?.name || session.user?.email || 'User'}
              </span>
            </div>

            {/* Logout Button */}
            <LogoutButton
              variant="ghost"
              size="sm"
              showIcon={true}
              showLoadingIcon={true}
              className="text-muted-foreground hover:text-foreground"
            />
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
