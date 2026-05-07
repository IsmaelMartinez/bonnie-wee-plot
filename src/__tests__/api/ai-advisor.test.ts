/**
 * AI Advisor API Route Tests
 * Focus: Input validation and error handling that affects users
 * Not testing: Implementation details like model selection or prompt formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Clerk's server-side auth() — every test except the "unauthenticated"
// case runs as a signed-in user. The unauthenticated test overrides this.
const mockAuth = vi.fn<() => Promise<{ userId: string | null }>>(async () => ({
  userId: 'user_test_123',
}))
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

const { POST } = await import('@/app/api/ai-advisor/route')

// Mock fetch - necessary for API route testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AI Advisor API - Validation & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test_123' })
    vi.stubEnv('OPENAI_API_KEY', '')
  })

  describe('Authentication', () => {
    it('rejects requests from unauthenticated callers with 401', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null })
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-valid-key-12345678901234')

      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toMatch(/sign in/i)
      // The env key must not have been used.
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  function createRequest(
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
  ): NextRequest {
    return new NextRequest('http://localhost:3000/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  }

  describe('Input Validation', () => {
    it('rejects requests without a message', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-valid-key-12345')

      const response = await POST(createRequest({}))
      const data = await response.json()

      expect(response.status).toBe(400)
      // Validation returns error about missing/invalid message
      expect(data.error).toMatch(/message|required|string/i)
    })

    it('rejects malformed API tokens', async () => {
      const response = await POST(createRequest(
        { message: 'Hello' },
        { 'x-openai-token': 'bad' } // Too short
      ))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid OpenAI API token format')
    })

    it('returns clear error when no API key is configured', async () => {
      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('AI service not configured')
    })
  })

  describe('API Error Handling', () => {
    beforeEach(() => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-valid-key-12345678901234')
    })

    it('handles invalid API token (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid API key' })
      })

      const response = await POST(createRequest(
        { message: 'Test' },
        { 'x-openai-token': 'sk-invalid-but-valid-format-token' }
      ))

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Invalid API token')
    })

    it('handles rate limiting (429) with helpful message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' })
      })

      const response = await POST(createRequest(
        { message: 'Test' },
        { 'x-openai-token': 'sk-valid-format-token-12345678901' }
      ))

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toContain('Rate limit')
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const response = await POST(createRequest({ message: 'Test' }))

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Successful Flow', () => {
    it('returns AI response for valid request', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-valid-key-12345678901234')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Plant tomatoes in spring.' } }],
          usage: { total_tokens: 100 }
        })
      })

      const response = await POST(createRequest({ message: 'When to plant tomatoes?' }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe('Plant tomatoes in spring.')
    })
  })
})
