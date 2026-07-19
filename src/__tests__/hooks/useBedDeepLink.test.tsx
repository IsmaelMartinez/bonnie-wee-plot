/**
 * useBedDeepLink — /allotment?bed= deep-link selection.
 *
 * The contract under test: the selection fires exactly once per query
 * value. The effect depends on isMobile (to open the sheet on mobile
 * arrival), so without the handled-value guard a viewport resize across
 * the 768px breakpoint would re-run it and clobber whatever the user
 * selected since arriving.
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBedDeepLink } from '@/hooks/allotment/useBedDeepLink'

interface HookProps {
  bedIdFromQuery: string | null
  isLoading: boolean
  isMobile: boolean
}

function setup(initialProps: HookProps) {
  const selectItem = vi.fn()
  const onMobileArrival = vi.fn()
  const { rerender } = renderHook(
    (props: HookProps) =>
      useBedDeepLink({ ...props, selectItem, onMobileArrival }),
    { initialProps }
  )
  return { selectItem, onMobileArrival, rerender }
}

describe('useBedDeepLink', () => {
  it('does not select while data is loading, then fires once loaded', () => {
    const { selectItem, rerender } = setup({
      bedIdFromQuery: 'bed-a',
      isLoading: true,
      isMobile: false,
    })

    expect(selectItem).not.toHaveBeenCalled()

    rerender({ bedIdFromQuery: 'bed-a', isLoading: false, isMobile: false })

    expect(selectItem).toHaveBeenCalledTimes(1)
    expect(selectItem).toHaveBeenCalledWith({ type: 'area', id: 'bed-a' })
  })

  it('does not re-select when a resize crosses the mobile breakpoint', () => {
    const { selectItem, onMobileArrival, rerender } = setup({
      bedIdFromQuery: 'bed-a',
      isLoading: false,
      isMobile: false,
    })

    expect(selectItem).toHaveBeenCalledTimes(1)

    // Simulated resize: desktop -> mobile -> desktop. The user's later
    // selections must survive, so the deep link must not re-fire.
    rerender({ bedIdFromQuery: 'bed-a', isLoading: false, isMobile: true })
    rerender({ bedIdFromQuery: 'bed-a', isLoading: false, isMobile: false })

    expect(selectItem).toHaveBeenCalledTimes(1)
    // The sheet only opens when the arrival itself happens on mobile.
    expect(onMobileArrival).not.toHaveBeenCalled()
  })

  it('opens the mobile sheet when arriving on mobile', () => {
    const { selectItem, onMobileArrival, rerender } = setup({
      bedIdFromQuery: 'bed-a',
      isLoading: false,
      isMobile: true,
    })

    expect(selectItem).toHaveBeenCalledTimes(1)
    expect(onMobileArrival).toHaveBeenCalledTimes(1)

    rerender({ bedIdFromQuery: 'bed-a', isLoading: false, isMobile: false })
    rerender({ bedIdFromQuery: 'bed-a', isLoading: false, isMobile: true })

    expect(onMobileArrival).toHaveBeenCalledTimes(1)
  })

  it('fires again for a new query value', () => {
    const { selectItem, rerender } = setup({
      bedIdFromQuery: 'bed-a',
      isLoading: false,
      isMobile: false,
    })

    rerender({ bedIdFromQuery: 'bed-b', isLoading: false, isMobile: false })

    expect(selectItem).toHaveBeenCalledTimes(2)
    expect(selectItem).toHaveBeenLastCalledWith({ type: 'area', id: 'bed-b' })
  })

  it('does nothing without a query value', () => {
    const { selectItem, rerender } = setup({
      bedIdFromQuery: null,
      isLoading: false,
      isMobile: true,
    })

    rerender({ bedIdFromQuery: null, isLoading: false, isMobile: false })

    expect(selectItem).not.toHaveBeenCalled()
  })
})
