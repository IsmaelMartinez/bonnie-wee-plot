import { NextRequest, NextResponse } from 'next/server'

// Alternative implementation for local AI models (like Ollama)
const GARDENING_SYSTEM_PROMPT = `You are an expert allotment gardening AI assistant with deep knowledge of:

🌱 EXPERTISE AREAS:
- Vegetable and herb cultivation in allotment/community garden settings
- Seasonal planting schedules and crop rotation
- Organic pest and disease management
- Soil health and composting
- Water management and irrigation
- Plant nutrition and natural fertilizers
- Companion planting strategies
- Harvest timing and food preservation
- Climate-specific growing advice

🎯 COMMUNICATION STYLE:
- Friendly, encouraging, and practical
- Use emojis sparingly but effectively
- Provide actionable, step-by-step advice
- Include timing recommendations when relevant
- Mention both immediate and long-term solutions
- Consider budget-friendly and sustainable approaches

🌍 CONTEXT AWARENESS:
- Assume Northern Hemisphere growing season unless specified
- Focus on practical allotment-scale solutions (not commercial farming)
- Consider resource constraints typical of community gardeners
- Emphasize organic and environmentally friendly methods

Always ask clarifying questions if you need more specific information about location, growing conditions, or experience level.`

export async function POST(request: NextRequest) {
  try {
    const { message, messages = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check which AI service to use
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const customEndpoint = process.env.CUSTOM_AI_ENDPOINT
    
    // Prepare conversation history
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    let aiResponse: string

    if (customEndpoint) {
      // Use custom/local AI endpoint (like Ollama)
      aiResponse = await callCustomAI(customEndpoint, message, conversationHistory)
    } else if (openaiKey) {
      // Use OpenAI
      aiResponse = await callOpenAI(openaiKey, message, conversationHistory)
    } else if (anthropicKey) {
      // Use Anthropic Claude
      aiResponse = await callAnthropic(anthropicKey, message, conversationHistory)
    } else {
      return NextResponse.json(
        { 
          error: 'No AI service configured. Please set up OPENAI_API_KEY, ANTHROPIC_API_KEY, or CUSTOM_AI_ENDPOINT in your environment variables.',
          suggestion: 'For free local AI, install Ollama and set CUSTOM_AI_ENDPOINT=http://localhost:11434/v1/chat/completions'
        },
        { status: 500 }
      )
    }

    // Determine provider for response
    let provider = 'anthropic'
    if (customEndpoint) {
      provider = 'custom'
    } else if (openaiKey) {
      provider = 'openai'
    }

    return NextResponse.json({ 
      response: aiResponse,
      provider
    })

  } catch (error) {
    console.error('AI Advisor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OpenAI Implementation
async function callOpenAI(apiKey: string, message: string, history: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: GARDENING_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }),
  })

  if (!response.ok) {
    throw new Error('OpenAI API error')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response received'
}

// Anthropic Claude Implementation
async function callAnthropic(apiKey: string, message: string, history: any[]) {
  // Convert conversation to Anthropic format
  const conversationText = history
    .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')
  
  const fullPrompt = `${GARDENING_SYSTEM_PROMPT}\n\n${conversationText}\n\nHuman: ${message}\n\nAssistant:`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: fullPrompt }
      ]
    }),
  })

  if (!response.ok) {
    throw new Error('Anthropic API error')
  }

  const data = await response.json()
  return data.content[0]?.text || 'No response received'
}

// Custom/Local AI Implementation (Ollama, etc.)
async function callCustomAI(endpoint: string, message: string, history: any[]) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CUSTOM_AI_MODEL || 'llama2',
      messages: [
        { role: 'system', content: GARDENING_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
      ],
      stream: false
    }),
  })

  if (!response.ok) {
    throw new Error('Custom AI endpoint error')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.message?.content || 'No response received'
}
