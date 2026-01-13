/**
 * InlineAIPrompt Component
 *
 * A lightweight, single-turn Q&A component for ambient AI integration.
 * Shows a small modal/popover with a pre-filled question and renders the AI response.
 *
 * Usage:
 * <InlineAIPrompt
 *   contextQuestion="Why should I avoid planting brassicas after brassicas?"
 *   allotmentContext="Bed B1: planted brassicas in 2024 and 2025"
 *   trigger={<button>Ask Aitor</button>}
 * />
 */

'use client'

import { useState, ReactNode } from 'react'
import { X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { aiRateLimiter, formatCooldown } from '@/lib/rate-limiter'
import { useApiToken } from '@/hooks/useSessionStorage'
import { callOpenAI } from '@/lib/openai-client'
import ChatMessage from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/types/api'

interface InlineAIPromptProps {
  contextQuestion: string
  allotmentContext: string
  trigger: ReactNode
}

type PromptState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limited'

export default function InlineAIPrompt({
  contextQuestion,
  allotmentContext,
  trigger
}: InlineAIPromptProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<PromptState>('idle')
  const [response, setResponse] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cooldownMs, setCooldownMs] = useState(0)

  const { token } = useApiToken()

  const handleOpen = () => {
    setIsOpen(true)
    setState('idle')
    setResponse(null)
    setErrorMessage(null)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleAsk = async () => {
    // Check rate limit
    if (!aiRateLimiter.canRequest()) {
      const cooldown = aiRateLimiter.getCooldownMs()
      setCooldownMs(cooldown)
      setState('rate-limited')
      return
    }

    setState('loading')
    setErrorMessage(null)

    // Record the request for rate limiting
    aiRateLimiter.recordRequest()

    try {
      // Check if token is provided
      if (!token) {
        throw new Error('Please provide an OpenAI API token in settings')
      }

      // Call OpenAI (tries API route first, falls back to direct call)
      const data = await callOpenAI({
        apiToken: token,
        message: contextQuestion,
        messages: [],
        allotmentContext: allotmentContext || undefined
      })

      setResponse(data.response)
      setState('success')
    } catch (error) {
      console.error('InlineAIPrompt error:', error)
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(message)
      setState('error')
    }
  }

  // Create a ChatMessage-compatible object for rendering
  // Use explicit type to match ChatMessage component props (image?: string, not string | null)
  const responseMessage: (ChatMessageType & { image?: string }) | null = response ? {
    id: 'inline-response',
    role: 'assistant',
    content: response
  } : null

  if (!isOpen) {
    return (
      <span onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </span>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[100]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inline-ai-title"
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[101] bg-white rounded-xl shadow-2xl w-full md:w-[500px] max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 id="inline-ai-title" className="text-base font-semibold text-gray-800">
              Ask Aitor
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Question preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-emerald-800">{contextQuestion}</p>
          </div>

          {/* States */}
          {state === 'idle' && (
            <button
              onClick={handleAsk}
              className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get Advice from Aitor
            </button>
          )}

          {state === 'loading' && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>Aitor is thinking...</span>
            </div>
          )}

          {state === 'success' && responseMessage && (
            <div className="space-y-4">
              <ChatMessage message={responseMessage} />
              <button
                onClick={handleClose}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Could not get advice</p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAsk}
                  className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {state === 'rate-limited' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Slow down, eager gardener!</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Please wait {formatCooldown(cooldownMs)} before asking another question.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
