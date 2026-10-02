/**
 * Year rollover on the Yjs path (WP-02).
 *
 * The legacy `initializeStorage()` rolls a stale `currentYear` forward, but on
 * the Yjs path it only runs when seeding an empty doc. A doc restored from
 * IndexedDB must still get the new year's season, written through `mutate` so
 * it is a CRDT edit that syncs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAllotmentData } from '@/hooks/allotment/useAllotmentData'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'

function makeFixture(): AllotmentData {
  return {
    version: 23,
    currentYear: 2026,
    meta: {
      name: 'Rollover Allotment',
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
        {
          id: 'apple-tree',
          name: 'Apple Tree',
          kind: 'tree',
          canHavePlantings: false,
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
          { areaId: 'bed-a', rotationGroup: 'legumes', plantings: [] },
          { areaId: 'apple-tree', plantings: [] },
        ],
      },
    ],
    customTasks: [],
    maintenanceTasks: [],
    gardenEvents: [],
    varieties: [],
    compost: [],
  }
}

async function resetIndexedDB(): Promise<void> {
  const fakeMod = await import('fake-indexeddb')
  const IDBFactoryCtor = (
    fakeMod as unknown as { IDBFactory: new () => IDBFactory }
  ).IDBFactory
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactoryCtor(),
    writable: true,
    configurable: true,
  })
}

/**
 * Persist a 2026 doc into IndexedDB under a 2026 clock, then clear the legacy
 * key so the next mount restores from IndexedDB (the post-cutover steady
 * state) instead of re-seeding through `initializeStorage()`.
 */
async function persist2026DocToIndexedDB(): Promise<void> {
  vi.setSystemTime(new Date('2026-06-01T12:00:00'))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
  const first = renderHook(() => useAllotmentData())
  await waitFor(() => expect(first.result.current.data).not.toBeNull())
  expect(first.result.current.data?.currentYear).toBe(2026)
  await act(async () => {
    await first.result.current.flushSave()
  })
  first.unmount()
  localStorage.removeItem(STORAGE_KEY)
}

describe('useAllotmentData year rollover', () => {
  beforeEach(async () => {
    localStorage.clear()
    await resetIndexedDB()
    // Fake only Date so y-indexeddb's real timers and microtasks still run.
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates and selects the new season when a 2026 doc opens in 2027', async () => {
    await persist2026DocToIndexedDB()

    vi.setSystemTime(new Date('2027-01-01T09:00:00'))
    const { result } = renderHook(() => useAllotmentData())

    await waitFor(() => {
      expect(result.current.data?.seasons.map(s => s.year)).toContain(2027)
    })
    expect(result.current.data?.currentYear).toBe(2027)
    expect(result.current.selectedYear).toBe(2027)
    expect(result.current.currentSeason?.year).toBe(2027)

    // Reuses addSeason: one AreaSeason per area, rotation bed rotated on.
    const season2027 = result.current.data!.seasons.find(s => s.year === 2027)!
    expect(season2027.areas.map(a => a.areaId).sort()).toEqual(['apple-tree', 'bed-a'])
    expect(season2027.areas.find(a => a.areaId === 'bed-a')?.rotationGroup).toBe('brassicas')
    // The 2026 season is untouched.
    expect(result.current.data!.seasons.filter(s => s.year === 2026)).toHaveLength(1)
  })

  it('creates exactly one 2027 season when several consumers mount together', async () => {
    await persist2026DocToIndexedDB()

    vi.setSystemTime(new Date('2027-01-01T09:00:00'))
    // Navigation plus page: two hook instances sharing the singleton doc.
    const { result } = renderHook(() => ({ a: useAllotmentData(), b: useAllotmentData() }))

    await waitFor(() => {
      expect(result.current.a.data?.seasons.map(s => s.year)).toContain(2027)
    })
    await waitFor(() => expect(result.current.b.selectedYear).toBe(2027))
    expect(result.current.a.selectedYear).toBe(2027)
    expect(result.current.a.data!.seasons.filter(s => s.year === 2027)).toHaveLength(1)
  })

  it('rolls forward again when the first cloud sync adopts a stale 2026 lineage', async () => {
    vi.setSystemTime(new Date('2027-01-02T09:00:00'))
    vi.resetModules()

    // Build the cloud doc from the fresh module registry with a distinct
    // clientID, so it never collides with the app's local doc.
    const yjsMod = await import('@/lib/yjs/allotment-yjs')
    const { store: cloudStore, doc: cloudDoc } = yjsMod.createAllotmentDoc()
    cloudDoc.clientID = 4242424242
    yjsMod.hydrateFromJson(cloudStore, makeFixture())
    const remoteUpdate = yjsMod.encodeDocState(cloudDoc)

    vi.doMock('@/hooks/useOptionalAuth', () => ({
      clerkAvailable: true,
      useOptionalAuth: () => ({
        getToken: async () => 'token',
        userId: 'user-rollover',
        isSignedIn: true,
      }),
    }))
    vi.doMock('@/lib/supabase/client', () => ({
      isSupabaseConfigured: () => true,
      createAnonClient: () => null,
      createAuthClient: () => null,
    }))
    vi.doMock('@/lib/supabase/sync-binary', () => ({
      fetchRemoteBinary: async () => ({
        exists: true,
        update: remoteUpdate,
        yjsUpdatedAt: '2026-12-01T00:00:00.000Z',
        jsonb: makeFixture(),
      }),
      pushBinary: async () => ({ ok: true, casConflict: false, yjsUpdatedAt: 'T' }),
    }))

    try {
      // Brand-new device: no lineage flag, so the first sync adopts the cloud doc.
      const mod = await import('@/hooks/allotment/useAllotmentData')
      const { result } = renderHook(() => mod.useAllotmentData())

      await waitFor(() => {
        expect(result.current.data?.meta.name).toBe('Rollover Allotment')
      }, { timeout: 5000 })
      await waitFor(() => {
        expect(result.current.data?.seasons.map(s => s.year)).toContain(2027)
      })
      expect(result.current.data?.currentYear).toBe(2027)
      expect(result.current.selectedYear).toBe(2027)
      expect(result.current.currentSeason?.year).toBe(2027)
      expect(result.current.data!.seasons.filter(s => s.year === 2027)).toHaveLength(1)
    } finally {
      vi.doUnmock('@/hooks/useOptionalAuth')
      vi.doUnmock('@/lib/supabase/client')
      vi.doUnmock('@/lib/supabase/sync-binary')
      vi.resetModules()
    }
  }, 30_000)

  it('leaves a current-year doc alone', async () => {
    await persist2026DocToIndexedDB()

    vi.setSystemTime(new Date('2026-12-31T23:00:00'))
    const { result } = renderHook(() => useAllotmentData())
    await waitFor(() => expect(result.current.data).not.toBeNull())

    expect(result.current.selectedYear).toBe(2026)
    expect(result.current.data?.seasons.map(s => s.year)).toEqual([2026])
  })
})
