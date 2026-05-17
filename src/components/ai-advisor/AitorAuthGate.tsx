'use client'

import dynamic from 'next/dynamic'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { useAllotment } from '@/hooks/useAllotment'
import { useAitorChat } from '@/contexts/AitorChatContext'
import AitorChatButton from './AitorChatButton'

// Lazy-load the heavy modal. It owns useAllotment/useApiToken/useLocation and a
// hefty allotmentContext useMemo — none of which should run until the user
// actually opens the chat. ssr:false avoids hydration overhead for a
// client-only feature. The launcher disappears the moment the user clicks
// "Ask Aitor"; render a small spinner in the same corner so slow-network
// users see visual continuity until the dialog appears.
const AitorChatModal = dynamic(() => import('./AitorChatModal'), {
  ssr: false,
  loading: () => (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-zen-moss-600 rounded-full shadow-lg"
      role="status"
      aria-label="Loading Aitor chat"
    >
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

/**
 * Renders the floating Aitor chat button and modal only for users who have
 * explicitly opted in.
 *
 * Aitor is gated behind Clerk auth so we have a real user identity for any
 * future server-side fallback, AND behind a per-user `meta.aiAdvisorEnabled`
 * flag so signing in does not implicitly subscribe a user to AI features.
 * When Clerk is not configured (e.g. local dev without keys),
 * `useOptionalAuth` returns `isSignedIn: false` and Aitor stays hidden.
 *
 * Performance: the modal is only mounted while the chat is open or minimized.
 * Minimized counts as "still mounted" so the conversation state survives the
 * user shrinking the chat to a pill and restoring it later.
 */
export default function AitorAuthGate() {
  const { isSignedIn } = useOptionalAuth()
  const { data } = useAllotment()
  const { isOpen, isMinimized } = useAitorChat()
  if (!isSignedIn) return null
  if (data?.meta?.aiAdvisorEnabled !== true) return null
  const modalActive = isOpen || isMinimized
  return (
    <>
      <AitorChatButton />
      {modalActive && <AitorChatModal />}
    </>
  )
}
