'use client'

import { ClerkProvider } from '@clerk/nextjs'

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/**
 * Conditionally wraps children with ClerkProvider when Clerk is configured.
 * Without Clerk env vars, children render without auth (anonymous-only mode).
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured) {
    return <>{children}</>
  }

  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  )
}
