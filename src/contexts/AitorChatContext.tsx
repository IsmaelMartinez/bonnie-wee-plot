'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AitorChatContextType {
  isOpen: boolean
  openChat: (initialMessage?: string) => void
  closeChat: () => void
  initialMessage: string | null
  clearInitialMessage: () => void
}

const AitorChatContext = createContext<AitorChatContextType | null>(null)

export function AitorChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  const openChat = useCallback((message?: string) => {
    if (message) {
      setInitialMessage(message)
    }
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearInitialMessage = useCallback(() => {
    setInitialMessage(null)
  }, [])

  return (
    <AitorChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        initialMessage,
        clearInitialMessage,
      }}
    >
      {children}
    </AitorChatContext.Provider>
  )
}

export function useAitorChat() {
  const context = useContext(AitorChatContext)
  if (!context) {
    throw new Error('useAitorChat must be used within an AitorChatProvider')
  }
  return context
}
