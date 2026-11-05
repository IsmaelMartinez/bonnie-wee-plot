/**
 * AI Advisor API Route Tests
 * Focus: Input validation and error handling that affects users
 * Not testing: Implementation details like model selection or prompt formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Clerk's server-side auth() — every test except the "unauthenticated"
// case runs as a signed-in user. The unauthenticated test overrides this.
const mockGetToken = vi.fn<(opts?: { template?: string }) => Promise<string | null>>(
  async () => 'supabase-token'
)
const mockAuth = vi.fn<
  () => Promise<{ userId: string | null; getToken?: typeof mockGetToken }>
>(async () => ({
  userId: 'user_test_123',
  getToken: mockGetToken,
}))
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

vi.mock('@/lib/ai/gemini', () => ({
  callGemini: vi.fn(),
}))

vi.mock('@/lib/supabase/ai-usage', () => ({
  FREE_TIER_MONTHLY_QUOTA: 30,
  getCurrentUsage: vi.fn(),
  incrementUsage: vi.fn(),
}))

const { POST } = await import('@/app/api/ai-advisor/route')
const { callGemini } = await import('@/lib/ai/gemini')
const { getCurrentUsage, incrementUsage } = await import('@/lib/supabase/ai-usage')
const callGeminiMock = vi.mocked(callGemini)
const getCurrentUsageMock = vi.mocked(getCurrentUsage)
const incrementUsageMock = vi.mocked(incrementUsage)

// Mock fetch - necessary for API route testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AI Advisor API - Validation & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test_123', getToken: mockGetToken })
    mockGetToken.mockResolvedValue('supabase-token')
    vi.stubEnv('OPENAI_API_KEY', '')
    vi.stubEnv('GEMINI_API_KEY', '')
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

  describe('Free-tier quota (server-side Gemini)', () => {
    beforeEach(() => {
      vi.stubEnv('GEMINI_API_KEY', 'gemini-test-key')
      getCurrentUsageMock.mockResolvedValue({ yearMonth: '2026-10', requestCount: 3, remaining: 27 })
      callGeminiMock.mockResolvedValue({ text: 'Mulch the beds.' })
      incrementUsageMock.mockResolvedValue(4)
    })

    it('returns the quota-exhausted 429 without calling Gemini or burning quota', async () => {
      getCurrentUsageMock.mockResolvedValueOnce({ yearMonth: '2026-10', requestCount: 30, remaining: 0 })

      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.quotaExceeded).toBe(true)
      expect(data.error).toMatch(/30 free Aitor requests/i)
      expect(callGeminiMock).not.toHaveBeenCalled()
      expect(incrementUsageMock).not.toHaveBeenCalled()
    })

    it('fails safe with 500 when the quota check itself errors', async () => {
      getCurrentUsageMock.mockRejectedValueOnce(new Error('supabase down'))

      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toMatch(/quota/i)
      expect(callGeminiMock).not.toHaveBeenCalled()
    })

    it('answers via Gemini, then increments usage through the atomic RPC', async () => {
      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe('Mulch the beds.')
      expect(incrementUsageMock).toHaveBeenCalledTimes(1)
      expect(incrementUsageMock).toHaveBeenCalledWith('supabase-token')
    })

    it('still returns the Gemini answer when the usage increment fails', async () => {
      incrementUsageMock.mockRejectedValueOnce(new Error('function public.increment_ai_usage() does not exist'))

      const response = await POST(createRequest({ message: 'Hello' }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe('Mulch the beds.')
      expect(JSON.stringify(data)).not.toContain('increment_ai_usage')
    })

    it('does not burn quota when Gemini fails', async () => {
      const err = new Error('Gemini overloaded') as Error & { status?: number }
      err.status = 503
      callGeminiMock.mockRejectedValueOnce(err)

      const response = await POST(createRequest({ message: 'Hello' }))

      expect(response.status).toBe(503)
      expect(incrementUsageMock).not.toHaveBeenCalled()
    })
  })
})
