'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Leaf, Sun, Cloud, Bug, Sprout, Calendar, Settings, Eye, EyeOff, Shield, Camera, X, Recycle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

const quickTopics = [
  { icon: Sprout, title: 'Planting Guide', query: 'What should I plant in my allotment this month?' },
  { icon: Bug, title: 'Pest Control', query: 'How do I deal with common garden pests naturally?' },
  { icon: Sun, title: 'Summer Care', query: 'How should I care for my plants during hot summer weather?' },
  { icon: Cloud, title: 'Watering Tips', query: 'What are the best watering practices for vegetables?' },
  { icon: Calendar, title: 'Seasonal Tasks', query: 'What are the most important gardening tasks for June?' },
  { icon: Recycle, title: 'Composting Help', query: 'How do I start composting? What materials should I use?' },
  { icon: Camera, title: 'Plant Diagnosis', query: 'I\'ve uploaded a photo of my plant. Can you tell me what might be wrong with it?' },
  { icon: Leaf, title: 'Plant Health', query: 'My tomato leaves are turning yellow, what could be wrong?' }
]

// Markdown components for styling
const markdownComponents = {
  // Headers
  h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2 text-gray-800">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-semibold mb-1 text-gray-800">{children}</h3>,
  
  // Text formatting
  p: ({ children }: any) => <p className="mb-2 leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  
  // Lists
  ul: ({ children }: any) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  
  // Code
  code: ({ children, className }: any) => {
    const isInline = !className
    return isInline ? (
      <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
    ) : (
      <pre className="bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
        <code>{children}</code>
      </pre>
    )
  },
  
  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-green-500 pl-3 italic text-gray-700 mb-2">
      {children}
    </blockquote>
  ),
  
  // Links
  a: ({ href, children }: any) => (
    <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  
  // Horizontal rule
  hr: () => <hr className="my-3 border-gray-300" />,
}

const sampleConversation = [
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

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState(sampleConversation)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Location and time detection state
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
    city?: string
    country?: string
    timezone?: string
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  // Token configuration state
  const [showSettings, setShowSettings] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  
  // Load token from session storage on mount and detect location
  useEffect(() => {
    const savedToken = sessionStorage.getItem('aitor_api_token')
    if (savedToken) setApiToken(savedToken)
    
    // Request user's location
    detectUserLocation()
  }, [])
  
  // Detect user's location using browser APIs
  const detectUserLocation = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser')
        return
      }
      
      // Get user's position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Use reverse geocoding to get city/country info
            // Using a free service for demonstration - in production, consider using a more robust service
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            
            if (response.ok) {
              const data = await response.json()
              setUserLocation({
                latitude,
                longitude,
                city: data.city ?? data.locality,
                country: data.countryName,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
              })
            } else {
              // Fallback with just coordinates and timezone
              setUserLocation({
                latitude,
                longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
              })
            }
          } catch (error) {
            console.error('Error getting location details:', error)
            // Fallback with just coordinates and timezone
            setUserLocation({
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied by user')
              break
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location information unavailable')
              break
            case error.TIMEOUT:
              setLocationError('Location request timed out')
              break
            default:
              setLocationError('An unknown error occurred while detecting location')
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache position for 5 minutes
        }
      )
    } catch (error) {
      console.error('Error detecting location:', error)
      setLocationError('Failed to detect location')
    }
  }
  
  // Save token to session storage
  const saveTokenConfig = () => {
    if (apiToken.trim()) {
      sessionStorage.setItem('aitor_api_token', apiToken.trim())
    } else {
      sessionStorage.removeItem('aitor_api_token')
    }
    setShowSettings(false)
  }
  
  // Clear token configuration
  const clearTokenConfig = () => {
    setApiToken('')
    sessionStorage.removeItem('aitor_api_token')
    setShowSettings(false)
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Convert image to base64 for API
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (query: string) => {
    const newMessage = { 
      id: Date.now().toString(), 
      role: 'user' as const, 
      content: query,
      image: imagePreview // Add image preview for display
    }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get stored token for API request
      const storedToken = sessionStorage.getItem('aitor_api_token')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add user OpenAI token to headers if available
      if (storedToken) {
        headers['x-openai-token'] = storedToken
      }

      // Prepare enhanced message with location and time context
      let enhancedQuery = query
      
      // Add location context if available
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
      const requestBody: any = {
        message: enhancedQuery,
        messages: messages // Send conversation history for context
      }

      // Add image if selected
      if (selectedImage) {
        const imageBase64 = await imageToBase64(selectedImage)
        requestBody.image = {
          data: imageBase64,
          type: selectedImage.type
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
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.response
      }
      
      setMessages(prev => [...prev, aiResponse])
      
      // Clear image after successful submission
      removeImage()
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('Invalid token')
      
      const errorResponse = {
        id: (Date.now() + 2).toString(),
        role: 'assistant' as const,
        content: isConfigError 
          ? `🌱 **Getting Started** 🌱\n\nHi there! I'm Aitor, your gardening companion. I'd love to help you with your allotment questions, but I need an API key to get started.\n\n**How to set me up:**\n• Click the settings icon (⚙️) above to add your OpenAI API token\n• Get your token from the OpenAI dashboard\n• Once configured, I'll be ready to help with all your gardening needs!\n\n**What I can help with:**\n• Plant selection and planting schedules\n• Pest and disease management\n• Seasonal gardening tasks\n• Composting systems and troubleshooting\n• Soil health and organic fertilizers\n• Weather-specific care tips\n\nLet's get growing together! 🌿`
          : `🌿 **Temporary Connection Issue** 🌿\n\nOops! I'm having trouble connecting to my knowledge base right now. This happens sometimes and usually resolves quickly.\n\n**What you can try:**\n• Wait a moment and ask your question again\n• Check your internet connection\n• Verify your API token is still valid in settings\n\n**While you wait, here are some quick tips:**\n• Water early morning or evening to reduce evaporation\n• Mulch around plants to retain moisture and suppress weeds\n• Check your local frost dates before planting tender crops\n• Companion plant basil near tomatoes for better flavor\n\n**Alternative resources:**\n• Your local gardening community\n• Agricultural extension services\n• Fellow allotment gardeners\n\nI'll be back to help soon! 🌱`
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickTopic = (query: string) => {
    handleSubmit(query)
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(input)
    }
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
          {(() => {
            if (userLocation) {
              return (
                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  📍 {userLocation.city && userLocation.country 
                    ? `${userLocation.city}, ${userLocation.country}` 
                    : 'Location detected'}
                  {userLocation.timezone && (
                    <span className="ml-2 text-green-600">
                      • {new Date().toLocaleTimeString('en-US', {
                        timeZone: userLocation.timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </span>
                  )}
                </div>
              )
            }
            
            if (locationError) {
              return (
                <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  ⚠️ {locationError}
                  <button 
                    onClick={detectUserLocation}
                    className="ml-2 text-yellow-700 hover:text-yellow-900 underline text-xs"
                  >
                    Retry
                  </button>
                </div>
              )
            }
            
            return (
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                {' '}🌍 Detecting location...
              </div>
            )
          })()}
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

      {/* API Token Configuration Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">API Token Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="openai-token" className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  id="openai-token"
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxx or your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  Your OpenAI API key from the OpenAI dashboard.{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Get one here
                  </a>
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                </div>
                <div className="ml-2">
                  <p className="text-sm text-yellow-800">
                    <strong>Privacy Notice:</strong> Your token is stored only in your browser session and never saved permanently. 
                    It&apos;s sent securely to OpenAI only when making requests.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={saveTokenConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Configuration
              </button>
              <button
                onClick={clearTokenConfig}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear Token
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Topics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🌿 Popular Gardening Topics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTopics.map((topic, index) => {
            const IconComponent = topic.icon
            return (
              <button
                key={`topic-${index}-${topic.title}`}
                onClick={() => handleQuickTopic(topic.query)}
                className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition text-left"
              >
                <div className="flex items-center mb-2">
                  <IconComponent className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-medium text-gray-800">{topic.title}</span>
                </div>
                <p className="text-sm text-gray-600">{topic.query}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">Chat with Aitor</h3>
          <p className="text-sm text-gray-600">Ask me anything about your allotment and garden!</p>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.role === 'user' ? (
                  <div>
                    {/* Display image if present */}
                    {(message as any).image && (
                      <div className="mb-2">
                        <Image 
                          src={(message as any).image} 
                          alt="Plant for analysis" 
                          className="max-w-full h-auto rounded border"
                          style={{ maxHeight: '200px' }}
                          width={400}
                          height={200}
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {/* Image preview and upload */}
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <Image 
                src={imagePreview} 
                alt="Plant for analysis"
                className="max-w-xs h-auto rounded border"
                style={{ maxHeight: '150px' }}
                width={300}
                height={150}
                unoptimized={true}
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleInputSubmit} className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about planting, pests, soil, weather, or any garden question..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                disabled={isLoading}
                title="Upload plant photo"
              >
                <Camera className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Helper text */}
            <div className="text-sm text-gray-500">
              {selectedImage ? (
                <span className="text-green-600">📷 Image ready for analysis</span>
              ) : (
                <span>💡 Tip: Upload a plant photo for visual diagnosis</span>
              )}
            </div>
          </form>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            capture="environment" // Prefer rear camera on mobile
          />
        </div>
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
