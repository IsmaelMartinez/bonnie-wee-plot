'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTour } from '@/hooks/useTour'
import { getTourIdForPath } from '@/lib/tours/tour-definitions'

/**
 * TourKeyboardShortcut - Global keyboard shortcut handler for tours
 *
 * Press "?" to start the tour for the current page.
 * This component should be included once in the app layout.
 */
export default function TourKeyboardShortcut() {
  const pathname = usePathname()
  const { startTour, isActive } = useTour()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Don't trigger if a tour is already active
      if (isActive) return

      // "?" key (Shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        const tourId = getTourIdForPath(pathname)
        if (tourId) {
          startTour(tourId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, startTour, isActive])

  return null
}
