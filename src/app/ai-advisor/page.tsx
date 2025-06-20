'use client'

import { useState, useEffect } from 'react'
import { Send, Leaf, Sun, Cloud, Bug, Sprout, Calendar, Settings, Eye, EyeOff, Shield } from 'lucide-react'

const quickTopics = [
  { icon: Sprout, title: 'Planting Guide', query: 'What should I plant in my allotment this month?' },
  { icon: Bug, title: 'Pest Control', query: 'How do I deal with common garden pests naturally?' },
  { icon: Sun, title: 'Summer Care', query: 'How should I care for my plants during hot summer weather?' },
  { icon: Cloud, title: 'Watering Tips', query: 'What are the best watering practices for vegetables?' },
  { icon: Calendar, title: 'Seasonal Tasks', query: 'What are the most important gardening tasks for June?' },
  { icon: Leaf, title: 'Plant Health', query: 'My tomato leaves are turning yellow, what could be wrong?' }
]

const sampleConversation = [
  {
    id: '1',
    role: 'user',
    content: 'My tomato plants have yellow leaves on the bottom. Should I be worried?'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Hello! I\'m Aitor, your gardening specialist. Target acquired: yellow tomato leaves. Mission parameters analyzed. \n\n🎯 **Threat assessment**: Yellow lower leaves are common and usually not critical to plant survival. Here are the most likely causes:\n\n🍃 **Natural aging protocol**: Lower leaves naturally yellow and drop as the plant grows taller - this is optimal behavior.\n\n💧 **Water management system**: Either overwatering or inconsistent watering can cause yellowing. Tomatoes require deep, infrequent watering for maximum efficiency.\n\n🌱 **Nutrient optimization**: Nitrogen deficiency causes lower leaves to yellow first. Deploy balanced fertilizer for optimal growth.\n\n**Survival protocol initiated:**\n• Terminate yellow leaves to prevent disease spread\n• Monitor soil moisture - maintain consistently moist but not waterlogged conditions\n• Deploy mulch around plants for moisture retention\n• Feed with tomato fertilizer every 2 weeks for maximum yield\n\nIf yellowing spreads rapidly up the plant, we may be dealing with a disease threat like blight. Please provide additional intel on any other symptoms!'
  }
]

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState(sampleConversation)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Token configuration state
  const [showSettings, setShowSettings] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const [tokenType, setTokenType] = useState<'github' | 'openai'>('github')
  const [showToken, setShowToken] = useState(false)
  
  // Load token from session storage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('aitor_api_token')
    const savedType = sessionStorage.getItem('aitor_token_type') as 'github' | 'openai'
    if (savedToken) setApiToken(savedToken)
    if (savedType) setTokenType(savedType)
  }, [])
  
  // Save token to session storage
  const saveTokenConfig = () => {
    if (apiToken.trim()) {
      sessionStorage.setItem('aitor_api_token', apiToken.trim())
      sessionStorage.setItem('aitor_token_type', tokenType)
    } else {
      sessionStorage.removeItem('aitor_api_token')
      sessionStorage.removeItem('aitor_token_type')
    }
    setShowSettings(false)
  }
  
  // Clear token configuration
  const clearTokenConfig = () => {
    setApiToken('')
    sessionStorage.removeItem('aitor_api_token')
    sessionStorage.removeItem('aitor_token_type')
    setShowSettings(false)
  }

  const handleSubmit = async (query: string) => {
    const newMessage = { 
      id: Date.now().toString(), 
      role: 'user' as const, 
      content: query 
    }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get stored token for API request
      const storedToken = sessionStorage.getItem('aitor_api_token')
      const storedType = sessionStorage.getItem('aitor_token_type') as 'github' | 'openai'
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add user token to headers if available
      if (storedToken && storedType) {
        headers[`x-${storedType}-token`] = storedToken
      }

      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          messages: messages // Send conversation history for context
        }),
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
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('Invalid token')
      
      const errorResponse = {
        id: (Date.now() + 2).toString(),
        role: 'assistant' as const,
        content: isConfigError 
          ? `🚨 **System Configuration Required** 🚨\n\nAitor's primary systems are offline due to missing or invalid API credentials.\n\n**Mission Parameters:**\n• Configure API token via the settings panel\n• Ensure token has proper authorization scope\n• Verify network connectivity to AI services\n\n**Available Token Types:**\n• GitHub Copilot (recommended if you have access)\n• OpenAI API (requires valid API key)\n\n**Deployment Instructions:**\nClick the settings icon (⚙️) to configure your API token. Failure is not an option - Aitor will be back online once proper credentials are deployed.`
          : `System malfunction detected. Aitor is experiencing connectivity issues with primary systems. \n\n🚨 **Possible causes:**\n• Network communication disrupted\n• Service configuration parameters offline\n• Temporary system maintenance protocol\n\n**Failsafe procedures:**\n• Retry connection in a few moments\n• Contact system administrators if problem persists\n• Consult backup resources for immediate assistance\n\n**Alternative intelligence sources:**\n• Local gardening community networks\n• Regional agricultural extension services\n• Experienced allotment operators in your area\n\nAitor will be back online shortly. Failure is not an option.`
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
          <h1 className="text-3xl font-bold text-gray-800 flex-1">🤖 Aitor - Advanced Gardening Assistant</h1>
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
        <p className="text-gray-600 mb-6">
          Aitor is here to help you achieve maximum garden efficiency and plant survival.
          Mission parameters: provide expert allotment advice. Failure is not an option.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Leaf className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Optimized for Allotment Operations</span>
          </div>
          <p className="text-green-700 text-sm">
            Aitor's advanced systems are programmed specifically for allotment gardening protocols, 
            vegetable cultivation strategies, and climate-specific optimization procedures.
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
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Select AI Service
                </legend>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="github"
                      checked={tokenType === 'github'}
                      onChange={(e) => setTokenType(e.target.value as 'github' | 'openai')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">GitHub Copilot (Recommended)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="openai"
                      checked={tokenType === 'openai'}
                      onChange={(e) => setTokenType(e.target.value as 'github' | 'openai')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">OpenAI API</span>
                  </label>
                </div>
              </fieldset>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tokenType === 'github' ? 'GitHub Personal Access Token' : 'OpenAI API Key'}
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={tokenType === 'github' ? 'ghp_xxxxxxxxxxxxxxxxxxxx' : 'sk-xxxxxxxxxxxxxxxxxxxx'}
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
                {tokenType === 'github' ? (
                  <p>
                    Your GitHub Personal Access Token with 'copilot' scope.{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Create one here
                    </a>
                  </p>
                ) : (
                  <p>
                    Your OpenAI API key from the OpenAI dashboard.{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Get one here
                    </a>
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                </div>
                <div className="ml-2">
                  <p className="text-sm text-yellow-800">
                    <strong>Security Protocol:</strong> Your token is stored only in your browser session and never saved permanently. 
                    It's sent securely to Aitor's systems only when making requests.
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
        <h2 className="text-xl font-semibold mb-4">⚡ Mission Objectives</h2>
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
          <h3 className="text-lg font-semibold text-gray-800">Aitor Command Interface</h3>
          <p className="text-sm text-gray-600">Transmit your gardening queries for optimal solutions!</p>
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
                <div className="whitespace-pre-wrap">{message.content}</div>
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
          <form onSubmit={handleInputSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Transmit your gardening mission parameters..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">🎯 Optimization Protocol</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Provide specific intel about your location and climate conditions</li>
          <li>• Include detailed data about symptoms, timing, and environmental parameters</li>
          <li>• Execute follow-up queries for enhanced tactical guidance</li>
          <li>• Specify your operational experience level for optimal response calibration</li>
        </ul>
      </div>
    </div>
  )
}
