'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react'
import type { ChatMessage as ChatMessageType } from '@/types/api'

export type ExtendedChatMessage = ChatMessageType & { image?: string }

interface OpenChatOptions {
  initialMessage?: string
}

interface AitorChatContextType {
  isOpen: boolean
  isMinimized: boolean
  openChat: (options?: OpenChatOptions | string) => void
  closeChat: () => void
  minimizeChat: () => void
  restoreChat: () => void
  initialMessage: string | null
  clearInitialMessage: () => void
  // Lifted out of the modal so close→reopen does not drop conversation
  // history when AitorAuthGate unmounts the modal.
  messages: ExtendedChatMessage[]
  setMessages: Dispatch<SetStateAction<ExtendedChatMessage[]>>
}

const AitorChatContext = createContext<AitorChatContextType | null>(null)

export function AitorChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([])

  const openChat = useCallback((options?: OpenChatOptions | string) => {
    if (typeof options === 'string') {
      setInitialMessage(options)
    } else if (options?.initialMessage) {
      setInitialMessage(options.initialMessage)
    }
    setIsMinimized(false)
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
  }, [])

  const minimizeChat = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const restoreChat = useCallback(() => {
    setIsMinimized(false)
  }, [])

  const clearInitialMessage = useCallback(() => {
    setInitialMessage(null)
  }, [])

  return (
    <AitorChatContext.Provider
      value={{
        isOpen,
        isMinimized,
        openChat,
        closeChat,
        minimizeChat,
        restoreChat,
        initialMessage,
        clearInitialMessage,
        messages,
        setMessages,
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
