'use client'

import { useEffect, useState, useRef } from 'react'
import { HelpCircle } from 'lucide-react'
import { useTour } from '@/hooks/useTour'
import { TourId, getTourDefinition } from '@/lib/tours/tour-definitions'

interface PageTourProps {
  /** The tour ID to use for this page */
  tourId: TourId
  /** Whether to auto-start the tour on first visit */
  autoStart?: boolean
  /** Delay before auto-starting (ms) - default 1000 */
  autoStartDelay?: number
  /** Whether to show the "Take a tour" button */
  showButton?: boolean
  /** Additional class name for the button */
  buttonClassName?: string
}

/**
 * PageTour - Component to trigger guided tours on a page
 *
 * Place this component on any page that has a defined tour.
 * It handles auto-starting on first visit and provides a manual trigger button.
 * Tours auto-start only on the first 3 visits to a page.
 *
 * @example
 * ```tsx
 * // In a page component
 * <PageTour tourId="allotment" autoStart showButton />
 * ```
 */
export default function PageTour({
  tourId,
  autoStart = true,
  autoStartDelay = 1000,
  showButton = true,
  buttonClassName = '',
}: PageTourProps) {
  const { startTour, shouldAutoStart, isCompleted, isActive, incrementPageVisit } = useTour()
  const [hasCheckedAutoStart, setHasCheckedAutoStart] = useState(false)
  const hasIncrementedVisit = useRef(false)

  const definition = getTourDefinition(tourId)

  // Increment page visit count on mount (once per page load)
  useEffect(() => {
    if (!definition || hasIncrementedVisit.current) return
    hasIncrementedVisit.current = true
    incrementPageVisit(tourId)
  }, [definition, tourId, incrementPageVisit])

  // Auto-start tour on first visit (after component mounts and delay)
  useEffect(() => {
    if (!autoStart || hasCheckedAutoStart || !definition) return

    const timer = setTimeout(() => {
      if (shouldAutoStart(tourId)) {
        startTour(tourId)
      }
      setHasCheckedAutoStart(true)
    }, autoStartDelay)

    return () => clearTimeout(timer)
  }, [autoStart, hasCheckedAutoStart, tourId, shouldAutoStart, startTour, definition, autoStartDelay])

  // Don't render if no definition or if tour is active
  if (!definition || isActive) return null

  // Don't render button if not requested
  if (!showButton) return null

  const completed = isCompleted(tourId)

  return (
    <button
      onClick={() => startTour(tourId)}
      className={`inline-flex items-center gap-1.5 text-xs text-zen-stone-500 hover:text-zen-moss-600 transition-colors ${buttonClassName}`}
      title={completed ? 'Replay tour' : 'Take a tour of this page'}
      aria-label={completed ? `Replay ${definition.name} tour` : `Start ${definition.name} tour`}
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">{completed ? 'Replay tour' : 'Take a tour'}</span>
    </button>
  )
}
