'use client'

import { useAuth } from '@clerk/nextjs'

/**
 * Safe wrapper around Clerk's useAuth that returns anonymous defaults
 * when Clerk is not configured. Prevents runtime errors when
 * ClerkProvider is absent (anonymous-only mode).
 */

export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

interface AuthReturn {
  isSignedIn: boolean
  userId: string | null
  getToken: (opts?: { template?: string }) => Promise<string | null>
}

export function useOptionalAuth(): AuthReturn {
  if (!isClerkConfigured) {
    return { isSignedIn: false, userId: null, getToken: async () => null }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const auth = useAuth()
  return {
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    getToken: auth.getToken,
  }
}
