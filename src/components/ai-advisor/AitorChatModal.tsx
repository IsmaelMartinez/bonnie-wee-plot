'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Leaf } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types/api'

// Extracted hooks
import { useLocation } from '@/hooks/useLocation'
import { useApiToken } from '@/hooks/useSessionStorage'
import { useAllotment } from '@/hooks/useAllotment'
import { useAitorChat } from '@/contexts/AitorChatContext'

// Rate limiting
import { aiRateLimiter, formatCooldown } from '@/lib/rate-limiter'

// Vegetable database for names
import { getVegetableById } from '@/lib/vegetable-database'

// OpenAI client
import { callOpenAI, OpenAIToolCall } from '@/lib/openai-client'

// AI Tools
import { PLANTING_TOOLS, ToolCall, formatToolCallForUser } from '@/lib/ai-tools-schema'
import { executeToolCalls, formatResultsForAI } from '@/services/ai-tool-executor'
import { saveAllotmentData } from '@/services/allotment-storage'

// Extracted components
import LocationStatus from '@/components/ai-advisor/LocationStatus'
import QuickTopics from '@/components/ai-advisor/QuickTopics'
import ChatMessage, { LoadingMessage } from '@/components/ai-advisor/ChatMessage'
import ChatInput from '@/components/ai-advisor/ChatInput'
import { ToolCallConfirmation } from '@/components/ai-advisor/ToolCallConfirmation'
import { Toast, ToastType } from '@/components/ui/Toast'
import Dialog from '@/components/ui/Dialog'

// Extended message type with image support
type ExtendedChatMessage = ChatMessageType & { image?: string }

// Convert image to base64 for API
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AitorChatModal() {
  const { isOpen, closeChat, initialMessage, clearInitialMessage } = useAitorChat()
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState({ cooldownMs: 0, remainingRequests: 5 })
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Tool calling state
  const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[] | null>(null)
  const [isExecutingTools, setIsExecutingTools] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Use extracted hooks
  const { userLocation, locationError, detectUserLocation, isDetecting } = useLocation()
  const { token } = useApiToken()

  // Load allotment data for context
  const allotment = useAllotment()
  const { data: allotmentData, currentSeason, selectedYear, getAreasByKind, reload: reloadAllotment } = allotment

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Build allotment context string for AI
  const allotmentContext = useMemo(() => {
    if (!allotmentData) return ''

    const lines: string[] = []

    // Basic info
    lines.push(`ALLOTMENT: ${allotmentData.meta.name}`)
    lines.push(`LOCATION: ${allotmentData.meta.location || 'Edinburgh, Scotland'}`)
    lines.push(`CURRENT SEASON: ${selectedYear}`)
    lines.push('')

    // Current season plantings
    if (currentSeason) {
      lines.push(`BEDS THIS YEAR (${selectedYear}):`)
      for (const areaSeason of currentSeason.areas) {
        const plantingList = areaSeason.plantings.map((p: { plantId: string; varietyName?: string; success?: string }) => {
          const veg = getVegetableById(p.plantId)
          const vegName = veg?.name || p.plantId
          const variety = p.varietyName ? ` (${p.varietyName})` : ''
          const status = p.success ? ` [${p.success}]` : ''
          return `${vegName}${variety}${status}`
        }).join(', ')

        if (plantingList) {
          lines.push(`- ${areaSeason.areaId}: ${areaSeason.rotationGroup || 'N/A'} - ${plantingList}`)
        } else {
          lines.push(`- ${areaSeason.areaId}: ${areaSeason.rotationGroup || 'N/A'} - (empty/not planted yet)`)
        }
      }
      lines.push('')
    }

    // Layout summary
    const rotationBeds = getAreasByKind('rotation-bed')
    const perennialBeds = getAreasByKind('perennial-bed')
    const treeAreas = getAreasByKind('tree')
    const berryAreas = getAreasByKind('berry')

    lines.push(`LAYOUT: ${rotationBeds.length} rotation beds, ${perennialBeds.length} perennial areas`)
    lines.push(`PERMANENT PLANTINGS: ${[...treeAreas, ...berryAreas].map(p => p.name).join(', ')}`)

    return lines.join('\n')
  }, [allotmentData, currentSeason, selectedYear, getAreasByKind])

  // Update rate limit state
  const updateRateLimitState = useCallback(() => {
    const state = aiRateLimiter.getState()
    setRateLimitInfo({
      cooldownMs: state.cooldownMs,
      remainingRequests: state.remainingRequests
    })
  }, [])

  // Update rate limit info periodically when in cooldown
  useEffect(() => {
    updateRateLimitState()

    if (rateLimitInfo.cooldownMs > 0) {
      const interval = setInterval(() => {
        updateRateLimitState()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [rateLimitInfo.cooldownMs, updateRateLimitState])

  const handleSubmit = useCallback(async (query: string, image?: File) => {
    // Check rate limit before proceeding
    if (!aiRateLimiter.canRequest()) {
      const cooldownMs = aiRateLimiter.getCooldownMs()
      const errorResponse: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Slow Down, Eager Gardener!**\n\nI'm taking a quick breather to prevent API overload. Please wait ${formatCooldown(cooldownMs)} before your next question.\n\n**While you wait:**\n- Review our previous conversation\n- Think about follow-up questions\n- Check your plants for any changes\n\nI'll be ready to help again shortly!`
      }
      setMessages(prev => [...prev, errorResponse])
      updateRateLimitState()
      return
    }

    // Create preview for display
    let imagePreview: string | undefined
    if (image) {
      imagePreview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(image)
      })
    }

    const newMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      image: imagePreview
    }
    setMessages(prev => [...prev, newMessage])
    setIsLoading(true)

    // Record the request for rate limiting
    aiRateLimiter.recordRequest()
    updateRateLimitState()

    try {
      // Check if token is provided
      if (!token) {
        throw new Error('Please configure your OpenAI API key in Settings to use Aitor')
      }

      // Prepare enhanced message with location context
      let enhancedQuery = query

      if (userLocation) {
        const currentDate = new Date()
        const timeInfo = currentDate.toLocaleString('en-US', {
          timeZone: userLocation.timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })

        let locationString = ''
        if (userLocation.city && userLocation.country) {
          locationString = `${userLocation.city}, ${userLocation.country}`
        } else if (userLocation.country) {
          locationString = userLocation.country
        } else {
          locationString = `${userLocation.latitude.toFixed(2)}°, ${userLocation.longitude.toFixed(2)}°`
        }

        enhancedQuery = `[CONTEXT: User is located in ${locationString}, current local time: ${timeInfo}]\n\n${query}`
      }

      // Prepare image data if provided
      let imageData: { data: string; type: string } | undefined
      if (image) {
        const imageBase64 = await imageToBase64(image)
        imageData = {
          data: imageBase64,
          type: image.type
        }
      }

      // Call OpenAI
      const data = await callOpenAI({
        apiToken: token,
        message: enhancedQuery,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        image: imageData,
        allotmentContext: allotmentContext || undefined,
        enableTools: !!allotmentData,
        tools: allotmentData ? PLANTING_TOOLS : undefined
      })

      // Check if AI wants to call tools
      if (data.type === 'tool_calls' && data.tool_calls && data.tool_calls.length > 0) {
        const toolCalls: ToolCall[] = data.tool_calls.map((tc: OpenAIToolCall) => ({
          id: tc.id,
          type: tc.type as 'function',
          function: tc.function
        }))

        setPendingToolCalls(toolCalls)

        const explanationLines = toolCalls.map(tc => `- ${formatToolCallForUser(tc)}`)
        const explanation = `I'd like to make the following changes to your garden:\n\n${explanationLines.join('\n')}\n\nPlease confirm below if you'd like me to proceed.`

        const explanationMessage: ExtendedChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || explanation
        }
        setMessages(prev => [...prev, explanationMessage])
        setIsLoading(false)
        return
      }

      // Regular text response
      const aiResponse: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error getting AI response:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('Invalid token') || errorMessage.includes('OpenAI API key')

      const errorResponse: ExtendedChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: isConfigError
          ? `**Getting Started**\n\nHi there! I'm Aitor, your gardening companion. I'd love to help you with your allotment questions, but I need an API key to get started.\n\n**How to set me up:**\n- Go to **Settings** from the navigation menu\n- Add your OpenAI API token in the "AI Assistant" section\n- Get your token from the OpenAI dashboard\n- Once configured, I'll be ready to help with all your gardening needs!\n\n**What I can help with:**\n- Plant selection and planting schedules\n- Pest and disease management\n- Seasonal gardening tasks\n- Composting systems and troubleshooting\n- Soil health and organic fertilizers\n- Weather-specific care tips\n\nLet's get growing together!`
          : `**Temporary Connection Issue**\n\nOops! I'm having trouble connecting to my knowledge base right now. This happens sometimes and usually resolves quickly.\n\n**What you can try:**\n- Wait a moment and ask your question again\n- Check your internet connection\n- Verify your API token is still valid in settings\n\n**While you wait, here are some quick tips:**\n- Water early morning or evening to reduce evaporation\n- Mulch around plants to retain moisture and suppress weeds\n- Check your local frost dates before planting tender crops\n- Companion plant basil near tomatoes for better flavor`
      }

      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }, [messages, token, userLocation, allotmentData, allotmentContext, updateRateLimitState])

  // Handle initial message from context
  useEffect(() => {
    if (isOpen && initialMessage) {
      handleSubmit(initialMessage)
      clearInitialMessage()
    }
  }, [isOpen, initialMessage, clearInitialMessage, handleSubmit])

  // Handle plant selection from disambiguation
  const handlePlantSelected = useCallback((toolCallId: string, selectedPlantId: string) => {
    if (!pendingToolCalls) return

    const updatedCalls = pendingToolCalls.map(tc => {
      if (tc.id === toolCallId) {
        try {
          const args = JSON.parse(tc.function.arguments)
          args.plantId = selectedPlantId
          return {
            ...tc,
            function: {
              ...tc.function,
              arguments: JSON.stringify(args)
            }
          }
        } catch {
          return tc
        }
      }
      return tc
    })

    setPendingToolCalls(updatedCalls)
  }, [pendingToolCalls])

  // Handle tool call confirmation
  const handleToolConfirmation = useCallback(async (approved: boolean) => {
    if (!pendingToolCalls || !allotmentData) {
      setPendingToolCalls(null)
      return
    }

    if (!approved) {
      const declineMessage: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "No problem! I won't make those changes. Let me know if there's anything else I can help with."
      }
      setMessages(prev => [...prev, declineMessage])
      setPendingToolCalls(null)
      return
    }

    setIsExecutingTools(true)

    try {
      const { updatedData, results } = executeToolCalls(
        pendingToolCalls,
        allotmentData,
        selectedYear
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        const saveResult = saveAllotmentData(updatedData)
        if (!saveResult.success) {
          setToast({ message: saveResult.error || 'Failed to save changes', type: 'error' })
          return
        }

        reloadAllotment()

        const toastMessage = successCount === 1
          ? 'Garden updated successfully!'
          : `${successCount} changes applied successfully!`
        setToast({ message: toastMessage, type: 'success' })
      }

      if (successCount === 0 && failCount > 0) {
        setToast({ message: 'Could not apply changes. See details below.', type: 'error' })
      }

      const resultSummary = formatResultsForAI(results)
      let responseContent: string

      if (failCount === 0) {
        responseContent = `Done! ${resultSummary}\n\nYour garden records have been updated. Is there anything else you'd like to do?`
      } else if (successCount === 0) {
        responseContent = `I wasn't able to complete the changes:\n\n${resultSummary}\n\nWould you like me to try a different approach?`
      } else {
        responseContent = `I completed some of the changes:\n\n${resultSummary}\n\nWould you like me to try the failed operations again?`
      }

      const resultMessage: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent
      }
      setMessages(prev => [...prev, resultMessage])
    } catch (error) {
      console.error('Error executing tool calls:', error)
      const errorMessage: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error while updating your garden records: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setPendingToolCalls(null)
      setIsExecutingTools(false)
    }
  }, [pendingToolCalls, allotmentData, selectedYear, reloadAllotment])

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={closeChat}
        title="Ask Aitor"
        maxWidth="2xl"
        fullContent
        variant="bottom-sheet"
      >
        <div className="flex flex-col h-[70vh] md:h-[600px]">
          {/* Header info */}
          <div className="px-4 py-3 border-b border-zen-stone-100 bg-zen-moss-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-zen-moss-600" />
                <span className="text-sm text-zen-moss-700">Your gardening companion</span>
              </div>
              <LocationStatus
                userLocation={userLocation}
                locationError={locationError}
                onRetry={detectUserLocation}
                isDetecting={isDetecting}
              />
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-zen-stone-50/50"
            role="log"
            aria-label="Chat messages with Aitor"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && !isLoading ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <Leaf className="w-12 h-12 text-zen-moss-200 mb-4" aria-hidden="true" />
                  <p className="text-zen-ink-600 text-lg mb-2">What can I help you grow today?</p>
                  <p className="text-zen-stone-500 text-sm mb-6">
                    Ask about planting, pests, harvesting, or select a topic below
                  </p>
                </div>
                {/* Quick Topics */}
                <div className="px-2">
                  <QuickTopics onSelectTopic={(query) => handleSubmit(query)} />
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {/* Tool call confirmation */}
                {pendingToolCalls && (
                  <ToolCallConfirmation
                    toolCalls={pendingToolCalls}
                    onConfirm={handleToolConfirmation}
                    onPlantSelected={handlePlantSelected}
                    isExecuting={isExecutingTools}
                  />
                )}
                {isLoading && <LoadingMessage />}
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0">
            <ChatInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              rateLimitInfo={rateLimitInfo}
            />
          </div>
        </div>
      </Dialog>

      {/* Toast notification for tool execution feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  )
}
