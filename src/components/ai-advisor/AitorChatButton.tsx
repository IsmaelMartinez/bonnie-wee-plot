'use client'

import { Camera, MessageCircle } from 'lucide-react'
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <button
        onClick={() => openChat({ initialMode: 'diagnose' })}
        className="flex items-center gap-2 bg-zen-water-600 hover:bg-zen-water-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group min-h-[44px]"
        aria-label="Diagnose a plant - upload a photo for Aitor to analyse"
      >
        <Camera className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium hidden sm:inline">Diagnose a plant</span>
      </button>
      <button
        onClick={() => openChat()}
        className="flex items-center gap-2 bg-zen-moss-600 hover:bg-zen-moss-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group min-h-[44px]"
        aria-label="Ask Aitor - your gardening assistant"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium hidden sm:inline">Ask Aitor</span>
      </button>
    </div>
  )
}
