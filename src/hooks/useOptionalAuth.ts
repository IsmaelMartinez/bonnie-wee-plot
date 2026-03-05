'use client'

import { useAuth } from '@clerk/nextjs'

interface AuthReturn {
  isSignedIn: boolean
  userId: string | null
  getToken: (opts?: { template?: string }) => Promise<string | null>
}

export function useOptionalAuth(): AuthReturn {
  const auth = useAuth()
  return {
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    getToken: auth.getToken,
  }
}
