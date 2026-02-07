'use client'

import { MessageCircle } from 'lucide-react'
import { useAitorChat } from '@/contexts/AitorChatContext'
import { usePathname } from 'next/navigation'

export default function AitorChatButton() {
  const { openChat, isOpen } = useAitorChat()
  const pathname = usePathname()

  // Don't show on the AI advisor page itself (to avoid confusion)
  if (pathname === '/ai-advisor') {
    return null
  }

  // Don't show when modal is already open
  if (isOpen) {
    return null
  }

  return (
    <button
      onClick={() => openChat()}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zen-moss-600 hover:bg-zen-moss-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
      aria-label="Ask Aitor - your gardening assistant"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:inline">Ask Aitor</span>
    </button>
  )
}
