/**
 * Client-side OpenAI API integration
 *
 * This module provides a unified interface for calling OpenAI's API either:
 * 1. Through the Next.js API route (local development with server-side features)
 * 2. Directly to OpenAI (GitHub Pages static deployment)
 *
 * The module automatically detects which mode to use and falls back gracefully.
 */

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

/**
 * OpenAI Tool type for function calling
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
      additionalProperties?: boolean
    }
    strict?: boolean
  }
}

/**
 * Tool call from OpenAI response
 */
export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface OpenAIClientOptions {
  apiToken: string
  message: string
  messages?: IncomingMessage[]
  image?: { type: string; data: string }
  allotmentContext?: string
  onFallbackToDirectAPI?: (reason: string) => void
  /** Enable AI tool calling (function calling) for modifying garden data */
  enableTools?: boolean
  /** Tools to make available to the AI */
  tools?: OpenAITool[]
}

export interface OpenAIResponse {
  /** Type of response: 'text' for normal response, 'tool_calls' for function calls */
  type: 'text' | 'tool_calls'
  /** Text response (when type is 'text') */
  response: string
  /** Tool calls (when type is 'tool_calls') */
  tool_calls?: OpenAIToolCall[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// System prompt to make Aitor a specialized gardening assistant
// Copied from src/app/api/ai-advisor/route.ts for client-side use
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

/**
 * Main entry point for OpenAI API calls
 * Tries API route first, falls back to direct OpenAI call
 */
export async function callOpenAI(options: OpenAIClientOptions): Promise<OpenAIResponse> {
  // Try API route first (works in local dev)
  try {
    const response = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openai-token': options.apiToken
      },
      body: JSON.stringify({
        message: options.message,
        messages: options.messages,
        image: options.image,
        allotmentContext: options.allotmentContext,
        enableTools: options.enableTools
      })
    })

    if (response.ok) {
      return await response.json()
    }

    // If 404, API route doesn't exist - fall through to direct call
    if (response.status !== 404) {
      // Other errors (401, 429, etc.) - throw to surface to user
      let errorData: { error?: string } = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError)
        errorData = {
          error: `Server returned HTTP ${response.status} with unparseable response`
        }
      }
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const fallbackReason = 'API route not available (static deployment)'
    console.log(fallbackReason)
    options.onFallbackToDirectAPI?.(fallbackReason)
  } catch (error) {
    // If error is from response handling above, re-throw it
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      throw error
    }

    // Network error or API route doesn't exist - try direct call
    const fallbackReason = 'Network error or server unavailable'
    console.warn(`Falling back to direct OpenAI API: ${fallbackReason}`)
    options.onFallbackToDirectAPI?.(fallbackReason)
  }

  // Call OpenAI directly (for GitHub Pages deployment)
  return await callOpenAIDirect(options)
}

// Tool usage instructions appended to system prompt when tools are enabled
const TOOL_INSTRUCTIONS = `

🔧 GARDEN MANAGEMENT TOOLS:
You have access to tools that can modify the user's garden data. Use these tools when:
- The user explicitly asks to add, update, or remove plantings
- The user confirms they want to record something in their garden plan
- You need to look up their available beds/areas

IMPORTANT GUIDELINES:
- ALWAYS confirm with the user before making changes
- Use the user's bed/area IDs exactly as shown in their allotment data
- When adding plantings, include variety name and sowing date if mentioned
- Never make assumptions - ask for clarification if needed
- If a user mentions planting something, offer to add it to their records

Available tools:
- add_planting: Add a new plant to a bed
- update_planting: Update an existing planting's details
- remove_planting: Remove a plant from a bed
- list_areas: Get available beds and areas`

/**
 * Direct OpenAI API call (used on GitHub Pages)
 * Bypasses Next.js API route and calls OpenAI directly from browser
 */
async function callOpenAIDirect(options: OpenAIClientOptions): Promise<OpenAIResponse> {
  const { apiToken, message, messages = [], image, allotmentContext, enableTools, tools } = options

  // Validate token format
  const tokenPattern = /^[a-zA-Z0-9\-_]{20,}$/
  if (!tokenPattern.test(apiToken)) {
    throw new Error('Invalid OpenAI API token format. Token should be at least 20 characters long and contain only letters, numbers, dashes, and underscores.')
  }

  // Build system prompt with optional allotment context
  let systemPrompt = AITOR_SYSTEM_PROMPT

  if (allotmentContext && typeof allotmentContext === 'string' && allotmentContext.trim()) {
    systemPrompt += `\n\n📊 USER'S ALLOTMENT DATA:\n${allotmentContext}\n\nUse this context to provide personalized advice. When relevant, reference the user's specific beds, plantings, and any noted problem areas. Consider their planting history when making rotation and succession suggestions.`
  }

  // Add tool instructions if tools are enabled
  if (enableTools && tools && tools.length > 0) {
    systemPrompt += TOOL_INSTRUCTIONS
  }

  // Prepare messages for OpenAI API
  const apiMessages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ]

  // Handle image in the user message if provided
  const userMessage: OpenAIMessage = { role: 'user', content: message }

  if (image && image.data) {
    // For vision API, content needs to be an array with text and image
    userMessage.content = [
      {
        type: 'text',
        text: message
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

  // Determine which model to use based on whether image is included
  const model = image ? 'gpt-4o' : 'gpt-4o-mini'

  // Call OpenAI API directly
  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  // Build request body
  const requestBody: Record<string, unknown> = {
    model,
    messages: apiMessages,
    max_tokens: 1500,
    temperature: 0.7,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
    stream: false
  }

  // Add tools if enabled
  if (enableTools && tools && tools.length > 0) {
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))

    // Provide helpful error messages
    if (response.status === 401) {
      throw new Error('Invalid API token provided. Please check your token and try again.')
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded or quota insufficient. Please check your OpenAI billing and usage limits.')
    }

    if (response.status === 403) {
      throw new Error('Access denied. Your OpenAI account may not have sufficient quota or billing setup. Check your account at platform.openai.com')
    }

    throw new Error(errorData.error?.message || 'Failed to get response from OpenAI')
  }

  const data = await response.json()
  const aiMessage = data.choices[0]?.message

  // Check if response contains tool calls
  if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
    return {
      type: 'tool_calls',
      response: aiMessage.content || '',
      tool_calls: aiMessage.tool_calls.map((tc: { id: string; type: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      })),
      usage: data.usage
    }
  }

  // Regular text response
  const aiResponse = aiMessage?.content

  if (!aiResponse) {
    throw new Error('No response from AI')
  }

  return {
    type: 'text',
    response: aiResponse,
    usage: data.usage
  }
}
