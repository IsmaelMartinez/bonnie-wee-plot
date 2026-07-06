import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCloudSync, getSyncFlag } from '@/hooks/useCloudSync'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock auth — use mutable variables so tests can override
let mockUserId: string | null = 'user-123'
let mockIsSignedIn: boolean | false = true
const mockGetToken = vi.fn()

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: () => ({
    getToken: mockGetToken,
    userId: mockUserId,
    isSignedIn: mockIsSignedIn,
  }),
}))

// Mock Supabase sync — keep contentSnapshot/isLocalStructurallySmaller real
// since they are pure helpers that the hook depends on for its logic.
const mockFetchRemote = vi.fn()
const mockPushToRemote = vi.fn()
vi.mock('@/lib/supabase/sync', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/sync')>('@/lib/supabase/sync')
  return {
    ...actual,
    fetchRemote: (...args: unknown[]) => mockFetchRemote(...args),
    pushToRemote: (...args: unknown[]) => mockPushToRemote(...args),
  }
})

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

// Mock network status
let mockIsOnline = true
let mockJustReconnected = false
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline, isOffline: !mockIsOnline, justReconnected: mockJustReconnected }),
}))

// The Yjs-snapshot sinks the hook writes through. `applyRemote` stands in for
// `useYjsDoc.replaceFromJson`; `flushLocal` for `useYjsDoc.flushSave`.
const applyRemote = vi.fn()
const flushLocal = vi.fn().mockResolvedValue(true)

const makeTestData = (updatedAt: string, overrides?: Partial<AllotmentData>): AllotmentData =>
  ({
    version: 16,
    meta: { name: 'Test', updatedAt },
    layout: { areas: [{ id: 'bed-a', kind: 'rotation-bed', name: 'Bed A' }] },
    seasons: [],
    currentYear: 2026,
    varieties: [{ id: 'v1', name: 'Tomato' }],
    ...overrides,
  }) as unknown as AllotmentData

const makeBootstrapData = (updatedAt: string): AllotmentData =>
  ({
    version: 16,
    meta: {
      name: 'My Allotment',
      location: 'Edinburgh, Scotland',
      updatedAt,
      setupCompleted: true,
    },
    layout: { areas: [] },
    seasons: [{ year: 2026, status: 'current', areas: [], createdAt: updatedAt, updatedAt }],
    currentYear: 2026,
    varieties: [],
    customTasks: [],
    maintenanceTasks: [],
    gardenEvents: [],
    compost: [],
  }) as unknown as AllotmentData

// Render `useCloudSync` with a given Yjs snapshot. Rerender with a fresh
// `data` reference to simulate a mutation publishing a new snapshot (the
// Step 5 replacement for the legacy `saveStatus === 'saved'` push signal).
function renderCloudSync(initialData: AllotmentData | null) {
  return renderHook(
    ({ data }: { data: AllotmentData | null }) =>
      useCloudSync({ data, applyRemote, flushLocal }),
    { initialProps: { data: initialData } },
  )
}

describe('useCloudSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
    flushLocal.mockResolvedValue(true)
    mockUserId = 'user-123'
    mockIsSignedIn = true
    mockIsOnline = true
    mockJustReconnected = false
    // Clear sync flags
    localStorage.clear()
  })

  it('exposes syncStatus, conflict, and flush surface', () => {
    const { result } = renderCloudSync(null)

    expect(result.current).toHaveProperty('syncStatus')
    expect(result.current).toHaveProperty('syncError')
    expect(result.current).toHaveProperty('syncConflict')
    expect(result.current).toHaveProperty('resolveConflict')
    expect(result.current).toHaveProperty('flushPush')
  })

  it('syncStatus is "disabled" when not signed in', () => {
    mockUserId = null
    mockIsSignedIn = false

    const { result } = renderCloudSync(null)

    expect(result.current.syncStatus).toBe('disabled')
  })

  it('pushes local data to cloud when no remote data exists', async () => {
    const localData = makeTestData('2026-03-04T12:00:00Z')
    mockFetchRemote.mockResolvedValue(null)
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    // Should set the sync flag
    expect(getSyncFlag('user-123')).not.toBeNull()
  })

  it('cloud wins on first sync for new device, even when local has setupCompleted', async () => {
    const localData = makeBootstrapData('2026-03-04T14:00:00Z')
    const remoteData = makeTestData('2026-03-04T10:00:00Z')
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-04T10:00:00Z',
    })
    // No sync flag — first time for this device/user

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(applyRemote).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  it('cloud wins on first sync even when local timestamp is newer', async () => {
    const localData = makeTestData('2026-03-04T18:00:00Z')
    const remoteData = makeTestData('2026-03-04T10:00:00Z')
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-04T10:00:00Z',
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(applyRemote).toHaveBeenCalledWith(remoteData)
  })

  it('updates local data when cloud is newer on subsequent sync (LWW)', async () => {
    const pastSyncTime = '2026-03-01T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData(pastSyncTime) // local unchanged since last sync
    const remoteData = makeTestData('2026-03-10T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v2', name: 'Pea' }] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-10T14:00:00Z',
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(applyRemote).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  it('pushes to cloud when local is newer on subsequent sync (LWW)', async () => {
    const pastSyncTime = '2026-03-01T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-10T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v2', name: 'Pea' }] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: makeTestData(pastSyncTime), // remote unchanged, different content
      updatedAt: pastSyncTime,
    })
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(applyRemote).not.toHaveBeenCalled()
  })

  it('detects conflict when both local and remote changed since last sync', async () => {
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-local', name: 'Local-only' }] as unknown as AllotmentData['varieties'],
    })
    const remoteData = makeTestData('2026-03-05T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-remote', name: 'Remote-only' }] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })
    expect(result.current.syncConflict).not.toBeNull()
    expect(result.current.syncConflict!.local).toBe(localData)
    expect(result.current.syncConflict!.remote).toBe(remoteData)
    // Neither applyRemote nor pushToRemote should be called during conflict
    expect(applyRemote).not.toHaveBeenCalled()
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  it('resolves conflict by choosing cloud version', async () => {
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-local', name: 'Local-only' }] as unknown as AllotmentData['varieties'],
    })
    const remoteData = makeTestData('2026-03-05T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-remote', name: 'Remote-only' }] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })

    await act(async () => {
      result.current.resolveConflict('cloud')
    })

    expect(applyRemote).toHaveBeenCalledWith(remoteData)
    expect(result.current.syncStatus).toBe('synced')
    expect(result.current.syncConflict).toBeNull()
  })

  it('resolves conflict by choosing local version', async () => {
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-local', name: 'Local-only' }] as unknown as AllotmentData['varieties'],
    })
    const remoteData = makeTestData('2026-03-05T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v-remote', name: 'Remote-only' }] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })

    await act(async () => {
      result.current.resolveConflict('local')
    })

    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(result.current.syncStatus).toBe('synced')
    expect(result.current.syncConflict).toBeNull()
  })

  // Cloud-overwrite incident regression: a stale local with a newer timestamp
  // must NOT silently overwrite a richer cloud snapshot.
  it('routes through conflict when local is structurally smaller than remote despite a newer local timestamp', async () => {
    const pastSyncTime = '2026-03-01T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-10T14:00:00Z', {
      varieties: [{ id: 'v1', name: 'Tomato' }] as unknown as AllotmentData['varieties'],
    })
    const remoteData = makeTestData(pastSyncTime, {
      varieties: [
        { id: 'v1', name: 'Tomato' },
        { id: 'v2', name: 'Pea' },
        { id: 'v3', name: 'Carrot' },
      ] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: pastSyncTime,
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })
    expect(mockPushToRemote).not.toHaveBeenCalled()
    expect(result.current.syncConflict?.local).toBe(localData)
    expect(result.current.syncConflict?.remote).toBe(remoteData)
  })

  it('routes through conflict when timestamps are equal but content differs', async () => {
    const sharedTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: sharedTime })
    )

    const localData = makeTestData(sharedTime, {
      varieties: [{ id: 'v1', name: 'Tomato' }] as unknown as AllotmentData['varieties'],
    })
    const remoteData = makeTestData(sharedTime, {
      varieties: [
        { id: 'v1', name: 'Tomato' },
        { id: 'v2', name: 'Pea' },
      ] as unknown as AllotmentData['varieties'],
    })
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: sharedTime,
    })

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })
    expect(mockPushToRemote).not.toHaveBeenCalled()
    expect(applyRemote).not.toHaveBeenCalled()
    expect(result.current.syncConflict?.local).toBe(localData)
    expect(result.current.syncConflict?.remote).toBe(remoteData)
  })

  it('ignores stale initial-sync results when user changes mid-request', async () => {
    const localData = makeTestData('2026-03-04T14:00:00Z')
    const staleRemoteData = makeTestData('2026-03-04T18:00:00Z')
    mockPushToRemote.mockResolvedValue(undefined)

    let resolveFirstFetch: (value: { data: AllotmentData; updatedAt: string }) => void = () => undefined
    let hasFirstFetchResolver = false
    mockFetchRemote
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirstFetch = resolve as (value: { data: AllotmentData; updatedAt: string }) => void
            hasFirstFetchResolver = true
          })
      )
      .mockResolvedValueOnce(null)

    const { result, rerender } = renderCloudSync(localData)

    await waitFor(() => {
      expect(mockFetchRemote).toHaveBeenCalledTimes(1)
    })

    mockUserId = 'user-456'
    rerender({ data: localData })

    await waitFor(() => {
      expect(mockFetchRemote).toHaveBeenCalledTimes(2)
    })

    if (!hasFirstFetchResolver) {
      throw new Error('Expected first fetch resolver to be set')
    }

    resolveFirstFetch({
      data: staleRemoteData,
      updatedAt: '2026-03-04T18:00:00Z',
    })

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })

    expect(applyRemote).not.toHaveBeenCalledWith(staleRemoteData)
    expect(mockPushToRemote).not.toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-456', localData)
  })

  it('sets error status on sync failure', async () => {
    const localData = makeTestData('2026-03-04T12:00:00Z')
    mockFetchRemote.mockRejectedValue(new Error('Network error'))

    const { result } = renderCloudSync(localData)

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('error')
    })
    expect(result.current.syncError).toBe('Network error')
  })

  it('shows offline status when not connected', () => {
    mockIsOnline = false
    const localData = makeTestData('2026-03-04T12:00:00Z')

    const { result } = renderCloudSync(localData)

    expect(result.current.syncStatus).toBe('offline')
  })

  // Push debounce: a burst of snapshot changes within PUSH_DEBOUNCE_MS (30s)
  // should collapse to a single push of the latest snapshot.
  describe('push debounce', () => {
    // Drive useCloudSync past initial sync so the push effect arms. Returns a
    // `triggerSave(data)` helper that rerenders with a fresh snapshot
    // reference so the push effect refires (the Yjs doc publishes a new
    // `data` reference on every mutation).
    const setupSyncedHook = async () => {
      const initialData = makeTestData('2026-04-01T12:00:00Z')
      // Past sync flag — subsequent-sync path
      const pastSyncTime = '2026-03-01T12:00:00Z'
      localStorage.setItem(
        'bonnie-synced-user-123',
        JSON.stringify({ lastSyncedAt: pastSyncTime })
      )
      // Remote matches initial local content so the content short-circuit
      // fires; no push happens during initial sync.
      mockFetchRemote.mockResolvedValue({
        data: initialData,
        updatedAt: '2026-04-01T12:00:00Z',
      })
      mockPushToRemote.mockResolvedValue(undefined)

      const hook = renderCloudSync(initialData)
      await waitFor(() => {
        expect(hook.result.current.syncStatus).toBe('synced')
      })
      // Initial sync did not push (content matched), so the push counter
      // starts at zero for the debounce assertions below.
      expect(mockPushToRemote).not.toHaveBeenCalled()

      const triggerSave = async (data: AllotmentData) => {
        hook.rerender({ data })
        // Let any microtasks queued by the effect drain
        await Promise.resolve()
      }

      return { ...hook, triggerSave }
    }

    it('coalesces a burst of 3 rapid saves into a single push of the latest snapshot', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { triggerSave } = await setupSyncedHook()

        const v1 = makeTestData('2026-04-01T12:00:01Z', {
          varieties: [{ id: 'v1', name: 'Tomato' }] as unknown as AllotmentData['varieties'],
        })
        const v2 = makeTestData('2026-04-01T12:00:02Z', {
          varieties: [
            { id: 'v1', name: 'Tomato' },
            { id: 'v2', name: 'Pea' },
          ] as unknown as AllotmentData['varieties'],
        })
        const v3 = makeTestData('2026-04-01T12:00:03Z', {
          varieties: [
            { id: 'v1', name: 'Tomato' },
            { id: 'v2', name: 'Pea' },
            { id: 'v3', name: 'Carrot' },
          ] as unknown as AllotmentData['varieties'],
        })

        await act(async () => {
          await triggerSave(v1)
          vi.advanceTimersByTime(5_000)
          await triggerSave(v2)
          vi.advanceTimersByTime(5_000)
          await triggerSave(v3)
        })
        // Still inside the debounce window — no push yet
        expect(mockPushToRemote).not.toHaveBeenCalled()

        // Advance past the 30s debounce window
        await act(async () => {
          vi.advanceTimersByTime(30_000)
          // Drain the async push chain
          await Promise.resolve()
          await Promise.resolve()
        })

        await waitFor(() => {
          expect(mockPushToRemote).toHaveBeenCalledTimes(1)
        })
        expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', v3)
      } finally {
        vi.useRealTimers()
      }
    })

    it('flushPush() cancels the pending debounce and pushes immediately', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { result, triggerSave } = await setupSyncedHook()

        const v1 = makeTestData('2026-04-01T12:00:01Z', {
          varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v2', name: 'Pea' }] as unknown as AllotmentData['varieties'],
        })

        await act(async () => {
          await triggerSave(v1)
        })
        expect(mockPushToRemote).not.toHaveBeenCalled()

        await act(async () => {
          await result.current.flushPush()
        })

        expect(mockPushToRemote).toHaveBeenCalledTimes(1)
        expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', v1)

        // Timer should be cancelled — advancing past the window must not
        // produce a second push.
        await act(async () => {
          vi.advanceTimersByTime(60_000)
          await Promise.resolve()
        })
        expect(mockPushToRemote).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('beforeunload triggers a flush of the pending push', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const { triggerSave } = await setupSyncedHook()

        const v1 = makeTestData('2026-04-01T12:00:01Z', {
          varieties: [{ id: 'v1', name: 'Tomato' }, { id: 'v2', name: 'Pea' }] as unknown as AllotmentData['varieties'],
        })

        await act(async () => {
          await triggerSave(v1)
        })
        expect(mockPushToRemote).not.toHaveBeenCalled()

        await act(async () => {
          window.dispatchEvent(new Event('beforeunload'))
          // flushLocal is awaited inside the listener; drain the chain
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
        })

        await waitFor(() => {
          expect(mockPushToRemote).toHaveBeenCalledTimes(1)
        })
        expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', v1)
        expect(flushLocal).toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
