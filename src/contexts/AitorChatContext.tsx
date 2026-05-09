'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type AitorChatMode = 'chat' | 'diagnose'

interface OpenChatOptions {
  initialMessage?: string
  initialMode?: AitorChatMode
}

interface AitorChatContextType {
  isOpen: boolean
  openChat: (options?: OpenChatOptions | string) => void
  closeChat: () => void
  initialMessage: string | null
  clearInitialMessage: () => void
  initialMode: AitorChatMode
  clearInitialMode: () => void
}

const AitorChatContext = createContext<AitorChatContextType | null>(null)

export function AitorChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)
  const [initialMode, setInitialMode] = useState<AitorChatMode>('chat')

  const openChat = useCallback((options?: OpenChatOptions | string) => {
    if (typeof options === 'string') {
      setInitialMessage(options)
      setInitialMode('chat')
    } else if (options) {
      if (options.initialMessage) setInitialMessage(options.initialMessage)
      setInitialMode(options.initialMode ?? 'chat')
    } else {
      setInitialMode('chat')
    }
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearInitialMessage = useCallback(() => {
    setInitialMessage(null)
  }, [])

  const clearInitialMode = useCallback(() => {
    setInitialMode('chat')
  }, [])

  return (
    <AitorChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        initialMessage,
        clearInitialMessage,
        initialMode,
        clearInitialMode,
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
