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
 * Persist `fixture` into IndexedDB under a clock in the fixture's year, then
 * clear the legacy key so the next mount restores from IndexedDB (the
 * post-cutover steady state) instead of re-seeding through
 * `initializeStorage()`.
 */
async function persistDocToIndexedDB(fixture: AllotmentData = makeFixture()): Promise<void> {
  vi.setSystemTime(new Date(`${fixture.currentYear}-06-01T12:00:00`))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture))
  const first = renderHook(() => useAllotmentData())
  await waitFor(() => expect(first.result.current.data).not.toBeNull())
  expect(first.result.current.data?.currentYear).toBe(fixture.currentYear)
  await act(async () => {
    await first.result.current.flushSave()
  })
  first.unmount()
  localStorage.removeItem(STORAGE_KEY)
}

interface CloudMock {
  fetchRemoteBinary: () => Promise<unknown>
  pushBinary: ReturnType<typeof vi.fn>
}

/**
 * Import `useAllotmentData` in a fresh module registry with a signed-in user
 * and a mocked Supabase binary transport.
 */
async function importWithCloud(cloud: CloudMock): Promise<typeof useAllotmentData> {
  vi.resetModules()
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
    fetchRemoteBinary: cloud.fetchRemoteBinary,
    pushBinary: cloud.pushBinary,
  }))
  const mod = await import('@/hooks/allotment/useAllotmentData')
  return mod.useAllotmentData
}

function unmockCloud(): void {
  vi.doUnmock('@/hooks/useOptionalAuth')
  vi.doUnmock('@/lib/supabase/client')
  vi.doUnmock('@/lib/supabase/sync-binary')
  vi.resetModules()
}

/** Encode `data` as a cloud Yjs binary from the current module registry. */
async function encodeCloudDoc(data: AllotmentData): Promise<Uint8Array> {
  const yjsMod = await import('@/lib/yjs/allotment-yjs')
  const { store, doc } = yjsMod.createAllotmentDoc()
  // Distinct clientID so the cloud lineage never collides with the app's
  // local doc (lib0's RNG is deterministic in this environment).
  doc.clientID = 4242424242
  yjsMod.hydrateFromJson(store, data)
  return yjsMod.encodeDocState(doc)
}

async function seasonYearsInState(state: Uint8Array): Promise<number[]> {
  const yjsMod = await import('@/lib/yjs/allotment-yjs')
  return yjsMod.serializeToJson(yjsMod.decodeDocState(state).store).seasons.map(s => s.year)
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
    await persistDocToIndexedDB()

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
    await persistDocToIndexedDB()

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

  it('rolls forward and pushes when the first cloud sync adopts a stale 2026 lineage', async () => {
    vi.setSystemTime(new Date('2027-01-02T09:00:00'))
    vi.resetModules()
    const remoteUpdate = await encodeCloudDoc(makeFixture())
    const pushBinary = vi.fn<(...args: unknown[]) => Promise<unknown>>(
      async () => ({ ok: true, casConflict: false, yjsUpdatedAt: 'T' }),
    )

    try {
      // Brand-new device: no lineage flag, so the first sync adopts the cloud doc.
      const useHook = await importWithCloud({
        fetchRemoteBinary: async () => ({
          exists: true,
          update: remoteUpdate,
          yjsUpdatedAt: '2026-12-01T00:00:00.000Z',
          jsonb: makeFixture(),
        }),
        pushBinary,
      })
      const { result } = renderHook(() => useHook())

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

      // The rollover on the adopted doc reaches the cloud without a further edit.
      await waitFor(() => expect(pushBinary).toHaveBeenCalled(), { timeout: 5000 })
      const pushedState = pushBinary.mock.calls.at(-1)![2] as Uint8Array
      expect(await seasonYearsInState(pushedState)).toContain(2027)
    } finally {
      unmockCloud()
    }
  }, 30_000)

  it('rolls forward and pushes when the first sync migrates a stale 2026 JSON-only cloud row', async () => {
    vi.setSystemTime(new Date('2027-01-02T09:00:00'))
    const pushBinary = vi.fn<(...args: unknown[]) => Promise<unknown>>(
      async () => ({ ok: true, casConflict: false, yjsUpdatedAt: 'T' }),
    )

    try {
      // Pre-migration cloud row: legacy JSONB, no binary yet.
      const useHook = await importWithCloud({
        fetchRemoteBinary: async () => ({
          exists: true,
          update: null,
          yjsUpdatedAt: null,
          jsonb: makeFixture(),
        }),
        pushBinary,
      })
      const { result } = renderHook(() => useHook())

      await waitFor(() => expect(pushBinary).toHaveBeenCalled(), { timeout: 5000 })
      const [, , pushedState, pushedJson] = pushBinary.mock.calls[0] as [
        string, string, Uint8Array, AllotmentData,
      ]
      expect(await seasonYearsInState(pushedState)).toContain(2027)
      expect(pushedJson.currentYear).toBe(2027)
      await waitFor(() => {
        expect(result.current.data?.meta.name).toBe('Rollover Allotment')
      })
      expect(result.current.data!.seasons.filter(s => s.year === 2027)).toHaveLength(1)
      expect(result.current.selectedYear).toBe(2027)
    } finally {
      unmockCloud()
    }
  }, 30_000)

  it('keeps a year the user picks while the first sync adopts a stale lineage', async () => {
    vi.setSystemTime(new Date('2027-01-02T09:00:00'))
    vi.resetModules()
    const remoteUpdate = await encodeCloudDoc(makeFixture())
    let releaseFetch: () => void = () => {}
    const fetchGate = new Promise<void>(resolve => { releaseFetch = resolve })
    const pushBinary = vi.fn<(...args: unknown[]) => Promise<unknown>>(
      async () => ({ ok: true, casConflict: false, yjsUpdatedAt: 'T' }),
    )

    try {
      const useHook = await importWithCloud({
        fetchRemoteBinary: async () => {
          await fetchGate
          return {
            exists: true,
            update: remoteUpdate,
            yjsUpdatedAt: '2026-12-01T00:00:00.000Z',
            jsonb: makeFixture(),
          }
        },
        pushBinary,
      })
      const { result } = renderHook(() => useHook())
      await waitFor(() => expect(result.current.data).not.toBeNull())
      await waitFor(() => expect(result.current.syncStatus).toBe('syncing'))

      act(() => result.current.selectYear(2026))
      await act(async () => {
        releaseFetch()
      })

      // The adopted doc is still rolled forward and pushed...
      await waitFor(() => {
        expect(result.current.data?.meta.name).toBe('Rollover Allotment')
        expect(result.current.data?.seasons.map(s => s.year)).toContain(2027)
      }, { timeout: 5000 })
      await waitFor(() => expect(pushBinary).toHaveBeenCalled(), { timeout: 5000 })
      // ...but the user's pick survives, since 2026 exists in the adopted doc.
      expect(result.current.selectedYear).toBe(2026)
    } finally {
      unmockCloud()
    }
  }, 30_000)

  it('keeps a year the user picks before the first cloud sync completes', async () => {
    await persistDocToIndexedDB()

    vi.setSystemTime(new Date('2027-01-02T09:00:00'))
    let releaseFetch: () => void = () => {}
    const fetchGate = new Promise<void>(resolve => { releaseFetch = resolve })

    try {
      // Slow first sync against an empty cloud: no adoption happens.
      const useHook = await importWithCloud({
        fetchRemoteBinary: async () => {
          await fetchGate
          return { exists: false, update: null, yjsUpdatedAt: null, jsonb: null }
        },
        pushBinary: vi.fn(async () => ({ ok: true, casConflict: false, yjsUpdatedAt: 'T' })),
      })
      const { result } = renderHook(() => useHook())
      await waitFor(() => {
        expect(result.current.data?.seasons.map(s => s.year)).toContain(2027)
      })
      expect(result.current.selectedYear).toBe(2027)

      act(() => result.current.selectYear(2026))
      await waitFor(() => expect(result.current.syncStatus).toBe('syncing'))
      await act(async () => {
        releaseFetch()
      })
      await waitFor(() => expect(result.current.syncStatus).toBe('synced'))

      expect(result.current.selectedYear).toBe(2026)
      expect(result.current.data?.currentYear).toBe(2026)
    } finally {
      unmockCloud()
    }
  }, 30_000)

  it('creates the missing current-year season without moving a skewed currentYear back', async () => {
    // A device with a fast clock wrote currentYear=2028.
    const skewed: AllotmentData = { ...makeFixture(), currentYear: 2028 }
    skewed.seasons = [
      ...skewed.seasons,
      { ...skewed.seasons[0], year: 2028, status: 'planned' },
    ]
    await persistDocToIndexedDB(skewed)

    vi.setSystemTime(new Date('2027-03-01T09:00:00'))
    const { result } = renderHook(() => useAllotmentData())

    await waitFor(() => {
      expect(result.current.data?.seasons.map(s => s.year)).toContain(2027)
    })
    expect(result.current.data!.seasons.filter(s => s.year === 2027)).toHaveLength(1)
    expect(result.current.data?.currentYear).toBe(2028)
    expect(result.current.selectedYear).toBe(2028)
  })

  it('leaves a current-year doc alone', async () => {
    await persistDocToIndexedDB()

    vi.setSystemTime(new Date('2026-12-31T23:00:00'))
    const { result } = renderHook(() => useAllotmentData())
    await waitFor(() => expect(result.current.data).not.toBeNull())

    expect(result.current.selectedYear).toBe(2026)
    expect(result.current.data?.seasons.map(s => s.year)).toEqual([2026])
  })
})
