import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import OfflineIndicator from '@/components/ui/OfflineIndicator'

describe('OfflineIndicator', () => {
  const originalNavigator = window.navigator

  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />)
    expect(container.innerHTML).toBe('')
  })

  it('shows offline banner when offline', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    })

    render(<OfflineIndicator />)
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
    expect(screen.getByText(/data is saved locally/i)).toBeInTheDocument()
  })

  it('shows offline banner when going offline', () => {
    render(<OfflineIndicator />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
  })

  it('shows "back online" message after reconnecting', () => {
    render(<OfflineIndicator />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.getByText(/back online/i)).toBeInTheDocument()
    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument()
  })

  it('hides "back online" message after 3 seconds', () => {
    render(<OfflineIndicator />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.getByText(/back online/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.queryByText(/back online/i)).not.toBeInTheDocument()
  })
})
