'use client'

import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { useAllotment } from '@/hooks/useAllotment'
import AitorChatButton from './AitorChatButton'
import AitorChatModal from './AitorChatModal'

/**
 * Renders the floating Aitor chat button and modal only for users who have
 * explicitly opted in.
 *
 * Aitor is gated behind Clerk auth so we have a real user identity for any
 * future server-side fallback, AND behind a per-user `meta.aiAdvisorEnabled`
 * flag so signing in does not implicitly subscribe a user to AI features.
 * When Clerk is not configured (e.g. local dev without keys),
 * `useOptionalAuth` returns `isSignedIn: false` and Aitor stays hidden.
 */
export default function AitorAuthGate() {
  const { isSignedIn } = useOptionalAuth()
  const { data } = useAllotment()
  if (!isSignedIn) return null
  if (data?.meta?.aiAdvisorEnabled !== true) return null
  return (
    <>
      <AitorChatButton />
      <AitorChatModal />
    </>
  )
}
