/**
 * Hosted season-narration route — auth gate, quota enforcement, and the
 * prompt contract: the Gemini call must be built from the stripped narration
 * payload (no internal ids), with the narration system prompt and low
 * temperature.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetToken = vi.fn<(opts?: { template?: string }) => Promise<string | null>>(
  async () => 'supabase-token'
)
const mockAuth = vi.fn(async () => ({
  userId: 'user_test_123' as string | null,
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

vi.mock('@/lib/server-rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}))

const { POST } = await import('@/app/api/season-narration/route')
const { callGemini } = await import('@/lib/ai/gemini')
const { getCurrentUsage, incrementUsage } = await import('@/lib/supabase/ai-usage')
const { checkRateLimit } = await import('@/lib/server-rate-limiter')

const callGeminiMock = vi.mocked(callGemini)
const getCurrentUsageMock = vi.mocked(getCurrentUsage)
const incrementUsageMock = vi.mocked(incrementUsage)
const checkRateLimitMock = vi.mocked(checkRateLimit)

// A full Finding as the client library sends it — including the internal ids
// the route must strip before the model ever sees them.
const REQUEST_BODY = {
  year: 2025,
  allotmentName: 'Bonnie Wee Plot',
  findings: [
    {
      id: 'cold-soil:2025:p1',
      ruleId: 'cold-soil',
      severity: 'warning',
      summary: 'Peas sown 2025-03-12 into 6.5°C soil, below their 7°C minimum.',
      metrics: { soilTempC: 6.5, minSoilTempC: 7 },
      entities: [
        { areaId: 'internal-area-1', areaName: 'Bed A', plantId: 'peas', plantName: 'Peas' },
      ],
      dates: { start: '2025-03-12' },
    },
  ],
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/season-narration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Season narration API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GEMINI_API_KEY', 'gemini-test-key')
    mockAuth.mockResolvedValue({ userId: 'user_test_123', getToken: mockGetToken })
    mockGetToken.mockResolvedValue('supabase-token')
    checkRateLimitMock.mockResolvedValue({ allowed: true, remaining: 9, resetInSeconds: 0 })
    getCurrentUsageMock.mockResolvedValue({ yearMonth: '2026-07', requestCount: 3, remaining: 27 })
    callGeminiMock.mockResolvedValue({ text: 'A fine season on the plot.' })
    incrementUsageMock.mockResolvedValue(4)
  })

  it('rejects unauthenticated callers with 401 and never calls Gemini', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, getToken: mockGetToken })

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toMatch(/sign in/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid body with 400', async () => {
    const response = await POST(createRequest({ findings: [] }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/validation error/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
  })

  it('returns 500 when the server has no Gemini key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toMatch(/not available/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
  })

  it('enforces the short-window rate limit with 429 and Retry-After', async () => {
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 120 })

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('120')
    expect(data.error).toMatch(/too many requests/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
  })

  it('returns the quota-exhausted 429 without calling Gemini or burning quota', async () => {
    getCurrentUsageMock.mockResolvedValueOnce({ yearMonth: '2026-07', requestCount: 30, remaining: 0 })

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.quotaExceeded).toBe(true)
    expect(data.error).toMatch(/30 free AI requests/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
    expect(incrementUsageMock).not.toHaveBeenCalled()
  })

  it('fails safe with 500 when the quota check itself errors', async () => {
    getCurrentUsageMock.mockRejectedValueOnce(new Error('supabase down'))

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toMatch(/quota/i)
    expect(callGeminiMock).not.toHaveBeenCalled()
  })

  it('narrates via Gemini with the stripped prompt contract, then increments usage', async () => {
    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.text).toBe('A fine season on the plot.')

    expect(callGeminiMock).toHaveBeenCalledTimes(1)
    const call = callGeminiMock.mock.calls[0][0]
    expect(call.apiKey).toBe('gemini-test-key')
    expect(call.history).toEqual([])
    expect(call.temperature).toBe(0.2)
    // The narration system prompt, not Aitor's.
    expect(call.systemPrompt).toContain('Never write a number that does not appear in the findings')
    expect(call.systemPrompt).toContain('Do not mention coordinates')
    // Findings + allotment name + year are the only season data sent…
    expect(call.userMessage).toContain('Allotment: Bonnie Wee Plot')
    expect(call.userMessage).toContain('Season: 2025')
    expect(call.userMessage).toContain('Peas sown 2025-03-12')
    expect(call.userMessage).toContain('"soilTempC":6.5')
    expect(call.userMessage).toContain('Bed A')
    // …and internal ids never reach the model even though the client sent them.
    expect(call.userMessage).not.toContain('cold-soil:2025:p1')
    expect(call.userMessage).not.toContain('internal-area-1')
    expect(call.userMessage).not.toContain('"areaId"')
    expect(call.userMessage).not.toContain('"plantId"')
    expect(call.userMessage).not.toContain('"ruleId"')

    expect(incrementUsageMock).toHaveBeenCalledWith('supabase-token', 'user_test_123')
  })

  it('passes through a Gemini failure status without incrementing usage', async () => {
    const err = new Error('Gemini overloaded') as Error & { status?: number }
    err.status = 503
    callGeminiMock.mockRejectedValueOnce(err)

    const response = await POST(createRequest(REQUEST_BODY))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('Gemini overloaded')
    expect(incrementUsageMock).not.toHaveBeenCalled()
  })
})
