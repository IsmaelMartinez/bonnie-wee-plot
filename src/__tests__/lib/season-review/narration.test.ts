/**
 * Narration client (Phase 2c) — mocked-fetch tests for the OpenAI-compatible
 * request shape, the prompt contract, error handling, and the verified /
 * rejected orchestration in narrateSeason.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Finding } from '@/lib/season-review/findings'
import {
  buildNarrationMessages,
  narrateSeason,
  OLLAMA_PRESET,
  requestNarration,
  type NarrationSettings,
} from '@/lib/season-review/narration'

const FINDINGS: Finding[] = [
  {
    id: 'cold-soil:2025:p1',
    ruleId: 'cold-soil',
    severity: 'warning',
    summary: 'Peas sown 2025-03-12 into 6.5°C soil, below their 7°C minimum.',
    metrics: { soilTempC: 6.5, minSoilTempC: 7 },
    entities: [{ areaId: 'a1', areaName: 'Bed A', plantId: 'peas', plantName: 'Peas' }],
    dates: { start: '2025-03-12' },
  },
]

const META = { year: 2025, allotmentName: 'Bonnie Wee Plot' }
const SETTINGS: NarrationSettings = { baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' }

function okResponse(content: string | null) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as Response
}

describe('buildNarrationMessages', () => {
  it('sends the findings, allotment name and year — and only that', () => {
    const [system, user] = buildNarrationMessages(FINDINGS, META)
    expect(system.role).toBe('system')
    expect(user.role).toBe('user')
    expect(user.content).toContain('Allotment: Bonnie Wee Plot')
    expect(user.content).toContain('Season: 2025')
    expect(user.content).toContain('Peas sown 2025-03-12')
    expect(user.content).toContain('"soilTempC": 6.5')
    expect(user.content).toContain('Bed A')
    // Internal ids are payload noise the model has no use for.
    expect(user.content).not.toContain('cold-soil:2025:p1')
    expect(user.content).not.toContain('"areaId"')
  })

  it('omits the allotment line when no name is set', () => {
    const [, user] = buildNarrationMessages(FINDINGS, { year: 2025 })
    expect(user.content).not.toContain('Allotment:')
  })

  it('forbids invented numbers and mentioning locations in the system prompt', () => {
    const [system] = buildNarrationMessages(FINDINGS, META)
    expect(system.content).toContain('Never write a number that does not appear in the findings')
    expect(system.content).toContain('coordinates')
  })
})

describe('requestNarration', () => {
  it('POSTs an OpenAI-compatible body to <baseUrl>/chat/completions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('A fine season.'))
    const text = await requestNarration(FINDINGS, META, SETTINGS, fetchMock)

    expect(text).toBe('A fine season.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:11434/v1/chat/completions')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['Authorization']).toBeUndefined()

    const body = JSON.parse(init.body)
    expect(body.model).toBe('llama3.2')
    expect(body.temperature).toBe(0.2)
    expect(body.stream).toBe(false)
    expect(body.messages).toHaveLength(2)
  })

  it('tolerates trailing slashes and whitespace on the base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('ok'))
    await requestNarration(FINDINGS, META, { ...SETTINGS, baseUrl: ' https://llm.example/v1/ ' }, fetchMock)
    expect(fetchMock.mock.calls[0][0]).toBe('https://llm.example/v1/chat/completions')
  })

  it('sends a bearer token only when an API key is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('ok'))
    await requestNarration(FINDINGS, META, { ...SETTINGS, apiKey: 'sk-test' }, fetchMock)
    expect(fetchMock.mock.calls[0][1].headers['Authorization']).toBe('Bearer sk-test')
  })

  it('throws with status and detail on a non-OK response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'model "nope" not found' } }),
    } as Response)
    await expect(requestNarration(FINDINGS, META, SETTINGS, fetchMock)).rejects.toThrow(
      'Narration endpoint returned 404: model "nope" not found'
    )
  })

  it('throws with just the status when the error body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json')
      },
    } as unknown as Response)
    await expect(requestNarration(FINDINGS, META, SETTINGS, fetchMock)).rejects.toThrow(
      'Narration endpoint returned 502'
    )
  })

  it('throws on an empty completion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('   '))
    await expect(requestNarration(FINDINGS, META, SETTINGS, fetchMock)).rejects.toThrow(
      'empty completion'
    )
  })

  it('propagates network failures', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(requestNarration(FINDINGS, META, SETTINGS, fetchMock)).rejects.toThrow(
      'Failed to fetch'
    )
  })

  describe('timeout', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('passes an abort signal to fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue(okResponse('ok'))
      await requestNarration(FINDINGS, META, SETTINGS, fetchMock)
      expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false)
    })

    it('aborts a hung request after the timeout instead of loading forever', async () => {
      vi.useFakeTimers()
      // A fetch that never resolves — it only rejects when its signal aborts.
      const fetchMock = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            )
          })
      )
      const pending = requestNarration(
        FINDINGS,
        META,
        SETTINGS,
        fetchMock as unknown as typeof fetch
      )
      const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
      await vi.advanceTimersByTimeAsync(60_000)
      await assertion
    })
  })
})

describe('narrateSeason', () => {
  it('returns ok for a draft whose numbers the findings vouch for', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse('Your peas went into 6.5°C soil on 12 March — under the 7°C they prefer.')
    )
    const result = await narrateSeason(FINDINGS, META, SETTINGS, fetchMock)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.text).toContain('6.5°C')
    }
  })

  it('rejects a draft with an invented number — the fallback path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse('Soil hit 6.5°C, and you lost around 40% of the crop.')
    )
    const result = await narrateSeason(FINDINGS, META, SETTINGS, fetchMock)
    expect(result.status).toBe('rejected')
    if (result.status === 'rejected') {
      expect(result.unverifiedNumbers).toEqual(['40'])
      expect(result.text).toContain('40%')
    }
  })

  it('lets endpoint errors escape as exceptions rather than fake rejections', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(narrateSeason(FINDINGS, META, SETTINGS, fetchMock)).rejects.toThrow()
  })
})

describe('OLLAMA_PRESET', () => {
  it('defaults to a local Ollama with no API key', () => {
    expect(OLLAMA_PRESET.baseUrl).toBe('http://localhost:11434/v1')
    expect(OLLAMA_PRESET.apiKey).toBeUndefined()
  })
})
