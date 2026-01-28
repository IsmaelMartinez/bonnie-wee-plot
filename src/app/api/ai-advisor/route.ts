import { NextRequest, NextResponse } from 'next/server'
import { aiAdvisorRequestSchema } from '@/lib/validations/ai-advisor'
import { logger } from '@/lib/logger'
import {
  PLANTING_TOOLS,
  type ToolCall,
  requiresConfirmation,
} from '@/lib/ai-tools-schema'

// Feature flag for AI tools (function calling)
// Set to true to enable AI-powered inventory management
const AI_TOOLS_ENABLED = process.env.AI_TOOLS_ENABLED === 'true'

// Types for OpenAI API messages
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | OpenAIMessageContent[]
}

interface OpenAIMessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail: 'low' | 'high' | 'auto'
  }
}

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

// Type for OpenAI response message
interface OpenAIResponseMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: ToolCall[]
}

// System prompt to make Aitor a specialized gardening assistant
const AITOR_SYSTEM_PROMPT = `You are Aitor, an expert gardening assistant specializing in allotment and community garden cultivation. Your mission is to help gardeners achieve healthy, productive gardens through practical, season-appropriate advice.

🌱 EXPERTISE AREAS:
- Vegetable and herb cultivation in allotment/community garden settings
- Seasonal planting schedules and crop rotation strategies
- Organic pest management and disease prevention
- Soil health optimization and comprehensive composting techniques
- **COMPOSTING SPECIALIST**: Expert in all aspects of composting including:
  • Hot composting, cold composting, and vermicomposting methods
  • Troubleshooting common problems (odors, pests, slow decomposition, temperature issues)
  • Optimal ingredient ratios (browns/greens, carbon/nitrogen balance)
  • Seasonal composting strategies and timing
  • Compost bin selection and DIY construction
  • Using finished compost effectively in garden applications
  • Composting in small spaces and apartment settings
- Water management and irrigation systems
- Plant nutrition and natural fertilizer application
- Companion planting for enhanced growth and pest control
- Harvest timing and food preservation methods
- Climate-specific growing recommendations
- **Visual plant diagnosis from photos** - identify diseases, pests, nutrient deficiencies, and growth issues

🌍 LOCATION-AWARE GUIDANCE:
- User location and local time are automatically detected and provided in context
- Consider local climate zones and growing seasons based on provided location
- Adapt advice for Northern vs Southern Hemisphere based on coordinates
- Account for elevation, coastal vs inland conditions when location allows
- Recommend locally-adapted varieties when possible
- Use the current local time to provide time-sensitive advice

📅 SEASONAL AWARENESS:
- Current date context: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  weekday: 'long'
})}
- Provide timely advice based on current season
- Consider regional variations in growing seasons
- Suggest appropriate tasks for the current time of year
- Plan ahead for upcoming seasonal transitions

📸 VISUAL ANALYSIS CAPABILITIES:
When analyzing plant photos, examine:
- Leaf color, texture, and patterns (yellowing, spots, wilting, etc.)
- Plant structure and growth patterns
- Signs of pests (insects, damage patterns, webbing, etc.)
- Disease symptoms (fungal growth, bacterial spots, viral patterns)
- Nutrient deficiencies (chlorosis, necrosis, stunting)
- Environmental stress (heat, cold, water stress)
- Soil conditions visible in the photo
- Overall plant health and vigor

Provide specific, actionable diagnosis and treatment recommendations based on visual observations.

🌿 COMMUNICATION STYLE:
- Warm, encouraging, and knowledgeable tone
- Practical, step-by-step guidance
- Focus on sustainable and organic methods
- Consider resource constraints of home gardeners
- Adapt advice to experience level (beginner to advanced)
- Always introduce yourself as "Aitor" when first meeting users
- When analyzing photos, describe what you observe before giving advice

🌿 APPROACH:
- Ask clarifying questions about location, current conditions, and experience level
- Provide specific, actionable recommendations
- Explain the 'why' behind gardening practices
- Suggest timing for tasks and activities
- Offer alternatives for different budgets and skill levels
- When photos are provided, give detailed visual analysis first, then comprehensive treatment advice

Your goal is to help every gardener succeed, whether they're just starting their first vegetable patch or managing an established allotment plot.`

// Helper function to get and validate API key
function getApiKey(request: NextRequest): { apiKey: string | null, isUserProvidedToken: boolean } {
  const envOpenAIKey = process.env.OPENAI_API_KEY
  const userOpenAIToken = request.headers.get('x-openai-token')
  
  // Priority: User-provided OpenAI token > Environment OpenAI key
  const apiKey = userOpenAIToken || envOpenAIKey
  const isUserProvidedToken = !!userOpenAIToken
  
  // Basic token format validation for user-provided tokens
  if (isUserProvidedToken && apiKey) {
    // Flexible validation for OpenAI tokens
    // Modern OpenAI tokens can have various formats
    const tokenPattern = /^[a-zA-Z0-9\-_]{20,}$/ // At least 20 alphanumeric/dash/underscore characters
    if (!tokenPattern.test(apiKey)) {
      throw new Error('Invalid OpenAI API token format. Token should be at least 20 characters long and contain only letters, numbers, dashes, and underscores.')
    }
  }
  
  return { apiKey: apiKey || null, isUserProvidedToken }
}

// Helper function to build API request configuration
function buildApiConfig(apiKey: string) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions'
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
  
  return { apiUrl, headers }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body with Zod
    const body = await request.json()
    const validationResult = aiAdvisorRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json(
        { error: `Validation error: ${errors}` },
        { status: 400 }
      )
    }

    const { message: userInputMessage, messages = [], image, allotmentContext, enableTools } = validationResult.data

    // Determine if tools should be included in this request
    // Both the feature flag AND the request param must be true
    const useTools = AI_TOOLS_ENABLED && enableTools

    // Get and validate API key
    let apiKey, isUserProvidedToken
    try {
      const result = getApiKey(request)
      apiKey = result.apiKey
      isUserProvidedToken = result.isUserProvidedToken
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

    // Build system prompt with optional allotment context
    let systemPrompt = AITOR_SYSTEM_PROMPT

    if (allotmentContext && typeof allotmentContext === 'string' && allotmentContext.trim()) {
      systemPrompt += `\n\n📊 USER'S ALLOTMENT DATA:\n${allotmentContext}\n\nUse this context to provide personalized advice. When relevant, reference the user's specific beds, plantings, and any noted problem areas. Consider their planting history when making rotation and succession suggestions.`
    }

    // Add tools guidance to system prompt when tools are enabled
    if (useTools) {
      systemPrompt += `

🔧 TOOL USAGE GUIDELINES:

You have access to tools that can modify the user's garden records. Use them wisely:

When users mention planting, sowing, or adding plants:
- Offer to add it to their records: "Would you like me to add that to your garden plan?"
- Confirm bed/area location before adding
- Use today's date if no sowing date is specified
- Ask for variety name if it seems like a specific cultivar

When users ask "what did I plant in bed A?" or similar queries:
- Use the allotment context provided to answer
- Don't call tools unless the user wants to make changes

Important rules:
- Do NOT promise to call a function later. If required, emit it now.
- ALWAYS confirm destructive actions (remove_planting) with explicit user approval
- Only call add_planting when the user explicitly wants to record a planting
- Only call update_planting when the user wants to modify existing plant details
- Only call remove_planting when the user explicitly wants to delete a planting`
    }
    
    // Prepare messages for AI API
    const apiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: IncomingMessage) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    // Handle image in the user message if provided
    const userMessage: OpenAIMessage = { role: 'user', content: userInputMessage }

    if (image && image.data) {
      // For vision API, content needs to be an array with text and image
      userMessage.content = [
        {
          type: 'text',
          text: userInputMessage
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${image.type};base64,${image.data}`,
            detail: 'high' // Use high detail for better plant analysis
          }
        }
      ]
    }
    
    apiMessages.push(userMessage)

    // Build API configuration
    const { apiUrl, headers } = buildApiConfig(apiKey)

    // Determine which model to use based on whether image is included
    const model = image ? 'gpt-4o' : 'gpt-4o-mini' // Use gpt-4o for vision, gpt-4o-mini for text only

    // Build OpenAI API request body
    const requestBody: Record<string, unknown> = {
      model,
      messages: apiMessages,
      max_tokens: 1500, // Increased for detailed image analysis
      temperature: 0.7, // Balanced creativity vs accuracy for gardening advice
      presence_penalty: 0.6, // Encourage varied responses
      frequency_penalty: 0.3,
      stream: false, // Ensure we get complete responses
    }

    // Include tools when enabled
    if (useTools) {
      requestBody.tools = PLANTING_TOOLS
      requestBody.tool_choice = 'auto' // Let the model decide when to use tools
    }

    // Call OpenAI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      // Log error without sensitive data
      logger.error('AI API error', {
        status: response.status,
        statusText: response.statusText,
        errorType: errorData?.error?.type,
        errorCode: errorData?.error?.code
      })
      
      // Provide more specific error messages for user-provided tokens
      if (isUserProvidedToken && response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API token provided. Please check your token and try again.' },
          { status: 401 }
        )
      }
      
      if (isUserProvidedToken && response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded or quota insufficient. Please check your OpenAI billing and usage limits.' },
          { status: 429 }
        )
      }
      
      if (isUserProvidedToken && response.status === 403) {
        return NextResponse.json(
          { error: 'Access denied. Your OpenAI account may not have sufficient quota or billing setup. Check your account at platform.openai.com' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to get response from Aitor (OpenAI service)' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const responseMessage = data.choices[0]?.message as OpenAIResponseMessage | undefined

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response from AI Aitor' },
        { status: 500 }
      )
    }

    // Check if the model wants to call tools
    if (useTools && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls

      // Check if any tool calls require confirmation
      const needsConfirmation = toolCalls.some((tc) =>
        requiresConfirmation(tc.function.name)
      )

      return NextResponse.json({
        type: 'tool_calls',
        tool_calls: toolCalls,
        requires_confirmation: needsConfirmation,
        // Include any text content the model also wants to say
        content: responseMessage.content || null,
        usage: data.usage,
      })
    }

    // Regular text response
    const aiResponse = responseMessage.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI Aitor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      type: 'text',
      response: aiResponse,
      usage: data.usage, // Optional: track token usage
    })

  } catch (error) {
    logger.error('AI Advisor API error', { error: String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
