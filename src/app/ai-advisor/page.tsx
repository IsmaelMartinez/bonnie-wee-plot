'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAitorChat } from '@/contexts/AitorChatContext'

/**
 * AI Advisor page - redirects to home and opens the chat modal.
 * This page exists to support direct URL access and bookmarks.
 */
export default function AIAdvisorPage() {
  const router = useRouter()
  const { openChat } = useAitorChat()

  useEffect(() => {
    // Open the chat modal and redirect to home
    openChat()
    router.replace('/')
  }, [openChat, router])

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen bg-zen-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-zen-moss-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zen-stone-500">Opening Aitor...</p>
      </div>
    </div>
  )
}
