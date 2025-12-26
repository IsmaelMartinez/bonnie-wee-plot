'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Settings, Leaf } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types'

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

const sampleConversation: ExtendedChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'My tomato plants have yellow leaves on the bottom. Should I be worried?'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Hello! I\'m Aitor, your gardening specialist. Let me help you with those yellowing tomato leaves.\n\n🌱 **What you\'re seeing is quite common** and usually manageable! Yellow lower leaves on tomatoes can indicate several things:\n\n**Most likely causes:**\n• **Natural aging** - Lower leaves naturally yellow and drop as the plant matures and focuses energy on upper growth\n• **Watering inconsistency** - Both overwatering and underwatering can cause yellowing\n• **Nitrogen deficiency** - The plant may be using up nutrients as it grows\n\n**Recommended actions:**\n• Remove the yellow leaves to prevent potential disease spread\n• Check soil moisture - aim for consistently moist (not soggy) soil\n• Apply a balanced tomato fertilizer to boost nutrition\n• Add mulch around the base to help retain moisture\n\n**When to be concerned:** If yellowing spreads rapidly up the plant or you notice dark spots/wilting, it could indicate blight or other diseases.\n\n📸 **Pro tip**: Upload a photo of your tomato plants using the camera button below for more specific visual diagnosis!\n\nI can see from your location that it\'s currently summer in your area - this is actually a great time to address these issues before the main harvest season. The warm weather means your plants are actively growing and can recover quickly with proper care!'
  }
]

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
  const [messages, setMessages] = useState<ExtendedChatMessage[]>(sampleConversation)
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold text-gray-800 flex-1">🌱 Aitor - Your Gardening Companion</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Configure API Token"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Aitor is your friendly allotment expert, ready to help you grow healthy, thriving gardens
          with personalized advice for your location and season.
        </p>
        
        {/* Location Status */}
        <div className="mb-6">
          <LocationStatus 
            userLocation={userLocation}
            locationError={locationError}
            onRetry={detectUserLocation}
            isDetecting={isDetecting}
          />
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Leaf className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Specialized for Allotment Gardens</span>
          </div>
          <p className="text-green-700 text-sm">
            Aitor provides expert guidance specifically for allotment gardening, vegetable cultivation,
            composting systems, and seasonal care tailored to your local climate and growing conditions.
          </p>
        </div>
      </div>

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
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">Chat with Aitor</h3>
          <p className="text-sm text-gray-600">Ask me anything about your allotment and garden!</p>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && <LoadingMessage />}
        </div>

        {/* Input */}
        <ChatInput 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          rateLimitInfo={rateLimitInfo}
        />
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">💡 Getting the Best Advice</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Share your location and local climate conditions</li>
          <li>• Upload clear photos of your plants for visual diagnosis</li>
          <li>• Describe symptoms in detail with timing and photos if possible</li>
          <li>• Ask follow-up questions for more specific guidance</li>
          <li>• Let me know your gardening experience level for tailored advice</li>
        </ul>
      </div>
    </div>
  )
}
