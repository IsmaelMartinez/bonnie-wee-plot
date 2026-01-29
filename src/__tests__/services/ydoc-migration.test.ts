import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Y from 'yjs'

const mockStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] }
})

describe('Y.Doc Migration', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    vi.resetModules()
  })

  it('migrates existing localStorage data to Y.Doc', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    const existingData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'My Allotment', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] },
      seasons: [],
      varieties: []
    }
    mockStorage['allotment-unified-data'] = JSON.stringify(existingData)

    const ydoc = new Y.Doc()
    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(true)
    const root = ydoc.getMap('allotment')
    expect(root.get('currentYear')).toBe(2026)
  })

  it('creates backup of localStorage after migration', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    const existingData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'My Allotment', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] },
      seasons: [],
      varieties: []
    }
    mockStorage['allotment-unified-data'] = JSON.stringify(existingData)

    const ydoc = new Y.Doc()
    await migrateToYDoc(ydoc)

    expect(mockStorage['allotment-unified-data-backup']).toBeDefined()
  })

  it('skips migration if no localStorage data', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    const ydoc = new Y.Doc()
    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(false)
  })

  it('skips migration if Y.Doc already has data', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    mockStorage['allotment-unified-data'] = JSON.stringify({
      version: 16, currentYear: 2026,
      meta: { name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] }, seasons: [], varieties: []
    })

    const ydoc = new Y.Doc()
    const root = ydoc.getMap('allotment')
    root.set('currentYear', 2025)

    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(false)
    expect(root.get('currentYear')).toBe(2025)
  })
})
