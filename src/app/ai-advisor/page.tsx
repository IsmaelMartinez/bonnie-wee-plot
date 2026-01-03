'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Settings, Leaf } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types/api'

// Extracted hooks
import { useLocation } from '@/hooks/useLocation'
import { useApiToken } from '@/hooks/useSessionStorage'
import { useAllotment } from '@/hooks/useAllotment'

// Rate limiting
import { aiRateLimiter, formatCooldown } from '@/lib/rate-limiter'

// Vegetable database for names
import { getVegetableById } from '@/lib/vegetable-database'

// Extracted components
import LocationStatus from '@/components/ai-advisor/LocationStatus'
import TokenSettings from '@/components/ai-advisor/TokenSettings'
import QuickTopics from '@/components/ai-advisor/QuickTopics'
import ChatMessage, { LoadingMessage } from '@/components/ai-advisor/ChatMessage'
import ChatInput from '@/components/ai-advisor/ChatInput'

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

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [rateLimitInfo, setRateLimitInfo] = useState({ cooldownMs: 0, remainingRequests: 5 })
  
  // Use extracted hooks
  const { userLocation, locationError, detectUserLocation, isDetecting } = useLocation()
  const { token, saveToken, clearToken } = useApiToken()
  
  // Load allotment data for context
  const { data: allotmentData, currentSeason, selectedYear, getProblemBeds } = useAllotment()
  
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
      for (const bed of currentSeason.beds) {
        const plantingList = bed.plantings.map(p => {
          const veg = getVegetableById(p.vegetableId)
          const vegName = veg?.name || p.vegetableId
          const variety = p.varietyName ? ` (${p.varietyName})` : ''
          const status = p.success ? ` [${p.success}]` : ''
          return `${vegName}${variety}${status}`
        }).join(', ')
        
        if (plantingList) {
          lines.push(`- Bed ${bed.bedId}: ${bed.rotationGroup} - ${plantingList}`)
        } else {
          lines.push(`- Bed ${bed.bedId}: ${bed.rotationGroup} - (empty/not planted yet)`)
        }
      }
      lines.push('')
    }
    
    // Problem beds
    const problemBeds = getProblemBeds()
    if (problemBeds.length > 0) {
      lines.push('PROBLEM BEDS:')
      for (const bed of problemBeds) {
        lines.push(`- ${bed.name}: ${bed.problemNotes || 'Needs attention'}`)
      }
      lines.push('')
    }
    
    // Layout summary
    const rotationBeds = allotmentData.layout.beds.filter(b => b.status === 'rotation')
    const perennialBeds = allotmentData.layout.beds.filter(b => b.status === 'perennial')
    
    lines.push(`LAYOUT: ${rotationBeds.length} rotation beds, ${problemBeds.length} problem beds, ${perennialBeds.length} perennial areas`)
    lines.push(`PERMANENT PLANTINGS: ${allotmentData.layout.permanentPlantings.map(p => p.name).join(', ')}`)
    
    return lines.join('\n')
  }, [allotmentData, currentSeason, selectedYear, getProblemBeds])

  // Update rate limit state
  const updateRateLimitState = useCallback(() => {
    const state = aiRateLimiter.getState()
    setRateLimitInfo({
      cooldownMs: state.cooldownMs,
      remainingRequests: state.remainingRequests
    })
  }, [])

  // Sync temp token with actual token
  useEffect(() => {
    setTempToken(token)
  }, [token])

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

  const handleSubmit = async (query: string, image?: File) => {
    // Check rate limit before proceeding
    if (!aiRateLimiter.canRequest()) {
      const cooldownMs = aiRateLimiter.getCooldownMs()
      const errorResponse: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🌿 **Slow Down, Eager Gardener!** 🌿\n\nI'm taking a quick breather to prevent API overload. Please wait ${formatCooldown(cooldownMs)} before your next question.\n\n**While you wait:**\n• Review our previous conversation\n• Think about follow-up questions\n• Check your plants for any changes\n\nI'll be ready to help again shortly! 🌱`
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['x-openai-token'] = token
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

      // Prepare request body
      const requestBody: {
        message: string
        messages: ChatMessageType[]
        image?: { data: string; type: string }
        allotmentContext?: string
      } = {
        message: enhancedQuery,
        messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content })),
        allotmentContext: allotmentContext || undefined
      }

      if (image) {
        const imageBase64 = await imageToBase64(image)
        requestBody.image = {
          data: imageBase64,
          type: image.type
        }
      }

      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to get AI response')
      }

      const data = await response.json()
      
      const aiResponse: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response
      }
      
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('Invalid token')
      
      const errorResponse: ExtendedChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: isConfigError 
          ? `🌱 **Getting Started** 🌱\n\nHi there! I'm Aitor, your gardening companion. I'd love to help you with your allotment questions, but I need an API key to get started.\n\n**How to set me up:**\n• Click the settings icon (⚙️) above to add your OpenAI API token\n• Get your token from the OpenAI dashboard\n• Once configured, I'll be ready to help with all your gardening needs!\n\n**What I can help with:**\n• Plant selection and planting schedules\n• Pest and disease management\n• Seasonal gardening tasks\n• Composting systems and troubleshooting\n• Soil health and organic fertilizers\n• Weather-specific care tips\n\nLet's get growing together! 🌿`
          : `🌿 **Temporary Connection Issue** 🌿\n\nOops! I'm having trouble connecting to my knowledge base right now. This happens sometimes and usually resolves quickly.\n\n**What you can try:**\n• Wait a moment and ask your question again\n• Check your internet connection\n• Verify your API token is still valid in settings\n\n**While you wait, here are some quick tips:**\n• Water early morning or evening to reduce evaporation\n• Mulch around plants to retain moisture and suppress weeds\n• Check your local frost dates before planting tender crops\n• Companion plant basil near tomatoes for better flavor\n\n**Alternative resources:**\n• Your local gardening community\n• Agricultural extension services\n• Fellow allotment gardeners\n\nI'll be back to help soon! 🌱`
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToken = () => {
    saveToken(tempToken)
    setShowSettings(false)
  }

  const handleClearToken = () => {
    clearToken()
    setTempToken('')
    setShowSettings(false)
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl">🌱</span>
                <h1 className="text-zen-ink-900">Ask Aitor</h1>
              </div>
              <p className="text-zen-stone-500 text-lg">
                Your gardening companion
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-zen-stone-500 hover:text-zen-ink-700 hover:bg-zen-stone-100 rounded-zen transition"
              title="Configure API Token"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Location Status */}
          <div className="mb-6">
            <LocationStatus
              userLocation={userLocation}
              locationError={locationError}
              onRetry={detectUserLocation}
              isDetecting={isDetecting}
            />
          </div>

          <div className="zen-card p-4 bg-zen-moss-50/50 border-zen-moss-200">
            <div className="flex items-center mb-2">
              <Leaf className="w-4 h-4 text-zen-moss-600 mr-2" />
              <span className="text-zen-moss-800 font-medium text-sm">Specialized for Allotment Gardens</span>
            </div>
            <p className="text-zen-moss-700 text-sm">
              Aitor provides expert guidance specifically for allotment gardening, vegetable cultivation,
              composting systems, and seasonal care tailored to your local climate.
            </p>
          </div>
        </header>

      {/* API Token Settings */}
      {showSettings && (
        <TokenSettings
          token={tempToken}
          onTokenChange={setTempToken}
          onSave={handleSaveToken}
          onClear={handleClearToken}
          onClose={() => setShowSettings(false)}
        />
      )}

        {/* Quick Topics */}
        <QuickTopics onSelectTopic={(query) => handleSubmit(query)} />

        {/* Chat Interface */}
        <div className="zen-card overflow-hidden">
          <div className="border-b border-zen-stone-100 p-4">
            <h3 className="font-display text-zen-ink-800">Chat with Aitor</h3>
            <p className="text-sm text-zen-stone-500">Ask me anything about your allotment and garden</p>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-zen-stone-50/50">
            {messages.length === 0 && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Leaf className="w-12 h-12 text-zen-moss-200 mb-4" />
                <p className="text-zen-ink-600 text-lg mb-2">What can I help you grow today?</p>
                <p className="text-zen-stone-400 text-sm">
                  Ask about planting, pests, harvesting, or select a topic above
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <LoadingMessage />}
              </>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rateLimitInfo={rateLimitInfo}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 zen-card p-6 bg-zen-water-50/30 border-zen-water-200">
          <h3 className="font-display text-zen-water-800 mb-4">Getting the Best Advice</h3>
          <ul className="space-y-2 text-zen-water-700 text-sm">
            <li>• Share your location and local climate conditions</li>
            <li>• Upload clear photos of your plants for visual diagnosis</li>
            <li>• Describe symptoms in detail with timing and photos if possible</li>
            <li>• Ask follow-up questions for more specific guidance</li>
            <li>• Let me know your gardening experience level for tailored advice</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
