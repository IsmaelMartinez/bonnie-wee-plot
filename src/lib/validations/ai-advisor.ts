import { z } from 'zod'

/**
 * Validation schemas for AI Advisor API
 *
 * Provides runtime validation for incoming requests to prevent:
 * - Oversized payloads
 * - Invalid data types
 * - Missing required fields
 */

// Maximum sizes (in characters)
const MAX_MESSAGE_LENGTH = 10000
const MAX_CONTEXT_LENGTH = 50000
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // ~10MB in base64
const MAX_CONVERSATION_HISTORY = 50

// Message in conversation history
const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(MAX_MESSAGE_LENGTH, {
    message: `Message content must not exceed ${MAX_MESSAGE_LENGTH} characters`
  })
})

// Image data for vision API
const imageSchema = z.object({
  data: z.string().max(MAX_IMAGE_SIZE, {
    message: 'Image data too large. Maximum size is 10MB'
  }),
  type: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, {
    message: 'Image type must be jpeg, png, gif, or webp'
  })
}).optional()

// Main request schema
export const aiAdvisorRequestSchema = z.object({
  message: z.string({ error: 'Message is required' })
    .min(1, { message: 'Message is required' })
    .max(MAX_MESSAGE_LENGTH, {
      message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`
    }),
  messages: z.array(conversationMessageSchema)
    .max(MAX_CONVERSATION_HISTORY, {
      message: `Conversation history must not exceed ${MAX_CONVERSATION_HISTORY} messages`
    })
    .optional()
    .default([]),
  image: imageSchema,
  allotmentContext: z.string()
    .max(MAX_CONTEXT_LENGTH, {
      message: `Allotment context must not exceed ${MAX_CONTEXT_LENGTH} characters`
    })
    .optional()
})

// Type inference for validated request
export type AiAdvisorRequest = z.infer<typeof aiAdvisorRequestSchema>

// Response type (for documentation, not runtime validation)
export interface AiAdvisorResponse {
  response: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AiAdvisorError {
  error: string
}
