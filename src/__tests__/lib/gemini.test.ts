import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callGemini } from '@/lib/ai/gemini'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  delete process.env.GEMINI_MODEL
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const okResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
  }),
})

describe('callGemini', () => {
  it('hits the configured model with system prompt + history + user message', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('hello back'))

    const result = await callGemini({
      apiKey: 'k',
      systemPrompt: 'You are Aitor.',
      history: [
        { role: 'user', content: 'previous q' },
        { role: 'assistant', content: 'previous a' },
      ],
      userMessage: 'current question',
    })

    expect(result.text).toBe('hello back')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('gemini-2.5-flash:generateContent')
    // Key must travel as a header, never in the URL (avoids log leakage)
    expect(url).not.toContain('key=')
    expect((init as RequestInit).headers).toMatchObject({ 'x-goog-api-key': 'k' })
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.systemInstruction.parts[0].text).toBe('You are Aitor.')
    // Two history turns + one new user turn
    expect(body.contents).toHaveLength(3)
    expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'previous q' }] })
    expect(body.contents[1]).toEqual({ role: 'model', parts: [{ text: 'previous a' }] })
    expect(body.contents[2].role).toBe('user')
    expect(body.contents[2].parts[0].text).toBe('current question')
  })

  it('attaches an inline image when supplied', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('I see a tomato leaf with blight.'))

    await callGemini({
      apiKey: 'k',
      systemPrompt: 'sys',
      history: [],
      userMessage: 'what is wrong?',
      image: { type: 'image/jpeg', data: 'BASE64DATA' },
    })

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.contents).toHaveLength(1)
    expect(body.contents[0].parts).toHaveLength(2)
    expect(body.contents[0].parts[0]).toEqual({ text: 'what is wrong?' })
    expect(body.contents[0].parts[1]).toEqual({
      inline_data: { mime_type: 'image/jpeg', data: 'BASE64DATA' },
    })
  })

  it('honours GEMINI_MODEL env var', async () => {
    process.env.GEMINI_MODEL = 'gemini-3-flash'
    fetchMock.mockResolvedValueOnce(okResponse('ok'))

    await callGemini({
      apiKey: 'k',
      systemPrompt: 'sys',
      history: [],
      userMessage: 'hi',
    })

    expect(fetchMock.mock.calls[0][0]).toContain('gemini-3-flash:generateContent')
  })

  it('throws with the API error message on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 429, message: 'rate limit' } }),
    })

    await expect(
      callGemini({
        apiKey: 'k',
        systemPrompt: 'sys',
        history: [],
        userMessage: 'hi',
      }),
    ).rejects.toThrow('rate limit')
  })

  it('throws when the response has no text content', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [] } }] }),
    })

    await expect(
      callGemini({
        apiKey: 'k',
        systemPrompt: 'sys',
        history: [],
        userMessage: 'hi',
      }),
    ).rejects.toThrow(/empty response/)
  })

  it('skips system messages in history (system prompt is hoisted)', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('ok'))

    await callGemini({
      apiKey: 'k',
      systemPrompt: 'sys',
      history: [
        { role: 'system', content: 'should be ignored' },
        { role: 'user', content: 'q' },
      ],
      userMessage: 'now',
    })

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    // Only the non-system history turn + the new user turn make it through.
    expect(body.contents).toHaveLength(2)
    expect(body.contents.every((c: { role: string }) => c.role === 'user' || c.role === 'model')).toBe(true)
  })
})
