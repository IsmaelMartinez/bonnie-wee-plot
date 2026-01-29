import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock IndexedDB for tests
vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    once: vi.fn((event, cb) => {
      if (event === 'synced') setTimeout(cb, 0)
    }),
    destroy: vi.fn()
  }))
}))

describe('YDocManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a Y.Doc with correct structure', async () => {
    const { createYDoc } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()

    expect(ydoc.getMap('allotment')).toBeDefined()
  })

  it('initializes root map with required keys', async () => {
    const { createYDoc, initializeYDoc } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()
    initializeYDoc(ydoc)

    const root = ydoc.getMap('allotment')
    expect(root.get('meta')).toBeDefined()
    expect(root.get('layout')).toBeDefined()
    expect(root.get('seasons')).toBeDefined()
    expect(root.get('varieties')).toBeDefined()
  })

  it('tracks changes for sync notifications', async () => {
    const { createYDoc, initializeYDoc, trackChanges } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()
    initializeYDoc(ydoc)

    const changes: number[] = []
    const unsubscribe = trackChanges(ydoc, (count) => changes.push(count))

    const root = ydoc.getMap('allotment')
    root.set('currentYear', 2027)

    expect(changes.length).toBeGreaterThan(0)
    unsubscribe()
  })
})
