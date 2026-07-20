/**
 * useAiQuota — the shared client-side lookup of the free-tier AI counter,
 * reused by Settings (AiQuotaSection) and the Season Review narration panel.
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiQuota } from '@/hooks/useAiQuota'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getCurrentUsage } from '@/lib/supabase/ai-usage'

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(),
  createAuthClient: vi.fn(),
}))

vi.mock('@/lib/supabase/ai-usage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/supabase/ai-usage')>()),
  getCurrentUsage: vi.fn(),
}))

const useOptionalAuthMock = vi.mocked(useOptionalAuth)
const isSupabaseConfiguredMock = vi.mocked(isSupabaseConfigured)
const getCurrentUsageMock = vi.mocked(getCurrentUsage)

function authState(isSignedIn: boolean, token: string | null = 'jwt-token') {
  return {
    isSignedIn,
    userId: isSignedIn ? 'user_1' : null,
    getToken: vi.fn(async () => (isSignedIn ? token : null)),
    signOut: async () => {},
    userEmail: undefined,
  }
}

const USAGE = { yearMonth: '2026-07', requestCount: 3, remaining: 27 }

describe('useAiQuota', () => {
  beforeEach(() => {
    getCurrentUsageMock.mockReset()
    isSupabaseConfiguredMock.mockReturnValue(true)
    useOptionalAuthMock.mockReturnValue(authState(true))
  })

  it('fetches the current usage for a signed-in user', async () => {
    getCurrentUsageMock.mockResolvedValue(USAGE)

    const { result } = renderHook(() => useAiQuota())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toEqual(USAGE)
    expect(result.current.error).toBeNull()
    expect(getCurrentUsageMock).toHaveBeenCalledWith('jwt-token', 'user_1')
  })

  it('does not fetch and resolves quietly when signed out', async () => {
    useOptionalAuthMock.mockReturnValue(authState(false))

    const { result } = renderHook(() => useAiQuota())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toBeNull()
    expect(result.current.error).toBeNull()
    expect(getCurrentUsageMock).not.toHaveBeenCalled()
  })

  it('does not fetch when disabled, even signed in', async () => {
    const { result } = renderHook(() => useAiQuota(false))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toBeNull()
    expect(getCurrentUsageMock).not.toHaveBeenCalled()
  })

  it('does not fetch when Supabase is not configured', async () => {
    isSupabaseConfiguredMock.mockReturnValue(false)

    const { result } = renderHook(() => useAiQuota())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toBeNull()
    expect(getCurrentUsageMock).not.toHaveBeenCalled()
  })

  it('reports an error (usage stays null) when the lookup fails', async () => {
    getCurrentUsageMock.mockRejectedValue(new Error('supabase down'))

    const { result } = renderHook(() => useAiQuota())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toBeNull()
    expect(result.current.error).toBe('supabase down')
  })

  it('reports an error when the JWT template yields no token', async () => {
    useOptionalAuthMock.mockReturnValue(authState(true, null))

    const { result } = renderHook(() => useAiQuota())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage).toBeNull()
    expect(result.current.error).toMatch(/JWT template/i)
    expect(getCurrentUsageMock).not.toHaveBeenCalled()
  })

  it('re-fetches on refresh()', async () => {
    getCurrentUsageMock.mockResolvedValueOnce(USAGE)
    getCurrentUsageMock.mockResolvedValueOnce({ ...USAGE, requestCount: 4, remaining: 26 })

    const { result } = renderHook(() => useAiQuota())
    await waitFor(() => expect(result.current.usage).toEqual(USAGE))

    act(() => result.current.refresh())

    await waitFor(() =>
      expect(result.current.usage).toEqual({ ...USAGE, requestCount: 4, remaining: 26 })
    )
    expect(getCurrentUsageMock).toHaveBeenCalledTimes(2)
  })

  it('clears a previously shown usage when a refresh fails', async () => {
    getCurrentUsageMock.mockResolvedValueOnce(USAGE)
    getCurrentUsageMock.mockRejectedValueOnce(new Error('supabase down'))

    const { result } = renderHook(() => useAiQuota())
    await waitFor(() => expect(result.current.usage).toEqual(USAGE))

    act(() => result.current.refresh())

    // The failed re-read must not leave the stale count on show.
    await waitFor(() => expect(result.current.error).toBe('supabase down'))
    expect(result.current.usage).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('clears a previous error when a later fetch succeeds', async () => {
    getCurrentUsageMock.mockRejectedValueOnce(new Error('supabase down'))
    getCurrentUsageMock.mockResolvedValueOnce(USAGE)

    const { result } = renderHook(() => useAiQuota())
    await waitFor(() => expect(result.current.error).toBe('supabase down'))

    act(() => result.current.refresh())

    await waitFor(() => expect(result.current.usage).toEqual(USAGE))
    expect(result.current.error).toBeNull()
  })
})
