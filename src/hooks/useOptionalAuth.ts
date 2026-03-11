'use client'

import { useAuth, useUser } from '@clerk/nextjs'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
export const clerkAvailable = hasClerkKeys || isKeylessMode

interface AuthReturn {
  isSignedIn: boolean
  userId: string | null
  getToken: (opts?: { template?: string }) => Promise<string | null>
  signOut: () => Promise<void>
  userEmail: string | undefined
}

const noopSignOut = async () => {}

export function useOptionalAuth(): AuthReturn {
  if (!clerkAvailable) {
    return { isSignedIn: false, userId: null, getToken: async () => null, signOut: noopSignOut, userEmail: undefined }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const auth = useAuth()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user } = useUser()
  return {
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    getToken: auth.getToken,
    signOut: auth.signOut as unknown as () => Promise<void>,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? undefined,
  }
}
