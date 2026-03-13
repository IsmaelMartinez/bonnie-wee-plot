import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSyncedStorage, getSyncFlag } from '@/hooks/useSyncedStorage'
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

// Mock Supabase sync
const mockFetchRemote = vi.fn()
const mockPushToRemote = vi.fn()
vi.mock('@/lib/supabase/sync', () => ({
  fetchRemote: (...args: unknown[]) => mockFetchRemote(...args),
  pushToRemote: (...args: unknown[]) => mockPushToRemote(...args),
}))

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

// Mock usePersistedStorage — use mutable return values
let mockLocalData: AllotmentData | null = null
let mockIsLoading = false
let mockSaveStatus = 'idle'
const mockSetData = vi.fn()
const mockFlushSave = vi.fn().mockResolvedValue(true)
vi.mock('@/hooks/usePersistedStorage', () => ({
  usePersistedStorage: vi.fn(() => ({
    data: mockLocalData,
    setData: mockSetData,
    isLoading: mockIsLoading,
    error: null,
    saveError: null,
    saveStatus: mockSaveStatus,
    lastSavedAt: null,
    isSyncedFromOtherTab: false,
    reload: vi.fn(),
    flushSave: mockFlushSave,
    clearSaveError: vi.fn(),
    cancelPendingSave: vi.fn(),
    retrySave: vi.fn(),
  })),
}))

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

const hookOptions = {
  storageKey: 'test',
  load: vi.fn(() => ({ success: true as const, data: undefined })),
  save: vi.fn(() => ({ success: true as const })),
}

describe('useSyncedStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
    mockUserId = 'user-123'
    mockIsSignedIn = true
    mockIsOnline = true
    mockJustReconnected = false
    mockLocalData = null
    mockIsLoading = false
    mockSaveStatus = 'idle'
    // Clear sync flags
    localStorage.clear()
  })

  it('exposes the same interface as usePersistedStorage plus syncStatus and conflict', () => {
    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('setData')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('saveStatus')
    expect(result.current).toHaveProperty('syncStatus')
    expect(result.current).toHaveProperty('syncError')
    expect(result.current).toHaveProperty('syncConflict')
    expect(result.current).toHaveProperty('resolveConflict')
  })

  it('syncStatus is "disabled" when not signed in', () => {
    mockUserId = null
    mockIsSignedIn = false

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    expect(result.current.syncStatus).toBe('disabled')
  })

  it('pushes local data to cloud when no remote data exists', async () => {
    const localData = makeTestData('2026-03-04T12:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue(null)
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    // Should set the sync flag
    expect(getSyncFlag('user-123')).not.toBeNull()
  })

  // NEW: First sync for a new device — cloud always wins, even with setupCompleted local data
  it('cloud wins on first sync for new device, even when local has setupCompleted', async () => {
    const localData = makeBootstrapData('2026-03-04T14:00:00Z')
    const remoteData = makeTestData('2026-03-04T10:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-04T10:00:00Z',
    })
    // No sync flag — first time for this device/user

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockSetData).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  // NEW: First sync — cloud wins regardless of timestamps
  it('cloud wins on first sync even when local timestamp is newer', async () => {
    const localData = makeTestData('2026-03-04T18:00:00Z')
    const remoteData = makeTestData('2026-03-04T10:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-04T10:00:00Z',
    })

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockSetData).toHaveBeenCalledWith(remoteData)
  })

  // LWW: subsequent sync when only remote changed
  it('updates local data when cloud is newer on subsequent sync (LWW)', async () => {
    // Set a past sync time
    const pastSyncTime = '2026-03-01T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData(pastSyncTime) // local unchanged since last sync
    const remoteData = makeTestData('2026-03-10T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-10T14:00:00Z',
    })

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockSetData).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  // LWW: subsequent sync when only local changed
  it('pushes to cloud when local is newer on subsequent sync (LWW)', async () => {
    const pastSyncTime = '2026-03-01T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-10T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: makeTestData(pastSyncTime), // remote unchanged
      updatedAt: pastSyncTime,
    })
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(mockSetData).not.toHaveBeenCalled()
  })

  // NEW: Bidirectional conflict detection
  it('detects conflict when both local and remote changed since last sync', async () => {
    // Simulate a previous sync at a known time
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z')
    const remoteData = makeTestData('2026-03-05T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })
    expect(result.current.syncConflict).not.toBeNull()
    expect(result.current.syncConflict!.local).toBe(localData)
    expect(result.current.syncConflict!.remote).toBe(remoteData)
    // Neither setData nor pushToRemote should be called during conflict
    expect(mockSetData).not.toHaveBeenCalled()
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  // NEW: Conflict resolution — choose cloud
  it('resolves conflict by choosing cloud version', async () => {
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z')
    const remoteData = makeTestData('2026-03-05T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('conflict')
    })

    await act(async () => {
      result.current.resolveConflict('cloud')
    })

    expect(mockSetData).toHaveBeenCalledWith(remoteData)
    expect(result.current.syncStatus).toBe('synced')
    expect(result.current.syncConflict).toBeNull()
  })

  // NEW: Conflict resolution — choose local
  it('resolves conflict by choosing local version', async () => {
    const pastSyncTime = '2026-03-04T12:00:00Z'
    localStorage.setItem(
      'bonnie-synced-user-123',
      JSON.stringify({ lastSyncedAt: pastSyncTime })
    )

    const localData = makeTestData('2026-03-05T10:00:00Z')
    const remoteData = makeTestData('2026-03-05T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-05T14:00:00Z',
    })
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

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

  it('ignores stale initial-sync results when user changes mid-request', async () => {
    const localData = makeTestData('2026-03-04T14:00:00Z')
    const staleRemoteData = makeTestData('2026-03-04T18:00:00Z')
    mockLocalData = localData
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

    const { result, rerender } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(mockFetchRemote).toHaveBeenCalledTimes(1)
    })

    mockUserId = 'user-456'
    rerender()

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

    expect(mockSetData).not.toHaveBeenCalledWith(staleRemoteData)
    expect(mockPushToRemote).not.toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-456', localData)
  })

  it('sets error status on sync failure', async () => {
    mockLocalData = makeTestData('2026-03-04T12:00:00Z')
    mockFetchRemote.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('error')
    })
    expect(result.current.syncError).toBe('Network error')
  })

  it('shows offline status when not connected', () => {
    mockIsOnline = false
    mockLocalData = makeTestData('2026-03-04T12:00:00Z')

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    expect(result.current.syncStatus).toBe('offline')
  })
})
