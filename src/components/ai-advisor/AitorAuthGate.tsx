'use client'

import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import AitorChatButton from './AitorChatButton'
import AitorChatModal from './AitorChatModal'

/**
 * Renders the floating Aitor chat button and modal only for signed-in users.
 *
 * Aitor (the AI advisor) is gated behind Clerk authentication so we have
 * a real user identity for any future server-side fallback, and so anonymous
 * onboarding stays focused. When Clerk is not configured (e.g. local dev
 * without keys), `useOptionalAuth` returns `isSignedIn: false` and Aitor
 * stays hidden — same gate, same UI.
 */
export default function AitorAuthGate() {
  const { isSignedIn } = useOptionalAuth()
  if (!isSignedIn) return null
  return (
    <>
      <AitorChatButton />
      <AitorChatModal />
    </>
  )
}
