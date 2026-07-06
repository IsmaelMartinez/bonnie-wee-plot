/**
 * Allotment Yjs-storage regression test (ADR 027 Step 5).
 *
 * Before Step 5 this file was `allotment-path-parity.test.ts`, which ran
 * a scripted mutation sequence through `useAllotment` / `useCompost`
 * under both the legacy and Yjs flag states and asserted the two
 * snapshots matched. Step 5 deletes the legacy chain, so the flag-state
 * comparison is gone; the scripted sequences are kept as Yjs-path
 * regression tests that assert each mutation lands on the SyncedStore
 * proxy and serialises back out correctly.
 *
 * Determinism handling:
 *   - Deterministic `generateId` via `vi.mock('@/lib/utils/id')` so
 *     planting / variety / pile IDs are stable across runs.
 *   - `Date` pinned to a fixed instant (real timers kept intact so the
 *     `y-indexeddb` `whenSynced` microtasks still resolve).
 *   - `vi.resetModules()` per mount so the module-scoped `useYjsDoc`
 *     singleton (and its Y.Doc) starts fresh each test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'

// Deterministic `generateId`. Each call returns the next ID from a shared
// counter, reset per-test via `resetIdCounter` in `beforeEach`.
let idCounter = 0
function resetIdCounter() {
  idCounter = 0
}

vi.mock('@/lib/utils/id', () => ({
  generateId: (prefix?: string) => {
    idCounter++
    return prefix ? `${prefix}-${idCounter}` : `id-${idCounter}`
  },
  slugify: (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
  generateSlugId: (name: string, existingIds: Set<string>) => {
    const baseSlug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    if (!existingIds.has(baseSlug)) return baseSlug
    let counter = 2
    while (existingIds.has(`${baseSlug}-${counter}`)) counter++
    return `${baseSlug}-${counter}`
  },
}))

// `@/lib/utils` re-exports from `id.ts`; mocking the index ensures every
// importer (including the storage modules) shares the deterministic generator.
vi.mock('@/lib/utils', async () => {
  const id = await import('@/lib/utils/id')
  const debounce = await import('@/lib/utils/debounce')
  return { ...id, ...debounce }
})

// Minimal AllotmentData fixture: one season, two areas, one variety.
function makeFixture(): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Regression Test Allotment',
      location: 'Edinburgh',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
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
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        areas: [
          { areaId: 'bed-a', rotationGroup: 'legumes', plantings: [] },
          { areaId: 'apple-tree', plantings: [], careLogs: [] },
        ],
      },
    ],
    customTasks: [],
    maintenanceTasks: [
      {
        id: 'task-existing',
        areaId: 'apple-tree',
        type: 'prune',
        month: 1,
        description: 'Winter prune apple tree',
      },
    ],
    gardenEvents: [],
    varieties: [
      {
        id: 'variety-seed',
        plantId: 'pea',
        name: 'Kelvedon Wonder',
        seedsByYear: { 2026: 'none' },
        isArchived: false,
      },
    ],
    compost: [],
  }
}

// Reset fake-indexeddb between tests so each test gets a fresh database.
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
 * Import `useAllotment` in a fresh module registry so the module-scoped
 * `useYjsDoc` singleton (and its Y.Doc) starts empty. `resetModules`
 * clears the `id` / `utils` mocks, so re-apply them.
 */
async function importUseAllotment() {
  vi.resetModules()
  applyDeterministicMocks()
  const mod = await import('@/hooks/useAllotment')
  return mod.useAllotment
}

async function importUseCompost() {
  vi.resetModules()
  applyDeterministicMocks()
  const mod = await import('@/hooks/useCompost')
  return mod.useCompost
}

function applyDeterministicMocks() {
  vi.doMock('@/lib/utils/id', () => ({
    generateId: (prefix?: string) => {
      idCounter++
      return prefix ? `${prefix}-${idCounter}` : `id-${idCounter}`
    },
    slugify: (text: string) =>
      text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
    generateSlugId: (name: string, existingIds: Set<string>) => {
      const baseSlug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      if (!existingIds.has(baseSlug)) return baseSlug
      let counter = 2
      while (existingIds.has(`${baseSlug}-${counter}`)) counter++
      return `${baseSlug}-${counter}`
    },
  }))
  vi.doMock('@/lib/utils', async () => {
    const id = await import('@/lib/utils/id')
    const debounce = await import('@/lib/utils/debounce')
    return { ...id, ...debounce }
  })
}

describe('allotment Yjs storage', () => {
  const FROZEN_INSTANT = new Date('2026-05-15T10:00:00.000Z').getTime()
  let dateNowSpy: ReturnType<typeof vi.spyOn> | null = null
  let DateOriginal: typeof Date | null = null

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    await resetIndexedDB()
    resetIdCounter()
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(FROZEN_INSTANT)
    DateOriginal = Date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PatchedDate: any = function (this: Date, ...args: unknown[]) {
      if (!(this instanceof PatchedDate)) {
        return new (DateOriginal as DateConstructor)().toString()
      }
      if (args.length === 0) {
        return new (DateOriginal as DateConstructor)(FROZEN_INSTANT)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (DateOriginal as any)(...args)
    }
    PatchedDate.prototype = DateOriginal.prototype
    PatchedDate.now = () => FROZEN_INSTANT
    PatchedDate.UTC = DateOriginal.UTC
    PatchedDate.parse = DateOriginal.parse
    ;(globalThis as { Date: typeof Date }).Date = PatchedDate
  })

  afterEach(() => {
    if (dateNowSpy) {
      dateNowSpy.mockRestore()
      dateNowSpy = null
    }
    if (DateOriginal) {
      ;(globalThis as { Date: typeof Date }).Date = DateOriginal
      DateOriginal = null
    }
    vi.resetModules()
    vi.doUnmock('@/lib/utils/id')
    vi.doUnmock('@/lib/utils')
  })

  it('applies a scripted mutation sequence through the Yjs storage engine', async () => {
    resetIdCounter()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
    const useAllotment = await importUseAllotment()
    const hook = renderHook(() => useAllotment())

    await waitFor(() => {
      expect(hook.result.current.data).not.toBeNull()
    })

    // Step 1: Add a planting (cross-collection — a new variety name
    // auto-creates a StoredVariety alongside the planting).
    await act(async () => {
      hook.result.current.addPlanting('bed-a', {
        plantId: 'carrot',
        varietyName: 'Nantes 2',
        sowDate: '2026-04-01',
        sowMethod: 'outdoor',
      })
    })
    {
      const data = hook.result.current.data!
      const bedA = data.seasons[0].areas.find(a => a.areaId === 'bed-a')!
      expect(bedA.plantings).toHaveLength(1)
      expect(bedA.plantings[0].plantId).toBe('carrot')
      expect(bedA.plantings[0].varietyName).toBe('Nantes 2')
      // Auto-created variety for the new name.
      expect(data.varieties.some(v => v.name === 'Nantes 2')).toBe(true)
      expect(data.varieties).toHaveLength(2)
    }

    // Step 2: Toggle a variety's seed status ('none' → 'ordered').
    await act(async () => {
      hook.result.current.toggleHaveSeedsForYear('variety-seed', 2026)
    })
    expect(
      hook.result.current.data!.varieties.find(v => v.id === 'variety-seed')!.seedsByYear[2026],
    ).toBe('ordered')

    // Step 3: Archive an area.
    await act(async () => {
      hook.result.current.archiveArea('apple-tree')
    })
    expect(
      hook.result.current.data!.layout.areas.find(a => a.id === 'apple-tree')!.isArchived,
    ).toBe(true)

    // Step 4: Complete a maintenance task.
    await act(async () => {
      hook.result.current.completeMaintenanceTask('task-existing')
    })
    expect(
      (hook.result.current.data!.maintenanceTasks ?? []).find(t => t.id === 'task-existing')!.lastCompleted,
    ).toBeTruthy()

    // Step 5: Add a custom task.
    await act(async () => {
      hook.result.current.addCustomTask({ description: 'Water seedlings' })
    })
    expect(hook.result.current.data!.customTasks).toHaveLength(1)
    expect((hook.result.current.data!.customTasks ?? [])[0].description).toBe('Water seedlings')

    // Step 6: Log a care entry on the apple tree.
    await act(async () => {
      hook.result.current.addCareLog('apple-tree', {
        type: 'feed',
        date: '2026-05-15',
        description: 'Fish blood & bone',
      })
    })
    {
      const appleSeason = hook.result.current.data!.seasons[0].areas.find(a => a.areaId === 'apple-tree')!
      expect(appleSeason.careLogs).toHaveLength(1)
      expect(appleSeason.careLogs![0].type).toBe('feed')
    }

    // Step 7: Add a garden event.
    await act(async () => {
      hook.result.current.addGardenEvent({
        type: 'mulch',
        date: '2026-05-15',
        description: 'Mulched bed-a with chopped straw',
      })
    })
    expect(hook.result.current.data!.gardenEvents).toHaveLength(1)
    expect((hook.result.current.data!.gardenEvents ?? [])[0].type).toBe('mulch')

    // Step 8: Add another planting with the SAME variety name — exercises
    // the "variety already exists" branch (no new StoredVariety created).
    await act(async () => {
      hook.result.current.addPlanting('bed-a', {
        plantId: 'carrot',
        varietyName: 'Nantes 2',
        sowDate: '2026-04-15',
        sowMethod: 'outdoor',
      })
    })
    {
      const data = hook.result.current.data!
      const bedA = data.seasons[0].areas.find(a => a.areaId === 'bed-a')!
      expect(bedA.plantings).toHaveLength(2)
      // No extra variety — still just the seed variety + the one auto-created
      // in step 1.
      expect(data.varieties).toHaveLength(2)
    }

    hook.unmount()
  }, 30_000)

  it('applies a scripted compost mutation sequence through the Yjs storage engine', async () => {
    resetIdCounter()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
    const useCompost = await importUseCompost()
    const hook = renderHook(() => useCompost())

    await waitFor(() => {
      expect(hook.result.current.data).not.toBeNull()
    })

    // Step 1: Add a pile.
    await act(async () => {
      hook.result.current.addPile({
        name: 'Bay 1',
        systemType: 'hot-compost',
        status: 'active',
        startDate: '2026-05-01',
      })
    })
    expect(hook.result.current.data!.piles).toHaveLength(1)
    expect(hook.result.current.data!.piles[0].name).toBe('Bay 1')

    // Step 2: Add an input (pile id is deterministic: `pile-1`).
    await act(async () => {
      hook.result.current.addInput('pile-1', {
        date: '2026-05-02',
        material: 'Kitchen scraps',
        type: 'green',
      })
    })
    expect(hook.result.current.data!.piles[0].inputs).toHaveLength(1)

    // Step 3: Add a turn event.
    await act(async () => {
      hook.result.current.addEvent('pile-1', {
        date: '2026-05-10',
        type: 'turn',
        notes: 'First turn',
      })
    })
    expect(hook.result.current.data!.piles[0].events).toHaveLength(1)

    // Step 4: Update the pile status.
    await act(async () => {
      hook.result.current.updatePile('pile-1', { status: 'maturing' })
    })
    expect(hook.result.current.data!.piles[0].status).toBe('maturing')

    // Step 5: Remove the input added in step 2 (deterministic id `input-2`).
    await act(async () => {
      hook.result.current.removeInput('pile-1', 'input-2')
    })
    expect(hook.result.current.data!.piles[0].inputs).toHaveLength(0)

    hook.unmount()
  }, 30_000)

  it('adopts the cloud payload after resolveConflict("cloud")', async () => {
    // Cloud-sync regression: a `'cloud'` conflict resolution must write the
    // remote snapshot into the Yjs doc (via `replaceFromJson`) so the
    // visible `data` becomes the cloud version. Requires Supabase wiring, so
    // this test mounts in an isolated module registry with auth + sync mocks.
    const remoteData: AllotmentData = {
      ...makeFixture(),
      meta: {
        name: 'Cloud Allotment',
        location: 'Aberdeen',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2026-05-16T11:00:00.000Z',
      },
    }

    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()

    vi.resetModules()
    applyDeterministicMocks()
    vi.doMock('@/hooks/useOptionalAuth', () => ({
      clerkAvailable: true,
      useOptionalAuth: () => ({
        getToken: async () => 'token',
        userId: 'user-conflict',
        isSignedIn: true,
      }),
    }))
    vi.doMock('@/lib/supabase/client', () => ({
      isSupabaseConfigured: () => true,
      createAnonClient: () => null,
      createAuthClient: () => null,
    }))
    vi.doMock('@/lib/supabase/sync', async () => {
      const actual = await vi.importActual<typeof import('@/lib/supabase/sync')>(
        '@/lib/supabase/sync',
      )
      return {
        ...actual,
        fetchRemote: async () => ({
          data: remoteData,
          updatedAt: '2026-05-16T11:00:00.000Z',
        }),
        pushToRemote: async () => undefined,
      }
    })
    // Pre-seed a sync flag so the initial sync treats this as a *subsequent*
    // sync (which can produce a conflict) with both sides changed.
    localStorage.setItem(
      'bonnie-synced-user-conflict',
      JSON.stringify({ lastSyncedAt: '2024-01-01T00:00:00.000Z' }),
    )

    const localFixture: AllotmentData = {
      ...makeFixture(),
      meta: {
        name: 'Local Allotment',
        location: 'Edinburgh',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2026-05-16T09:00:00.000Z',
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localFixture))

    const mod = await import('@/hooks/useAllotment')
    const hook = renderHook(() => mod.useAllotment())

    await waitFor(() => {
      expect(hook.result.current.data).not.toBeNull()
    })

    await waitFor(() => {
      expect(hook.result.current.syncConflict).not.toBeNull()
    }, { timeout: 5000 })

    await act(async () => {
      hook.result.current.resolveConflict('cloud')
    })

    await waitFor(() => {
      expect(hook.result.current.data?.meta.name).toBe('Cloud Allotment')
    })

    hook.unmount()
    vi.doUnmock('@/hooks/useOptionalAuth')
    vi.doUnmock('@/lib/supabase/client')
    vi.doUnmock('@/lib/supabase/sync')
  }, 30_000)
})
