import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('sync-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchRemote returns data on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' }),
    })
    const { fetchRemote } = await import('@/lib/sync-client')
    const result = await fetchRemote()
    expect(result).toEqual({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' })
    expect(fetch).toHaveBeenCalledWith('/api/sync')
  })

  it('fetchRemote returns null on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    const { fetchRemote } = await import('@/lib/sync-client')
    const result = await fetchRemote()
    expect(result).toBeNull()
  })

  it('fetchRemote throws on other errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    const { fetchRemote } = await import('@/lib/sync-client')
    await expect(fetchRemote()).rejects.toThrow('Sync fetch failed (500)')
  })

  it('pushToRemote sends PUT with data', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const { pushToRemote } = await import('@/lib/sync-client')
    await pushToRemote(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: mockData }),
    })
  })

  it('pushToRemote throws on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const { pushToRemote } = await import('@/lib/sync-client')
    await expect(pushToRemote(mockData)).rejects.toThrow('Sync push failed (500)')
  })

  it('deleteRemote sends DELETE', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const { deleteRemote } = await import('@/lib/sync-client')
    await deleteRemote()
    expect(fetch).toHaveBeenCalledWith('/api/sync', { method: 'DELETE' })
  })
})
