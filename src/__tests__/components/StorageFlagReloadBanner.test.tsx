/**
 * Tests for `StorageFlagReloadBanner` (ADR 027 Step 3, PR-A foundation).
 *
 * Coverage:
 *   - Banner does not render when both tabs agree on the flag value.
 *   - Banner renders when a sibling tab broadcasts a different flag.
 *   - Clicking Reload triggers `window.location.reload`.
 *
 * The component reads `USE_YJS_STORAGE` at runtime; we don't override
 * it here. Instead we open a second `BroadcastChannel` from the test
 * itself and post a *different* value, simulating a sibling tab that
 * loaded under the opposite flag setting. The banner's logic only
 * compares the incoming value against the imported constant, so
 * whichever boolean is the negation of the captured one will trigger
 * the divergence path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import StorageFlagReloadBanner from '@/components/StorageFlagReloadBanner'
import { USE_YJS_STORAGE } from '@/config/release-visibility'

const CHANNEL_NAME = 'bwp-storage-flag'

describe('StorageFlagReloadBanner', () => {
  let originalLocation: Location
  let reloadMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // jsdom's `window.location.reload` cannot be spied on directly
    // (the location object's properties are read-only); shadow the
    // whole location with a writable proxy that delegates everything
    // except `reload` to the real implementation.
    originalLocation = window.location
    reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('does not render when no sibling has disagreed', () => {
    render(<StorageFlagReloadBanner />)
    // The banner is only shown after a divergence message arrives.
    expect(screen.queryByText(/Storage engine changed/i)).not.toBeInTheDocument()
  })

  it('renders when a sibling broadcasts a different flag value', async () => {
    render(<StorageFlagReloadBanner />)

    // Open a second BroadcastChannel and post the *opposite* value.
    const sibling = new BroadcastChannel(CHANNEL_NAME)
    await act(async () => {
      sibling.postMessage({ flag: !USE_YJS_STORAGE })
      // Give the browser one microtask to deliver the message to all
      // BroadcastChannel subscribers in this tab.
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByText(/Storage engine changed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()

    sibling.close()
  })

  it('clicking Reload calls window.location.reload', async () => {
    render(<StorageFlagReloadBanner />)

    const sibling = new BroadcastChannel(CHANNEL_NAME)
    await act(async () => {
      sibling.postMessage({ flag: !USE_YJS_STORAGE })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const button = screen.getByRole('button', { name: /reload/i })
    button.click()

    expect(reloadMock).toHaveBeenCalledTimes(1)

    sibling.close()
  })

  it('does not render when a sibling broadcasts the same flag value', async () => {
    render(<StorageFlagReloadBanner />)

    const sibling = new BroadcastChannel(CHANNEL_NAME)
    await act(async () => {
      sibling.postMessage({ flag: USE_YJS_STORAGE })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.queryByText(/Storage engine changed/i)).not.toBeInTheDocument()

    sibling.close()
  })
})
