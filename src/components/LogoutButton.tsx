'use client'

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '@/components/ui/button'
import { Loader2, LogOut } from 'lucide-react'

interface LogoutButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'disabled'> {
  /**
   * Custom redirect URL after sign out
   * @default '/'
   */
  redirectTo?: string
  /**
   * Custom button text
   * @default 'Sign Out'
   */
  children?: React.ReactNode
  /**
   * Show loading spinner during sign out
   * @default true
   */
  showLoadingIcon?: boolean
  /**
   * Show logout icon
   * @default true
   */
  showIcon?: boolean
}

/**
 * LogoutButton component that handles user sign out with NextAuth
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LogoutButton />
 *
 * // Custom redirect and variant
 * <LogoutButton
 *   variant="outline"
 *   redirectTo="/login"
 *   children="Logout"
 * />
 *
 * // As icon button
 * <LogoutButton
 *   variant="ghost"
 *   size="icon"
 *   showIcon={true}
 *   showLoadingIcon={false}
 * />
 * ```
 */
export function LogoutButton({
  redirectTo = '/',
  children = 'Sign Out',
  showLoadingIcon = true,
  showIcon = true,
  variant = 'default',
  size = 'default',
  className,
  ...buttonProps
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  const handleSignOut = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      await signOut({
        callbackUrl: redirectTo,
        redirect: true,
      })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  // Don't render if user is not authenticated
  if (!session) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      aria-label="Sign out"
      {...buttonProps}
    >
      {isLoading && showLoadingIcon && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {!isLoading && showIcon && <LogOut className="h-4 w-4" />}
      {children}
    </Button>
  )
}

export default LogoutButton
