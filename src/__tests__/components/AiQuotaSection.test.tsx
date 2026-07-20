/**
 * AiQuotaSection — Settings surface for the shared free-tier AI quota.
 * The lookup itself lives in useAiQuota (shared with NarrationPanel); this
 * component renders it with copy that says the quota is shared between Aitor
 * and season narration.
 */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AiQuotaSection from '@/components/settings/AiQuotaSection'
import { useAiQuota } from '@/hooks/useAiQuota'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'

vi.mock('@/hooks/useAiQuota', () => ({
  useAiQuota: vi.fn(),
}))

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: vi.fn(),
}))

const useAiQuotaMock = vi.mocked(useAiQuota)
const useOptionalAuthMock = vi.mocked(useOptionalAuth)

function authState(isSignedIn: boolean) {
  return {
    isSignedIn,
    userId: isSignedIn ? 'user_1' : null,
    getToken: async () => null,
    signOut: async () => {},
    userEmail: undefined,
  }
}

function quotaState(overrides: Partial<ReturnType<typeof useAiQuota>> = {}) {
  return {
    usage: null,
    error: null,
    isLoading: false,
    refresh: vi.fn(),
    ...overrides,
  }
}

describe('AiQuotaSection', () => {
  beforeEach(() => {
    useOptionalAuthMock.mockReturnValue(authState(true))
    useAiQuotaMock.mockReset()
    useAiQuotaMock.mockReturnValue(quotaState())
  })

  it('reuses the shared useAiQuota lookup, disabled for BYO-key users', () => {
    render(<AiQuotaSection hasOwnToken={false} />)
    expect(useAiQuotaMock).toHaveBeenCalledWith(true)

    useAiQuotaMock.mockClear()
    render(<AiQuotaSection hasOwnToken={true} />)
    expect(useAiQuotaMock).toHaveBeenCalledWith(false)
  })

  it('shows the count with copy saying the quota is shared with season narration', () => {
    useAiQuotaMock.mockReturnValue(
      quotaState({ usage: { yearMonth: '2026-07', requestCount: 3, remaining: 27 } })
    )
    render(<AiQuotaSection hasOwnToken={false} />)

    expect(screen.getByText(/3 \/ 30 free AI requests used this month/i)).toBeInTheDocument()
    expect(
      screen.getByText(/shared between Aitor and season narration/i)
    ).toBeInTheDocument()
  })

  it('keeps the shared-quota mention in the exhausted state', () => {
    useAiQuotaMock.mockReturnValue(
      quotaState({ usage: { yearMonth: '2026-07', requestCount: 30, remaining: 0 } })
    )
    render(<AiQuotaSection hasOwnToken={false} />)

    expect(screen.getByText(/30 \/ 30 free AI requests used this month/i)).toBeInTheDocument()
    expect(screen.getByText(/quota exhausted/i)).toBeInTheDocument()
    expect(
      screen.getByText(/shared between Aitor and season narration/i)
    ).toBeInTheDocument()
  })

  it('renders nothing for BYO-key users and signed-out users', () => {
    const { container: withToken } = render(<AiQuotaSection hasOwnToken={true} />)
    expect(withToken).toBeEmptyDOMElement()

    useOptionalAuthMock.mockReturnValue(authState(false))
    const { container: signedOut } = render(<AiQuotaSection hasOwnToken={false} />)
    expect(signedOut).toBeEmptyDOMElement()
  })

  it('shows the lookup error message when the fetch fails', () => {
    useAiQuotaMock.mockReturnValue(quotaState({ error: 'supabase down' }))
    render(<AiQuotaSection hasOwnToken={false} />)

    expect(screen.getByText('supabase down')).toBeInTheDocument()
  })
})
