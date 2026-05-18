/**
 * Tests for `useYjsDoc` (ADR 027 Step 3, PR-A foundation).
 *
 * Coverage:
 *   - Mount with empty IndexedDB and empty legacy localStorage → data is null.
 *   - Mount with empty IndexedDB and populated legacy localStorage hydrates.
 *   - Mount with hydrated IndexedDB uses IndexedDB and does not read legacy.
 *   - `mutate(fn)` mutates and publishes a fresh snapshot reference.
 *   - `replaceFromJson(json)` is idempotent.
 *   - Schema-migration path: legacy v17 → current.
 *   - Cleanup destroys doc + provider.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useYjsDoc } from '@/hooks/useYjsDoc'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'

function makeFixture(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      location: 'Edinburgh',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2026-05-12T10:00:00.000Z',
    },
    layout: {
      areas: [
        {
          id: 'bed-a',
          name: 'Bed A',
          kind: 'rotation-bed',
          canHavePlantings: true,
          rotationGroup: 'legumes',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-12T10:00:00.000Z',
        areas: [
          {
            areaId: 'bed-a',
            rotationGroup: 'legumes',
            plantings: [],
          },
        ],
      },
    ],
    customTasks: [],
    maintenanceTasks: [],
    gardenEvents: [],
    varieties: [],
    compost: [],
    ...overrides,
  } as AllotmentData
}

// Reset fake-indexeddb between tests so each test gets a fresh database
// state. The package re-exports the factory class from its top-level
// entry point.
async function resetIndexedDB(): Promise<void> {
  const fakeMod = await import('fake-indexeddb')
  // `IDBFactory` is the named export from `fake-indexeddb` (re-exported
  // from FDBFactory). Cycling globalThis.indexedDB to a fresh instance
  // gives each test an empty IDB world without leaving stale databases
  // behind from earlier tests in this file.
  const IDBFactoryCtor =
    (fakeMod as unknown as { IDBFactory: new () => IDBFactory }).IDBFactory
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactoryCtor(),
    writable: true,
    configurable: true,
  })
}

describe('useYjsDoc', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Wipe localStorage so STORAGE_KEY starts absent each test.
    localStorage.clear()
    await resetIndexedDB()
  })

  it('returns data:null when both IndexedDB and legacy localStorage are empty', async () => {
    const { result } = renderHook(() => useYjsDoc())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('hydrates from legacy localStorage when IndexedDB is empty', async () => {
    const fixture = makeFixture()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture))

    const { result } = renderHook(() => useYjsDoc())

    await waitFor(() => expect(result.current.data).not.toBeNull())

    expect(result.current.data?.meta.name).toBe('Test Allotment')
    expect(result.current.data?.layout.areas).toHaveLength(1)
    expect(result.current.data?.layout.areas[0].id).toBe('bed-a')
    expect(result.current.data?.currentYear).toBe(2026)
  })

  it('uses IndexedDB state on a second mount and does not re-read legacy', async () => {
    const fixture = makeFixture()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture))

    // First mount: hydrates from legacy and writes to IDB.
    const first = renderHook(() => useYjsDoc())
    await waitFor(() => expect(first.result.current.data).not.toBeNull())
    // Allow `y-indexeddb` to flush the initial state to IDB before
    // unmount; whenSynced has resolved so any pending writes are
    // scheduled for the next microtask.
    await act(async () => {
      await first.result.current.flushSave()
    })
    first.unmount()

    // Clear legacy localStorage so a successful second-mount hydrate
    // *must* come from IndexedDB.
    localStorage.removeItem(STORAGE_KEY)

    const second = renderHook(() => useYjsDoc())
    await waitFor(() => expect(second.result.current.data).not.toBeNull())

    expect(second.result.current.data?.meta.name).toBe('Test Allotment')
    expect(second.result.current.data?.layout.areas).toHaveLength(1)
  })

  it('mutate(fn) updates the doc and publishes a new snapshot reference', async () => {
    const fixture = makeFixture()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture))

    const { result } = renderHook(() => useYjsDoc())
    await waitFor(() => expect(result.current.data).not.toBeNull())

    const before = result.current.data!
    expect(before.layout.areas).toHaveLength(1)

    await act(async () => {
      result.current.mutate(store => {
        store.areas.push({
          id: 'bed-b',
          name: 'Bed B',
          kind: 'rotation-bed',
          canHavePlantings: true,
          createdAt: '2026-05-13T00:00:00.000Z',
        })
      })
    })

    await waitFor(() => {
      expect(result.current.data?.layout.areas).toHaveLength(2)
    })

    const after = result.current.data!
    expect(after).not.toBe(before)
    expect(after.layout.areas.map(a => a.id)).toEqual(['bed-a', 'bed-b'])
  })

  it('replaceFromJson is idempotent — second call with same input produces same snapshot', async () => {
    const fixture = makeFixture()

    const { result } = renderHook(() => useYjsDoc())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.replaceFromJson(fixture)
    })
    await waitFor(() => {
      expect(result.current.data?.layout.areas).toHaveLength(1)
    })
    const first = result.current.data!

    await act(async () => {
      result.current.replaceFromJson(fixture)
    })
    await waitFor(() => {
      expect(result.current.data?.layout.areas).toHaveLength(1)
    })
    const second = result.current.data!

    // Same data → same content; reference inequality is fine, but the
    // serialized shapes must match (no duplicates, no leftovers).
    expect(second.layout.areas).toHaveLength(1)
    expect(second.layout.areas[0].id).toBe('bed-a')
    expect(JSON.stringify(second)).toEqual(JSON.stringify(first))
  })

  it('migrates a legacy v17 snapshot to the current schema before hydrating', async () => {
    // v17 lacks `compost` — the migration to v18 adds it. Walking past
    // v17 also touches the v18/19/20/21/22 migrations along the way, so
    // we get coverage of the full chain in one shot.
    const v17: Partial<AllotmentData> = {
      version: 17,
      currentYear: 2026,
      meta: {
        name: 'Old Allotment',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      layout: { areas: [] },
      seasons: [
        {
          year: 2026,
          status: 'current',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          areas: [],
        },
      ],
      varieties: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v17))

    const { result } = renderHook(() => useYjsDoc())
    await waitFor(() => expect(result.current.data).not.toBeNull())

    // Migration ran: compost is present (added in v18), version is at
    // the current schema.
    expect(result.current.data?.version).toBeGreaterThanOrEqual(22)
    expect(Array.isArray(result.current.data?.compost)).toBe(true)
  })

  it('cleans up on unmount — does not throw and idempotent on rapid mount/unmount', async () => {
    const fixture = makeFixture()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture))

    const first = renderHook(() => useYjsDoc())
    await waitFor(() => expect(first.result.current.data).not.toBeNull())
    expect(() => first.unmount()).not.toThrow()

    // Second mount must still work after the first tears down.
    const second = renderHook(() => useYjsDoc())
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))
    expect(() => second.unmount()).not.toThrow()
  })
})
