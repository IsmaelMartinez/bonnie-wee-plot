/**
 * Path parity test (ADR 027 Step 3, PR-B).
 *
 * Mounts `useAllotment` end-to-end under both `USE_YJS_STORAGE` flag
 * states and runs the same scripted sequence of representative
 * mutations against each. After each step the public `data` snapshot
 * from the legacy path must equal the public `data` snapshot from the
 * Yjs path. The scripted sequence is the contract; if any step
 * diverges, one of the seven domain-hook ports has a bug.
 *
 * Non-determinism handling (see spec § "Testing strategy — Layer 1"):
 *   - Frozen `Date` via `vi.useFakeTimers` so `createdAt`/`updatedAt`
 *     are identical on both paths.
 *   - Deterministic `generateId` via `vi.mock('@/lib/utils/id')` so
 *     planting / variety / event IDs match across paths.
 *   - `toEqual` rather than `toStrictEqual` for the comparison — Y.Map
 *     key ordering is insertion-order, not alphabetical, and the
 *     legacy path also produces insertion-order in object literals
 *     but TypeScript / JSON.stringify can rearrange. `toEqual`
 *     compares values structurally without caring about prototype
 *     identity or key order.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor, type RenderHookResult } from '@testing-library/react'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'
import type { CompostData } from '@/types/compost'
import type { UseAllotmentReturn } from '@/hooks/useAllotment'
import type { UseCompostReturn } from '@/hooks/useCompost'

type AllotmentHookResult = RenderHookResult<UseAllotmentReturn, unknown>
type CompostHookResult = RenderHookResult<UseCompostReturn, unknown>

// Deterministic `generateId`. Each call returns the next ID from a
// shared counter so legacy and Yjs paths produce identical IDs given
// the same call sequence. The counter resets per-test via
// `resetIdCounter` in `beforeEach`. The prefix passes through so the
// resulting IDs are still recognisable (e.g. `planting-1`).
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

// `@/lib/utils` re-exports from `id.ts`; mocking the index ensures
// every importer (including the storage modules) shares the
// deterministic generator.
vi.mock('@/lib/utils', async () => {
  const id = await import('@/lib/utils/id')
  const debounce = await import('@/lib/utils/debounce')
  return { ...id, ...debounce }
})

// Build a minimal AllotmentData fixture that has enough structure for
// the scripted sequence (one season, one area, one variety).
function makeFixture(): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Parity Test Allotment',
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
          {
            areaId: 'bed-a',
            rotationGroup: 'legumes',
            plantings: [],
          },
          {
            areaId: 'apple-tree',
            plantings: [],
            careLogs: [],
          },
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

// Reset fake-indexeddb between tests so each test gets a fresh
// database state — copied from `useYjsDoc.test.ts`.
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
 * Mount `useAllotment` with the chosen flag value. Uses
 * `vi.resetModules` + `vi.doMock` because `useAllotmentData` reads the
 * flag at module load to pick its impl. The dynamic import returns the
 * hook bound to the mocked flag value.
 */
async function importUseAllotmentWithFlag(useYjsStorage: boolean) {
  vi.resetModules()
  vi.doMock('@/config/release-visibility', () => ({
    SHOW_ROTATION_SUGGESTIONS: false,
    SHOW_ADVANCED_AREA_FIELDS: false,
    SHOW_CARE_LOGS: true,
    SHOW_UNDERPLANTINGS: false,
    USE_YJS_STORAGE: useYjsStorage,
  }))
  // Re-apply ID and utils mocks because resetModules cleared them.
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
  const mod = await import('@/hooks/useAllotment')
  return mod.useAllotment
}

/**
 * Mount `useCompost` with the chosen flag value. Same module-reset
 * dance as `importUseAllotmentWithFlag` because both hooks compose
 * `useAllotmentData`, which reads the flag at module load. PR-B.2 ports
 * `useCompost` to the same two-branch pattern as the seven hooks PR-B
 * shipped; this helper drives the parity test that holds the contract.
 */
async function importUseCompostWithFlag(useYjsStorage: boolean) {
  vi.resetModules()
  vi.doMock('@/config/release-visibility', () => ({
    SHOW_ROTATION_SUGGESTIONS: false,
    SHOW_ADVANCED_AREA_FIELDS: false,
    SHOW_CARE_LOGS: true,
    SHOW_UNDERPLANTINGS: false,
    USE_YJS_STORAGE: useYjsStorage,
  }))
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
  const mod = await import('@/hooks/useCompost')
  return mod.useCompost
}

/**
 * Strip volatile fields from a snapshot so the parity comparison
 * focuses on data-shape equivalence. Both paths re-stamp
 * `meta.updatedAt` and `season.updatedAt` on every write; while the
 * frozen clock keeps these identical in principle, the two paths
 * might still write them at slightly-different moments in the React
 * render cycle if any awaited microtask between flag flips changes
 * what `Date.now` returns. Stripping them sidesteps that fragility
 * without losing coverage of the structural mutations.
 */
function stripVolatile(snapshot: AllotmentData | null): unknown {
  if (!snapshot) return snapshot
  const clone = JSON.parse(JSON.stringify(snapshot)) as AllotmentData
  if (clone.meta) {
    delete (clone.meta as Partial<AllotmentData['meta']>).updatedAt
  }
  for (const season of clone.seasons || []) {
    delete (season as Partial<typeof season>).updatedAt
  }
  return clone
}

/**
 * Strip volatile fields from a `CompostData` snapshot. The top-level
 * `updatedAt` is derived from `AllotmentData.meta.updatedAt` and is
 * volatile across paths for the same reason `stripVolatile` strips
 * `meta.updatedAt`. Pile-level `createdAt`/`updatedAt` stay — those
 * are the contract of the compost mutations and should match exactly
 * under the frozen clock.
 */
function stripVolatileCompost(snapshot: CompostData | null): unknown {
  if (!snapshot) return snapshot
  const clone = JSON.parse(JSON.stringify(snapshot)) as CompostData
  delete (clone as Partial<CompostData>).updatedAt
  return clone
}

/**
 * Drive the scripted mutation sequence against a mounted
 * `useAllotment` hook. Returns the array of snapshots captured after
 * each step.
 */
async function runScript(hook: AllotmentHookResult): Promise<unknown[]> {
  const snapshots: unknown[] = []

  // Step 1: Add a planting (cross-collection — touches plantings AND
  // varieties because the variety name is new).
  await act(async () => {
    hook.result.current.addPlanting('bed-a', {
      plantId: 'carrot',
      varietyName: 'Nantes 2',
      sowDate: '2026-04-01',
      sowMethod: 'outdoor',
    })
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 2: Update a variety's seed status (toggles 'none' → 'ordered').
  await act(async () => {
    hook.result.current.toggleHaveSeedsForYear('variety-seed', 2026)
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 3: Archive an area.
  await act(async () => {
    hook.result.current.archiveArea('apple-tree')
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 4: Complete a maintenance task.
  await act(async () => {
    hook.result.current.completeMaintenanceTask('task-existing')
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 5: Add a custom task.
  await act(async () => {
    hook.result.current.addCustomTask({ description: 'Water seedlings' })
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 6: Log a care entry on the apple tree (even archived areas
  // can take care logs — the legacy path doesn't gate on isArchived).
  await act(async () => {
    hook.result.current.addCareLog('apple-tree', {
      type: 'feed',
      date: '2026-05-15',
      description: 'Fish blood & bone',
    })
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 7: Add a garden event.
  await act(async () => {
    hook.result.current.addGardenEvent({
      type: 'mulch',
      date: '2026-05-15',
      description: 'Mulched bed-a with chopped straw',
    })
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  // Step 8: Cross-collection addPlanting — same variety name as Step
  // 1, exercises the "variety already exists" branch instead of the
  // auto-create branch.
  await act(async () => {
    hook.result.current.addPlanting('bed-a', {
      plantId: 'carrot',
      varietyName: 'Nantes 2',
      sowDate: '2026-04-15',
      sowMethod: 'outdoor',
    })
  })
  snapshots.push(stripVolatile(hook.result.current.data))

  return snapshots
}

/**
 * Scripted compost mutation sequence (PR-B.2). Runs against a mounted
 * `useCompost` and captures the public `data` snapshot after each step.
 * Coverage:
 *   - `addPile` (most common write path; also exercises `withoutUndefined`
 *     because `NewCompostPile` carries optional `notes`).
 *   - `addInput` (per-pile array push, updates `pile.updatedAt`).
 *   - `addEvent` (parallel to addInput but on the events collection).
 *   - `updatePile` (uses `assignDefined` for partial patch + bumps `updatedAt`).
 *   - `removeInput` (per-pile array splice).
 */
async function runCompostScript(hook: CompostHookResult): Promise<unknown[]> {
  const snapshots: unknown[] = []

  // Step 1: Add a pile (most common write path).
  await act(async () => {
    hook.result.current.addPile({
      name: 'Bay 1',
      systemType: 'hot-compost',
      status: 'active',
      startDate: '2026-05-01',
    })
  })
  snapshots.push(stripVolatileCompost(hook.result.current.data))

  // Step 2: Add an input to the new pile (uses the pile's ID assigned
  // in step 1 — both paths share the deterministic generateId so the
  // ID is `pile-1`).
  await act(async () => {
    hook.result.current.addInput('pile-1', {
      date: '2026-05-02',
      material: 'Kitchen scraps',
      type: 'green',
    })
  })
  snapshots.push(stripVolatileCompost(hook.result.current.data))

  // Step 3: Add a turn event.
  await act(async () => {
    hook.result.current.addEvent('pile-1', {
      date: '2026-05-10',
      type: 'turn',
      notes: 'First turn',
    })
  })
  snapshots.push(stripVolatileCompost(hook.result.current.data))

  // Step 4: Update the pile to 'maturing' (partial patch — exercises
  // `assignDefined` on the Yjs branch).
  await act(async () => {
    hook.result.current.updatePile('pile-1', { status: 'maturing' })
  })
  snapshots.push(stripVolatileCompost(hook.result.current.data))

  // Step 5: Remove the input added in step 2.
  await act(async () => {
    hook.result.current.removeInput('pile-1', 'input-2')
  })
  snapshots.push(stripVolatileCompost(hook.result.current.data))

  return snapshots
}

describe('useAllotment path parity', () => {
  // Pinning `Date.now` via `vi.useFakeTimers` would freeze the
  // microtask scheduler that `fake-indexeddb` and `y-indexeddb` rely
  // on for `whenSynced` resolution. Instead we pin `Date` via a spy
  // that returns a fixed instant, keeping real timers intact so the
  // IndexedDB async writes still resolve.
  const FROZEN_INSTANT = new Date('2026-05-15T10:00:00.000Z').getTime()
  let dateNowSpy: ReturnType<typeof vi.spyOn> | null = null
  let DateOriginal: typeof Date | null = null

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    await resetIndexedDB()
    resetIdCounter()
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(FROZEN_INSTANT)
    // Patch `new Date()` so `new Date().toISOString()` (used widely in
    // both branches for `createdAt`/`updatedAt`) returns the frozen
    // instant. Calls with explicit arguments still work normally so
    // the storage migration can parse legacy timestamps.
    DateOriginal = Date
    // The `Date` constructor has 7 overload signatures; rather than try
    // to match them all here, we use `unknown[]` for the rest args and
    // forward via spread. The overload that callers see is whatever the
    // global `Date` shape provides — we just intercept the zero-arg
    // case.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PatchedDate: any = function (this: Date, ...args: unknown[]) {
      if (!(this instanceof PatchedDate)) {
        // `Date()` called as a function returns a string, matching the
        // real Date's behaviour.
        return new (DateOriginal as DateConstructor)().toString()
      }
      if (args.length === 0) {
        return new (DateOriginal as DateConstructor)(FROZEN_INSTANT)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (DateOriginal as any)(...args)
    }
    PatchedDate.prototype = DateOriginal.prototype
    // Preserve the static methods we just spied on.
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
    vi.doUnmock('@/config/release-visibility')
    vi.doUnmock('@/lib/utils/id')
    vi.doUnmock('@/lib/utils')
  })

  it('legacy and Yjs paths produce equivalent snapshots after each scripted mutation', async () => {
    // --- Legacy path ---
    resetIdCounter()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
    const useAllotmentLegacy = await importUseAllotmentWithFlag(false)
    const legacyHook = renderHook(() => useAllotmentLegacy())

    // Wait for the legacy hook to finish its initial load (it reads
    // localStorage synchronously but goes through a `useEffect` round).
    await waitFor(() => {
      expect(legacyHook.result.current.data).not.toBeNull()
    })

    const legacySnapshots = await runScript(legacyHook)
    legacyHook.unmount()

    // --- Reset for Yjs path ---
    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))

    // Spy on `console.warn` so we can assert the PR-A "unported call
    // site" warning never fires during the Yjs run. If it does, one of
    // the seven domain hooks still has a `setData` invocation that
    // wasn't gated behind the `USE_YJS_STORAGE` check.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const useAllotmentYjs = await importUseAllotmentWithFlag(true)
    const yjsHook = renderHook(() => useAllotmentYjs())

    // The Yjs path goes through `IndexeddbPersistence.whenSynced` plus
    // the legacy-localStorage hydration, so it loads asynchronously.
    await waitFor(() => {
      expect(yjsHook.result.current.data).not.toBeNull()
    })

    const yjsSnapshots = await runScript(yjsHook)

    // Assert the unported-site warning never surfaced for any of the
    // eight scripted mutations.
    const unportedWarnings = warnSpy.mock.calls.filter(call =>
      typeof call[0] === 'string' &&
      call[0].includes('unported domain-hook call site'),
    )
    expect(unportedWarnings).toEqual([])

    warnSpy.mockRestore()
    yjsHook.unmount()

    // --- Compare ---
    expect(yjsSnapshots).toHaveLength(legacySnapshots.length)
    for (let i = 0; i < legacySnapshots.length; i++) {
      expect(yjsSnapshots[i]).toEqual(legacySnapshots[i])
    }
  }, 30_000)

  it('useCompost legacy and Yjs paths produce equivalent snapshots after each scripted mutation', async () => {
    // PR-B.2 closes the spec-inventory gap left by PR-B: `useCompost`
    // calls `setData` from `useAllotmentData` and needs the same
    // two-branch treatment as the seven hooks PR-B ported. This test
    // runs a scripted compost-only mutation sequence against both flag
    // states and asserts snapshot equality.

    // --- Legacy path ---
    resetIdCounter()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
    const useCompostLegacy = await importUseCompostWithFlag(false)
    const legacyHook = renderHook(() => useCompostLegacy())

    await waitFor(() => {
      expect(legacyHook.result.current.data).not.toBeNull()
    })

    const legacySnapshots = await runCompostScript(legacyHook)
    legacyHook.unmount()

    // --- Reset for Yjs path ---
    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))

    // Spy on `console.warn` so we can assert the PR-A "unported call
    // site" warning never fires during the compost run. If it does,
    // `useCompost` still has a `setData` invocation that wasn't gated
    // behind the `USE_YJS_STORAGE` check.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const useCompostYjs = await importUseCompostWithFlag(true)
    const yjsHook = renderHook(() => useCompostYjs())

    await waitFor(() => {
      expect(yjsHook.result.current.data).not.toBeNull()
    })

    const yjsSnapshots = await runCompostScript(yjsHook)

    const unportedWarnings = warnSpy.mock.calls.filter(call =>
      typeof call[0] === 'string' &&
      call[0].includes('unported domain-hook call site'),
    )
    expect(unportedWarnings).toEqual([])

    warnSpy.mockRestore()
    yjsHook.unmount()

    // --- Compare ---
    expect(yjsSnapshots).toHaveLength(legacySnapshots.length)
    for (let i = 0; i < legacySnapshots.length; i++) {
      expect(yjsSnapshots[i]).toEqual(legacySnapshots[i])
    }
  }, 30_000)

  it('legacy and Yjs paths both adopt sibling-tab storage event payloads (PR-A.2)', async () => {
    // PR-A.2 closes the gap where a sibling-tab `storage` event would
    // update the legacy chain on the Yjs path but leave the Yjs doc
    // stale — the mirror would then push the stale doc back over the
    // sibling's fresh data, undoing the change. This test fires a
    // synthetic `storage` event with a known "remote" payload at both
    // hook instances and asserts that the public `data` snapshot
    // converges to the remote payload on both flag states.
    //
    // We rebuild a small remote fixture (different allotment name, two
    // areas instead of one) and write it to localStorage *before*
    // dispatching the event so the listener's re-read from
    // `initializeStorage` hands back the same payload jsdom doesn't
    // dispatch the StorageEvent with `newValue` baked into the listener,
    // it just re-reads the key.

    const remotePayload: AllotmentData = {
      ...makeFixture(),
      meta: {
        name: 'Remote Allotment',
        location: 'Glasgow',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2026-05-16T10:00:00.000Z',
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
            id: 'bed-b',
            name: 'Bed B',
            kind: 'rotation-bed',
            canHavePlantings: true,
            rotationGroup: 'brassicas',
            createdAt: '2026-05-16T10:00:00.000Z',
          },
        ],
      },
    }

    // Dispatch a synthetic same-storage-key event. The legacy chain's
    // `usePersistedStorage.handleStorageChange` reads `event.newValue`
    // when present but falls back to re-loading from `localStorage` for
    // validation — we set the key first so both paths land at the same
    // data.
    function dispatchRemoteSync(): void {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remotePayload))
      // jsdom rejects `StorageEvent` constructed with `storageArea: localStorage`
      // (it only accepts its own Storage wrapper). Omitting the field is safe —
      // `usePersistedStorage.handleStorageChange` only reads `event.key` and
      // `event.newValue`, then re-reads via `load()`.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify(remotePayload),
          oldValue: null,
        }),
      )
    }

    // --- Legacy path ---
    resetIdCounter()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))
    const useAllotmentLegacy = await importUseAllotmentWithFlag(false)
    const legacyHook = renderHook(() => useAllotmentLegacy())
    await waitFor(() => {
      expect(legacyHook.result.current.data).not.toBeNull()
    })

    await act(async () => {
      dispatchRemoteSync()
    })

    await waitFor(() => {
      expect(legacyHook.result.current.data?.meta.name).toBe('Remote Allotment')
    })
    const legacyAfter = stripVolatile(legacyHook.result.current.data)
    legacyHook.unmount()

    // --- Yjs path ---
    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeFixture()))

    const useAllotmentYjs = await importUseAllotmentWithFlag(true)
    const yjsHook = renderHook(() => useAllotmentYjs())
    await waitFor(() => {
      expect(yjsHook.result.current.data).not.toBeNull()
    })

    await act(async () => {
      dispatchRemoteSync()
    })

    // The Yjs path's `handleSync` calls `yjs.replaceFromJson`, which
    // runs in a Yjs transaction. The `doc.on('update', ...)` listener
    // then re-publishes the serialized snapshot asynchronously.
    await waitFor(() => {
      expect(yjsHook.result.current.data?.meta.name).toBe('Remote Allotment')
    })
    const yjsAfter = stripVolatile(yjsHook.result.current.data)
    yjsHook.unmount()

    // --- Compare ---
    expect(yjsAfter).toEqual(legacyAfter)
  }, 30_000)

  it('legacy and Yjs paths both adopt the cloud payload after resolveConflict("cloud") (PR-A.2)', async () => {
    // PR-A.2 wraps the legacy `resolveConflict` so a `'cloud'` choice
    // also writes the remote snapshot into the Yjs doc. Without this,
    // the legacy chain would adopt the cloud data but the Yjs doc would
    // remain stale, and the mirror would push the stale doc back over
    // the cloud copy the user just explicitly chose.
    //
    // This test cannot reuse the parity test's main scaffolding because
    // a real conflict requires Supabase wiring (the legacy chain only
    // raises `syncConflict` after a `fetchRemote` round-trip). Instead
    // we mock `@/lib/supabase/sync` to surface a conflict, drive
    // `resolveConflict('cloud')` against both paths, and compare the
    // resulting `data` snapshots.

    const remoteData: AllotmentData = {
      ...makeFixture(),
      meta: {
        name: 'Cloud Allotment',
        location: 'Aberdeen',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2026-05-16T11:00:00.000Z',
      },
    }

    async function runWithFlag(useYjsStorage: boolean): Promise<unknown> {
      vi.resetModules()
      vi.doMock('@/config/release-visibility', () => ({
        SHOW_ROTATION_SUGGESTIONS: false,
        SHOW_ADVANCED_AREA_FIELDS: false,
        SHOW_CARE_LOGS: true,
        SHOW_UNDERPLANTINGS: false,
        USE_YJS_STORAGE: useYjsStorage,
      }))
      // Pretend the user is signed in and Supabase is configured so
      // `canSync` is `true` and the initial-sync effect runs. The flag
      // helper for the conflict path is hand-rolled here because the
      // test needs additional mocks the existing helpers don't apply.
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
      // Pre-seed a sync flag so the initial sync treats this as a
      // *subsequent* sync (which can produce a conflict) rather than a
      // first-time-cloud-wins sync. Set the flag's lastSyncedAt to
      // before both local and remote `updatedAt` values so both sides
      // appear to have changed.
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

      // Wait for the initial sync to raise the conflict.
      await waitFor(() => {
        expect(hook.result.current.syncConflict).not.toBeNull()
      }, { timeout: 5000 })

      await act(async () => {
        hook.result.current.resolveConflict('cloud')
      })

      // After resolveConflict('cloud') the legacy chain adopts the
      // remote snapshot synchronously. On the Yjs path the wrapped
      // resolveConflict also fires `yjs.replaceFromJson` which republishes
      // the snapshot async. Wait for the visible name to match.
      await waitFor(() => {
        expect(hook.result.current.data?.meta.name).toBe('Cloud Allotment')
      })

      const finalSnapshot = stripVolatile(hook.result.current.data)
      hook.unmount()
      return finalSnapshot
    }

    // --- Legacy path ---
    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()
    const legacySnapshot = await runWithFlag(false)

    // --- Yjs path ---
    resetIdCounter()
    localStorage.clear()
    await resetIndexedDB()
    const yjsSnapshot = await runWithFlag(true)

    expect(yjsSnapshot).toEqual(legacySnapshot)
  }, 30_000)
})
