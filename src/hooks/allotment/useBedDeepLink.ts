'use client'

import { useEffect, useRef } from 'react'
import { AllotmentItemRef } from '@/types/garden-planner'

export interface UseBedDeepLinkProps {
  /** The ?bed= query value on /allotment, or null when absent. */
  bedIdFromQuery: string | null
  /** Selection must wait for data so the area lookup can resolve. */
  isLoading: boolean
  isMobile: boolean
  selectItem: (ref: AllotmentItemRef | null) => void
  /** Opens the mobile bottom sheet when the deep link arrives on mobile. */
  onMobileArrival: () => void
}

/**
 * Applies the /allotment?bed= deep link exactly once per query value.
 *
 * The effect's dependencies include isMobile (needed to open the sheet on
 * a mobile arrival), so without the handled-value guard a viewport resize
 * across the breakpoint would re-run it and clobber whatever the user has
 * selected since arriving.
 */
export function useBedDeepLink({
  bedIdFromQuery,
  isLoading,
  isMobile,
  selectItem,
  onMobileArrival,
}: UseBedDeepLinkProps) {
  const handledBedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!bedIdFromQuery) {
      // Query cleared: reset so navigating back to the same deep link
      // fires again.
      handledBedIdRef.current = null
      return
    }
    if (handledBedIdRef.current === bedIdFromQuery) return
    handledBedIdRef.current = bedIdFromQuery

    selectItem({ type: 'area', id: bedIdFromQuery })
    if (isMobile) {
      onMobileArrival()
    }
  }, [bedIdFromQuery, isLoading, isMobile, selectItem, onMobileArrival])
}
