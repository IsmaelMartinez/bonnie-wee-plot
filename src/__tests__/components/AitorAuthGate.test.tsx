import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { AllotmentData } from '@/types/unified-allotment'

// Mocks must be declared before importing the component under test.
const useOptionalAuthMock = vi.fn()
const useAllotmentMock = vi.fn()

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: () => useOptionalAuthMock(),
}))

vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: () => useAllotmentMock(),
}))

// Stub out the heavy children so we only assert on AitorAuthGate's gating logic.
vi.mock('@/components/ai-advisor/AitorChatButton', () => ({
  default: () => <div data-testid="aitor-chat-button" />,
}))
vi.mock('@/components/ai-advisor/AitorChatModal', () => ({
  default: () => <div data-testid="aitor-chat-modal" />,
}))

import AitorAuthGate from '@/components/ai-advisor/AitorAuthGate'

function dataWith(aiAdvisorEnabled: boolean | undefined): { data: Partial<AllotmentData> } {
  return {
    data: {
      meta: {
        name: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        aiAdvisorEnabled,
      },
    } as Partial<AllotmentData>,
  }
}

describe('AitorAuthGate', () => {
  beforeEach(() => {
    useOptionalAuthMock.mockReset()
    useAllotmentMock.mockReset()
  })

  it('renders nothing when the user is not signed in', () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: false })
    useAllotmentMock.mockReturnValue(dataWith(true))

    const { container } = render(<AitorAuthGate />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when signed in but aiAdvisorEnabled is false', () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(false))

    const { container } = render(<AitorAuthGate />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when signed in but aiAdvisorEnabled is undefined', () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(undefined))

    const { container } = render(<AitorAuthGate />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the chat button and modal when signed in and opted in', () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(true))

    const { getByTestId } = render(<AitorAuthGate />)
    expect(getByTestId('aitor-chat-button')).toBeInTheDocument()
    expect(getByTestId('aitor-chat-modal')).toBeInTheDocument()
  })
})
