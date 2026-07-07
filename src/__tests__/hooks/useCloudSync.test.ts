import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCloudSync, hasAdoptedLineage } from '@/hooks/useCloudSync'
import type { AllotmentData } from '@/types/unified-allotment'
import type { RemoteBinary } from '@/lib/supabase/sync-binary'

// Mock auth — mutable so tests can override
let mockUserId: string | null = 'user-123'
let mockIsSignedIn = true
const mockGetToken = vi.fn()

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: () => ({
    getToken: mockGetToken,
    userId: mockUserId,
    isSignedIn: mockIsSignedIn,
  }),
}))

// Mock the binary sync service
const mockFetchRemoteBinary = vi.fn()
const mockPushBinary = vi.fn()
vi.mock('@/lib/supabase/sync-binary', () => ({
  fetchRemoteBinary: (...args: unknown[]) => mockFetchRemoteBinary(...args),
  pushBinary: (...args: unknown[]) => mockPushBinary(...args),
}))

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

let mockIsOnline = true
let mockJustReconnected = false
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline, isOffline: !mockIsOnline, justReconnected: mockJustReconnected }),
}))

// Yjs-doc prop spies
const getSnapshot = vi.fn<() => AllotmentData | null>()
const encodeState = vi.fn<() => Uint8Array | null>()
const mergeRemoteUpdate = vi.fn()
const adoptRemoteUpdate = vi.fn()
const replaceFromJson = vi.fn()
const hasUpdatesBeyond = vi.fn<() => boolean>()
const flushLocal = vi.fn().mockResolvedValue(true)

const SNAPSHOT = {
  version: 22,
  meta: { name: 'Test', updatedAt: '2026-07-01T00:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

const LOCAL_STATE = new Uint8Array([1, 2, 3])

const remote = (over: Partial<RemoteBinary> = {}): RemoteBinary => ({
  exists: true,
  update: new Uint8Array([9, 9, 9]),
  yjsUpdatedAt: '2026-07-01T09:00:00Z',
  jsonb: SNAPSHOT,
  ...over,
})

function renderCloudSync(
  initialData: AllotmentData | null = SNAPSHOT,
  isSyncedFromOtherTab = false,
) {
  return renderHook(
    (props: { data: AllotmentData | null; isSyncedFromOtherTab: boolean }) =>
      useCloudSync({
        data: props.data,
        getSnapshot,
        encodeState,
        mergeRemoteUpdate,
        adoptRemoteUpdate,
        replaceFromJson,
        hasUpdatesBeyond,
        flushLocal,
        isSyncedFromOtherTab: props.isSyncedFromOtherTab,
      }),
    { initialProps: { data: initialData, isSyncedFromOtherTab } },
  )
}

describe('useCloudSync (binary transport)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
    getSnapshot.mockReturnValue(SNAPSHOT)
    encodeState.mockReturnValue(LOCAL_STATE)
    hasUpdatesBeyond.mockReturnValue(true)
    flushLocal.mockResolvedValue(true)
    mockPushBinary.mockResolvedValue({ ok: true, casConflict: false, yjsUpdatedAt: 'T-new' })
    mockUserId = 'user-123'
    mockIsSignedIn = true
    mockIsOnline = true
    mockJustReconnected = false
    localStorage.clear()
  })

  it('exposes the sync surface (no conflict fields)', () => {
    const { result } = renderCloudSync(null)
    expect(result.current).toHaveProperty('syncStatus')
    expect(result.current).toHaveProperty('syncError')
    expect(result.current).toHaveProperty('flushPush')
    expect(result.current).not.toHaveProperty('syncConflict')
    expect(result.current).not.toHaveProperty('resolveConflict')
  })

  it('is disabled when not signed in', () => {
    mockUserId = null
    mockIsSignedIn = false
    const { result } = renderCloudSync(null)
    expect(result.current.syncStatus).toBe('disabled')
  })

  it('is offline when not connected', () => {
    mockIsOnline = false
    const { result } = renderCloudSync()
    expect(result.current.syncStatus).toBe('offline')
  })

  it('first cloud user: pushes local as the canonical document', async () => {
    mockFetchRemoteBinary.mockResolvedValue(remote({ exists: false, update: null, yjsUpdatedAt: null, jsonb: null }))

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(mockPushBinary).toHaveBeenCalledWith(
      'test-token',
      'user-123',
      LOCAL_STATE,
      SNAPSHOT,
      { rowExists: false, expectedYjsUpdatedAt: null },
    )
    expect(adoptRemoteUpdate).not.toHaveBeenCalled()
    expect(hasAdoptedLineage('user-123')).toBe(true)
  })

  it('first device sync (binary present): ADOPTS the cloud lineage, no push', async () => {
    const update = new Uint8Array([5, 5])
    mockFetchRemoteBinary.mockResolvedValue(remote({ update }))

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(adoptRemoteUpdate).toHaveBeenCalledWith(update)
    expect(mergeRemoteUpdate).not.toHaveBeenCalled()
    expect(mockPushBinary).not.toHaveBeenCalled()
    expect(hasAdoptedLineage('user-123')).toBe(true)
  })

  it('migration: cloud has JSONB only — hydrate and CAS-seed the binary', async () => {
    mockFetchRemoteBinary.mockResolvedValue(remote({ update: null, yjsUpdatedAt: null }))

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(replaceFromJson).toHaveBeenCalledWith(SNAPSHOT)
    expect(mockPushBinary).toHaveBeenCalledWith(
      'test-token',
      'user-123',
      LOCAL_STATE,
      SNAPSHOT,
      { rowExists: true, expectedYjsUpdatedAt: null },
    )
  })

  it('migration CAS loss: adopts the binary written by the device that migrated first', async () => {
    const winnerUpdate = new Uint8Array([7, 7])
    mockFetchRemoteBinary
      .mockResolvedValueOnce(remote({ update: null, yjsUpdatedAt: null })) // initial: not migrated
      .mockResolvedValueOnce(remote({ update: winnerUpdate })) // re-fetch after CAS loss
    mockPushBinary.mockResolvedValue({ ok: false, casConflict: true, yjsUpdatedAt: null })

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(replaceFromJson).toHaveBeenCalledWith(SNAPSHOT)
    expect(adoptRemoteUpdate).toHaveBeenCalledWith(winnerUpdate)
  })

  it('subsequent sync: merges the remote update and pushes the merged state', async () => {
    localStorage.setItem('bwp-yjs-synced-user-123', JSON.stringify({ adoptedAt: '2026-06-01T00:00:00Z' }))
    const update = new Uint8Array([4, 4])
    mockFetchRemoteBinary.mockResolvedValue(remote({ update, yjsUpdatedAt: 'T5' }))
    hasUpdatesBeyond.mockReturnValue(true)

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(adoptRemoteUpdate).not.toHaveBeenCalled()
    expect(mergeRemoteUpdate).toHaveBeenCalledWith(update)
    expect(mockPushBinary).toHaveBeenCalledWith(
      'test-token',
      'user-123',
      LOCAL_STATE,
      SNAPSHOT,
      { rowExists: true, expectedYjsUpdatedAt: 'T5' },
    )
  })

  it('subsequent sync, pure pull: merges but skips the redundant push', async () => {
    localStorage.setItem('bwp-yjs-synced-user-123', JSON.stringify({ adoptedAt: '2026-06-01T00:00:00Z' }))
    const update = new Uint8Array([4, 4])
    mockFetchRemoteBinary.mockResolvedValue(remote({ update, yjsUpdatedAt: 'T5' }))
    hasUpdatesBeyond.mockReturnValue(false)

    const { result } = renderCloudSync()

    await waitFor(() => expect(result.current.syncStatus).toBe('synced'))
    expect(mergeRemoteUpdate).toHaveBeenCalledWith(update)
    expect(mockPushBinary).not.toHaveBeenCalled()
  })

  it('sets error status when the JWT template is missing', async () => {
    mockGetToken.mockResolvedValue(null)
    const { result } = renderCloudSync()
    await waitFor(() => expect(result.current.syncStatus).toBe('error'))
    expect(result.current.syncError).toContain('supabase')
  })

  it('sets error status on a fetch failure', async () => {
    mockFetchRemoteBinary.mockRejectedValue(new Error('Network error'))
    const { result } = renderCloudSync()
    await waitFor(() => expect(result.current.syncStatus).toBe('error'))
    expect(result.current.syncError).toBe('Network error')
  })

  describe('debounced push', () => {
    // Drive the hook past initial sync (pure pull, no push) so the push effect
    // arms and the push counter starts at zero.
    const setupSynced = async () => {
      localStorage.setItem('bwp-yjs-synced-user-123', JSON.stringify({ adoptedAt: '2026-06-01T00:00:00Z' }))
      mockFetchRemoteBinary.mockResolvedValue(remote({ update: new Uint8Array([1]), yjsUpdatedAt: 'T0' }))
      hasUpdatesBeyond.mockReturnValue(false) // initial sync is a pure pull
      const hook = renderCloudSync()
      await waitFor(() => expect(hook.result.current.syncStatus).toBe('synced'))
      expect(mockPushBinary).not.toHaveBeenCalled()
      // From here on, local edits have something to push.
      hasUpdatesBeyond.mockReturnValue(true)
      const triggerSave = async (data: AllotmentData) => {
        hook.rerender({ data, isSyncedFromOtherTab: false })
        await Promise.resolve()
      }
      return { ...hook, triggerSave }
    }

    it('coalesces a burst of saves into a single push after the window', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { triggerSave } = await setupSynced()
        const v = (n: number) => ({ ...SNAPSHOT, currentYear: 2026 + n }) as AllotmentData

        await act(async () => {
          await triggerSave(v(1))
          vi.advanceTimersByTime(5_000)
          await triggerSave(v(2))
          vi.advanceTimersByTime(5_000)
          await triggerSave(v(3))
        })
        expect(mockPushBinary).not.toHaveBeenCalled()

        await act(async () => {
          vi.advanceTimersByTime(30_000)
          await Promise.resolve()
          await Promise.resolve()
        })

        await waitFor(() => expect(mockPushBinary).toHaveBeenCalledTimes(1))
      } finally {
        vi.useRealTimers()
      }
    })

    it('flushPush() cancels the debounce and pushes immediately', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { result, triggerSave } = await setupSynced()
        await act(async () => {
          await triggerSave({ ...SNAPSHOT, currentYear: 2030 } as AllotmentData)
        })
        expect(mockPushBinary).not.toHaveBeenCalled()

        await act(async () => {
          await result.current.flushPush()
        })
        expect(mockPushBinary).toHaveBeenCalledTimes(1)

        await act(async () => {
          vi.advanceTimersByTime(60_000)
          await Promise.resolve()
        })
        expect(mockPushBinary).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('beforeunload flushes local then pushes the pending change', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { triggerSave } = await setupSynced()
        await act(async () => {
          await triggerSave({ ...SNAPSHOT, currentYear: 2031 } as AllotmentData)
        })
        expect(mockPushBinary).not.toHaveBeenCalled()

        await act(async () => {
          window.dispatchEvent(new Event('beforeunload'))
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
        })

        await waitFor(() => expect(mockPushBinary).toHaveBeenCalledTimes(1))
        expect(flushLocal).toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('does not schedule a push for a snapshot that arrived from another tab', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { rerender } = await setupSynced()
        // A cross-tab broadcast republishes with isSyncedFromOtherTab=true.
        await act(async () => {
          rerender({ data: { ...SNAPSHOT, currentYear: 2099 } as AllotmentData, isSyncedFromOtherTab: true })
          await Promise.resolve()
        })
        await act(async () => {
          vi.advanceTimersByTime(35_000)
          await Promise.resolve()
        })
        expect(mockPushBinary).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
