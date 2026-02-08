'use client'

import { HelpCircle } from 'lucide-react'
import { useTour } from '@/hooks/useTour'
import { TourId, getTourDefinition } from '@/lib/tours/tour-definitions'

interface PageTourProps {
  /** The tour ID to use for this page */
  tourId: TourId
  /** Whether to show the "Take a tour" button */
  showButton?: boolean
  /** Additional class name for the button */
  buttonClassName?: string
}

/**
 * PageTour - Component to trigger guided tours on a page
 *
 * Place this component on any page that has a defined tour.
 * It provides a manual trigger button for the user to start the tour.
 *
 * @example
 * ```tsx
 * // In a page component
 * <PageTour tourId="allotment" />
 * ```
 */
export default function PageTour({
  tourId,
  showButton = true,
  buttonClassName = '',
}: PageTourProps) {
  const { startTour, isCompleted, isActive } = useTour()

  const definition = getTourDefinition(tourId)

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
