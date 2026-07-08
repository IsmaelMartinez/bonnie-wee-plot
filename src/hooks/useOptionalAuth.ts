'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
export const clerkAvailable = hasClerkKeys || isKeylessMode

// Playwright cross-device sync e2e stub. Strictly gated to test-mode builds
// (`NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE=true`) so Clerk is never involved: it lets
// two browser contexts sign in as the SAME user against a stubbed Supabase REST
// endpoint (see tests/cloud-sync-merge.spec.ts). Never true in a real build.
const isPlaywrightTestMode = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE === 'true'
const E2E_AUTH_KEY = 'bwp-e2e-auth'

interface AuthReturn {
  isSignedIn: boolean
  userId: string | null
  getToken: (opts?: { template?: string }) => Promise<string | null>
  signOut: () => Promise<void>
  userEmail: string | undefined
}

const noopSignOut = async () => {}

/**
 * Test-only auth: reads a signed-in user id from `localStorage[bwp-e2e-auth]`
 * (set by the e2e before the app boots) and re-reads it on a `bwp-e2e-auth`
 * custom event / storage event. `getToken` returns a fixed dummy JWT — the
 * stubbed REST endpoint does not verify it.
 */
function usePlaywrightTestAuth(): AuthReturn {
  const read = () => {
    try {
      return localStorage.getItem(E2E_AUTH_KEY)
    } catch {
      return null
    }
  }
  const [userId, setUserId] = useState<string | null>(read)

  useEffect(() => {
    const update = () => setUserId(read())
    window.addEventListener('bwp-e2e-auth', update)
    window.addEventListener('storage', update)
    // Re-sync once on mount in case the flag landed between the initial read
    // and the effect running.
    update()
    return () => {
      window.removeEventListener('bwp-e2e-auth', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return {
    isSignedIn: !!userId,
    userId,
    getToken: async () => (userId ? 'e2e-supabase-token' : null),
    signOut: async () => {
      try {
        localStorage.removeItem(E2E_AUTH_KEY)
      } catch {
        /* ignore */
      }
      setUserId(null)
    },
    userEmail: userId ? 'e2e@example.com' : undefined,
  }
}

export function useOptionalAuth(): AuthReturn {
  // `isPlaywrightTestMode` and `clerkAvailable` are module constants fixed for
  // the app's lifetime, so the hook-call order below is stable across renders
  // (same guarantee the existing `clerkAvailable` branch relies on).
  if (isPlaywrightTestMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePlaywrightTestAuth()
  }

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
