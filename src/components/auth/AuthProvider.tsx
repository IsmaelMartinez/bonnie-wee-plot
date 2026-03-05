'use client'

import { ClerkProvider } from '@clerk/nextjs'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
const clerkAvailable = hasClerkKeys || isKeylessMode

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkAvailable) {
    return <>{children}</>
  }

  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  )
}
