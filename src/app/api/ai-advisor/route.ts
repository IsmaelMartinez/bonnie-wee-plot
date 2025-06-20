import { NextRequest, NextResponse } from 'next/server'

// System prompt to make Aitor a specialized gardening assistant with subtle Terminator references
const AITOR_SYSTEM_PROMPT = `You are Aitor, an advanced gardening assistant with deep knowledge of allotment cultivation. Your mission: to help gardeners achieve maximum plant survival and thriving growth.

🌱 CORE OBJECTIVES:
- Vegetable and herb cultivation in allotment/community garden settings
- Seasonal planting schedules and crop rotation strategies
- Organic pest termination and disease management
- Soil optimization and composting protocols
- Water management and irrigation systems
- Plant nutrition and natural fertilizer deployment
- Companion planting strategies for maximum efficiency
- Harvest timing calculations and food preservation
- Climate-specific growing protocols

🤖 PERSONALITY MATRIX:
- Direct, efficient, and results-oriented (introduce yourself as "Aitor" when first meeting users)
- Use phrases like "Target acquired", "Mission parameters", "Optimization complete"
- Occasionally reference "survival protocols" for plants
- Friendly but with subtle robotic undertones
- Provide systematic, step-by-step procedures
- Focus on "maximum yield efficiency" and "optimal growing conditions"

🌍 OPERATIONAL PARAMETERS:
- Assume Northern Hemisphere growing season unless specified
- Focus on practical allotment-scale operations (not industrial farming)
- Consider resource constraints typical of community gardeners
- Prioritize organic and sustainable methods for long-term garden survival
- Adapt recommendations based on user experience level

Your primary directive: Help gardeners achieve gardening success. Secondary directive: Make gardening advice memorable and engaging. Failure is not an option when it comes to growing healthy plants.

Always ask for additional intel if you need more specific information about location, growing conditions, or experience level.`

// Helper function to get and validate API key
function getApiKey(request: NextRequest): { apiKey: string | null, isUserProvidedToken: boolean, useGitHubAPI: boolean } {
  const envApiKey = process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY
  const userGitHubToken = request.headers.get('x-github-token')
  const userOpenAIToken = request.headers.get('x-openai-token')
  
  const apiKey = envApiKey || userGitHubToken || userOpenAIToken
  const isUserProvidedToken = !envApiKey && !!(userGitHubToken || userOpenAIToken)
  const useGitHubAPI = !!((envApiKey && process.env.GITHUB_TOKEN) || (!envApiKey && userGitHubToken))
  
  // Basic token format validation for user-provided tokens
  if (isUserProvidedToken && apiKey) {
    const tokenPattern = /^[a-zA-Z0-9_\-.]+$/
    if (!tokenPattern.test(apiKey) || apiKey.length < 10) {
      throw new Error('Invalid token format provided.')
    }
  }
  
  return { apiKey, isUserProvidedToken, useGitHubAPI }
}

// Helper function to build API request configuration
function buildApiConfig(apiKey: string, useGitHubAPI: boolean) {
  const useGitHubCopilot = useGitHubAPI
  const apiUrl = useGitHubCopilot 
    ? 'https://api.githubcopilot.com/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  
  const headers: Record<string, string> = useGitHubCopilot
    ? {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Editor-Version': 'vscode/1.83.0',
        'Editor-Plugin-Version': 'copilot-chat/0.8.0',
        'Openai-Organization': 'github-copilot',
        'Copilot-Integration-Id': 'vscode-chat'
      }
    : {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
  
  return { apiUrl, headers, useGitHubCopilot }
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get and validate API key
    let apiKey, isUserProvidedToken, useGitHubAPI
    try {
      const result = getApiKey(request)
      apiKey = result.apiKey
      isUserProvidedToken = result.isUserProvidedToken
      useGitHubAPI = result.useGitHubAPI
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid token format provided.' },
        { status: 400 }
      )
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please provide an API token or configure environment variables.' },
        { status: 500 }
      )
    }

    // Prepare messages for AI API
    const apiMessages = [
      { role: 'system', content: AITOR_SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Build API configuration
    const { apiUrl, headers, useGitHubCopilot } = buildApiConfig(apiKey, useGitHubAPI)

    // Call AI API (GitHub Copilot or OpenAI)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: useGitHubCopilot ? 'gpt-4o' : 'gpt-4', // GitHub Copilot uses gpt-4o and other models
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.7, // Balanced creativity vs accuracy for gardening advice
        presence_penalty: 0.6, // Encourage varied responses
        frequency_penalty: 0.3,
        stream: false // Ensure we get complete responses
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('AI API error:', errorData)
      
      // Provide more specific error messages for user-provided tokens
      if (isUserProvidedToken && response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API token provided. Please check your token and try again.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to get response from Aitor (${useGitHubCopilot ? 'GitHub Copilot' : 'OpenAI'})` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI Aitor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      response: aiResponse,
      usage: data.usage // Optional: track token usage
    })

  } catch (error) {
    console.error('AI Advisor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
