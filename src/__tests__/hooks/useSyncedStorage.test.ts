import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSyncedStorage } from '@/hooks/useSyncedStorage'
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

const makeTestData = (updatedAt: string): AllotmentData =>
  ({
    version: 16,
    meta: { name: 'Test', updatedAt },
    layout: { areas: [] },
    seasons: [],
    currentYear: 2026,
    varieties: [],
  }) as unknown as AllotmentData

const hookOptions = {
  storageKey: 'test',
  load: vi.fn(() => ({ success: true as const, data: undefined })),
  save: vi.fn(() => ({ success: true as const })),
}

// Helper to set/clear the synced-before flag
function setSyncedFlag(userId: string, value: boolean) {
  const key = `bonnie-synced-${userId}`
  if (value) {
    localStorage.setItem(key, 'true')
  } else {
    localStorage.removeItem(key)
  }
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
    localStorage.clear()
  })

  it('exposes the same interface as usePersistedStorage plus syncStatus', () => {
    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('setData')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('saveStatus')
    expect(result.current).toHaveProperty('syncStatus')
    expect(result.current).toHaveProperty('syncError')
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
    expect(localStorage.getItem('bonnie-synced-user-123')).toBe('true')
  })

  it('prefers cloud when device has never synced for this user (new browser)', async () => {
    // No synced flag — simulates a new browser
    const localData = makeTestData('2026-03-04T14:00:00Z') // local is "newer"
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
    expect(mockPushToRemote).not.toHaveBeenCalled()
    expect(localStorage.getItem('bonnie-synced-user-123')).toBe('true')
  })

  it('prefers cloud when device has never synced, even with setupCompleted local data', async () => {
    // This is the exact bug scenario: user skipped onboarding before signing in
    const localData = {
      ...makeTestData('2026-03-04T14:00:00Z'),
      meta: { name: 'My Allotment', updatedAt: '2026-03-04T14:00:00Z', setupCompleted: true },
    } as unknown as AllotmentData
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
    // Cloud should still win — the synced flag is what matters, not data content
    expect(mockSetData).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  it('uses LWW when device has synced before — cloud newer wins', async () => {
    setSyncedFlag('user-123', true)
    const localData = makeTestData('2026-03-04T10:00:00Z')
    const remoteData = makeTestData('2026-03-04T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: remoteData,
      updatedAt: '2026-03-04T14:00:00Z',
    })

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockSetData).toHaveBeenCalledWith(remoteData)
    expect(mockPushToRemote).not.toHaveBeenCalled()
  })

  it('uses LWW when device has synced before — local newer pushes', async () => {
    setSyncedFlag('user-123', true)
    const localData = makeTestData('2026-03-04T14:00:00Z')
    mockLocalData = localData
    mockFetchRemote.mockResolvedValue({
      data: makeTestData('2026-03-04T10:00:00Z'),
      updatedAt: '2026-03-04T10:00:00Z',
    })
    mockPushToRemote.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSyncedStorage(hookOptions))

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced')
    })
    expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)
    expect(mockSetData).not.toHaveBeenCalled()
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
