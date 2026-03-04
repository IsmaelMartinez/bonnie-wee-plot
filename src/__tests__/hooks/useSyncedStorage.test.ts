import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSyncedStorage } from '@/hooks/useSyncedStorage'

// Mock Clerk auth — use mutable variables so tests can override
let mockUserId: string | null = 'user-123'
let mockIsSignedIn = true
const mockGetToken = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    userId: mockUserId,
    isSignedIn: mockIsSignedIn,
  }),
}))

// Mock Supabase sync
vi.mock('@/lib/supabase/sync', () => ({
  fetchRemote: vi.fn(),
  pushToRemote: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

// Mock network status
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true, isOffline: false, justReconnected: false }),
}))

// Mock usePersistedStorage
const mockSetData = vi.fn()
const mockFlushSave = vi.fn().mockResolvedValue(true)
vi.mock('@/hooks/usePersistedStorage', () => ({
  usePersistedStorage: vi.fn(() => ({
    data: null,
    setData: mockSetData,
    isLoading: false,
    error: null,
    saveError: null,
    saveStatus: 'idle',
    lastSavedAt: null,
    isSyncedFromOtherTab: false,
    reload: vi.fn(),
    flushSave: mockFlushSave,
    clearSaveError: vi.fn(),
    cancelPendingSave: vi.fn(),
    retrySave: vi.fn(),
  })),
}))

describe('useSyncedStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
    mockUserId = 'user-123'
    mockIsSignedIn = true
  })

  it('exposes the same interface as usePersistedStorage plus syncStatus', () => {
    const { result } = renderHook(() =>
      useSyncedStorage({
        storageKey: 'test',
        load: vi.fn(() => ({ success: true, data: undefined })),
        save: vi.fn(() => ({ success: true })),
      })
    )

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

    const { result } = renderHook(() =>
      useSyncedStorage({
        storageKey: 'test',
        load: vi.fn(() => ({ success: true, data: undefined })),
        save: vi.fn(() => ({ success: true })),
      })
    )

    expect(result.current.syncStatus).toBe('disabled')
  })
})
