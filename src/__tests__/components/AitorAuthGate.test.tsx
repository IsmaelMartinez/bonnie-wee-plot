import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { AllotmentData } from '@/types/unified-allotment'

// Mocks must be declared before importing the component under test.
const useOptionalAuthMock = vi.fn()
const useAllotmentMock = vi.fn()
const useAitorChatMock = vi.fn()

vi.mock('@/hooks/useOptionalAuth', () => ({
  useOptionalAuth: () => useOptionalAuthMock(),
}))

vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: () => useAllotmentMock(),
}))

vi.mock('@/contexts/AitorChatContext', () => ({
  useAitorChat: () => useAitorChatMock(),
}))

// Stub out the heavy children so we only assert on AitorAuthGate's gating logic.
vi.mock('@/components/ai-advisor/AitorChatButton', () => ({
  default: () => <div data-testid="aitor-chat-button" />,
}))
vi.mock('@/components/ai-advisor/AitorChatModal', () => ({
  default: () => <div data-testid="aitor-chat-modal" />,
}))

// next/dynamic resolves the loader asynchronously which would defer rendering
// past our synchronous assertions. Mock it to kick off the loader, capture
// the resolved default export, and re-render via state when ready.
vi.mock('next/dynamic', async () => {
  const React = await import('react')
  type DynamicLoader = () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>
  return {
    __esModule: true,
    default: (loader: DynamicLoader) => {
      const loaderPromise = loader()
      const DynamicStub = (props: Record<string, unknown>) => {
        const [Loaded, setLoaded] = React.useState<React.ComponentType<Record<string, unknown>> | null>(null)
        React.useEffect(() => {
          let cancelled = false
          loaderPromise.then((mod) => {
            if (!cancelled) setLoaded(() => mod.default)
          })
          return () => {
            cancelled = true
          }
        }, [])
        return Loaded ? React.createElement(Loaded, props) : null
      }
      return DynamicStub
    },
  }
})

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

function chatState(partial: Partial<{ isOpen: boolean; isMinimized: boolean }>) {
  return { isOpen: false, isMinimized: false, ...partial }
}

describe('AitorAuthGate', () => {
  beforeEach(() => {
    useOptionalAuthMock.mockReset()
    useAllotmentMock.mockReset()
    useAitorChatMock.mockReset()
    useAitorChatMock.mockReturnValue(chatState({}))
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

  it('renders only the launcher button when opted in and chat is closed', () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(true))
    useAitorChatMock.mockReturnValue(chatState({ isOpen: false, isMinimized: false }))

    const { getByTestId, queryByTestId } = render(<AitorAuthGate />)
    expect(getByTestId('aitor-chat-button')).toBeInTheDocument()
    expect(queryByTestId('aitor-chat-modal')).not.toBeInTheDocument()
  })

  it('mounts the modal when the chat is open', async () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(true))
    useAitorChatMock.mockReturnValue(chatState({ isOpen: true }))

    const { findByTestId, getByTestId } = render(<AitorAuthGate />)
    expect(getByTestId('aitor-chat-button')).toBeInTheDocument()
    expect(await findByTestId('aitor-chat-modal')).toBeInTheDocument()
  })

  it('keeps the modal mounted while minimized', async () => {
    useOptionalAuthMock.mockReturnValue({ isSignedIn: true })
    useAllotmentMock.mockReturnValue(dataWith(true))
    useAitorChatMock.mockReturnValue(chatState({ isOpen: true, isMinimized: true }))

    const { findByTestId } = render(<AitorAuthGate />)
    expect(await findByTestId('aitor-chat-modal')).toBeInTheDocument()
  })
})
