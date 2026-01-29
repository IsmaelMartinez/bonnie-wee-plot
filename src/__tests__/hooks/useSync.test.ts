import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    once: vi.fn((_event, cb) => setTimeout(cb, 0)),
    destroy: vi.fn()
  }))
}))

vi.mock('@/services/device-identity', () => ({
  loadIdentity: () => null,
  getPairedDevices: () => [],
  getOrCreateIdentity: () => ({
    publicKey: 'test', privateKey: 'test', deviceName: 'Test', createdAt: new Date().toISOString()
  })
}))

vi.mock('@/services/ydoc-migration', () => ({
  migrateToYDoc: vi.fn(() => Promise.resolve(false))
}))

vi.mock('@/services/ydoc-manager', () => ({
  createYDoc: vi.fn(() => ({
    getMap: vi.fn(() => ({ size: 0, clear: vi.fn() })),
    destroy: vi.fn(),
    transact: vi.fn((fn) => fn())
  })),
  initializeYDoc: vi.fn(),
  createPersistence: vi.fn(() => ({
    once: vi.fn((_event, cb) => setTimeout(cb, 0)),
    destroy: vi.fn()
  })),
  waitForSync: vi.fn(() => Promise.resolve())
}))

vi.mock('@/services/ydoc-converter', () => ({
  yDocToAllotment: vi.fn(() => null),
  allotmentToYDoc: vi.fn()
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with disconnected state', async () => {
    const { useSync } = await import('@/hooks/useSync')
    const { result } = renderHook(() => useSync())
    expect(result.current.status.state).toBe('disconnected')
  })

  it('can be disabled', async () => {
    const { useSync } = await import('@/hooks/useSync')
    const { result } = renderHook(() => useSync({ enabled: false }))
    expect(result.current.ydoc).toBeNull()
  })
})
