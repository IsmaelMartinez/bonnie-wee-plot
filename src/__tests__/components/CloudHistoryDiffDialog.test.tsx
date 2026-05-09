import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import CloudHistoryDiffDialog from '@/components/settings/CloudHistoryDiffDialog'

const mockFetchHistorySnapshot = vi.fn()
vi.mock('@/lib/supabase/sync', () => ({
  fetchHistorySnapshot: (...args: unknown[]) => mockFetchHistorySnapshot(...args),
}))

vi.mock('@/services/allotment-storage', () => ({
  loadAllotmentData: () => ({
    success: true,
    data: { version: 22, meta: {}, layout: { areas: [] }, seasons: [], varieties: [] },
  }),
}))

vi.mock('@/components/ui/Dialog', () => ({
  default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="dialog">{children}</div> : null,
}))

const baseSnapshot = {
  version: 21,
  meta: { name: 'Test', updatedAt: '2026-04-01T12:00:00Z' },
  layout: { areas: [{ id: 'a1', name: 'Bed A', kind: 'rotation-bed' }] },
  seasons: [],
  varieties: [{ id: 'v1', name: 'Tomato' }],
} as unknown as Parameters<typeof CloudHistoryDiffDialog>[0]['archivedAt'] extends string
  ? import('@/types/unified-allotment').AllotmentData
  : never

describe('CloudHistoryDiffDialog — load loop regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchHistorySnapshot.mockResolvedValue(baseSnapshot)
  })

  it('runs the diff load exactly once even when onDiffComputed is a new function each render', async () => {
    const computed: Array<unknown> = []
    const getToken = vi.fn().mockResolvedValue('test-token')

    function Harness() {
      // Inline arrow → fresh reference on every parent render. Without the
      // ref-based callback in the dialog, this produced an infinite reload
      // loop ("View changes" stuck on the spinner).
      return (
        <CloudHistoryDiffDialog
          isOpen={true}
          onClose={() => undefined}
          baseId={1}
          newerId={undefined}
          archivedAt="2026-05-09T12:00:00Z"
          getToken={getToken}
          userId="user-123"
          onDiffComputed={(d) => {
            computed.push(d)
          }}
        />
      )
    }

    const { rerender } = render(<Harness />)

    // Wait for the initial load + first diff computation to settle.
    await waitFor(() => {
      expect(computed.length).toBeGreaterThanOrEqual(1)
    })

    // Force several parent rerenders. With the bug, each rerender would
    // trigger a fresh load + onDiffComputed call. With the fix (callback
    // ref + callback removed from effect deps), the load stays at 1.
    for (let i = 0; i < 5; i++) {
      rerender(<Harness />)
      await Promise.resolve()
    }

    // The base snapshot fetch should have happened exactly once.
    expect(mockFetchHistorySnapshot).toHaveBeenCalledTimes(1)
    // And the callback should have fired exactly once.
    expect(computed.length).toBe(1)
  })
})
