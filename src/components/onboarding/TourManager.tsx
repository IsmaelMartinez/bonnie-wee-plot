'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, CheckCircle, Circle, RotateCcw } from 'lucide-react'
import { useTour } from '@/hooks/useTour'
import { getAllTours, TourId } from '@/lib/tours/tour-definitions'

/**
 * TourManager - Settings component for managing guided tours
 *
 * Shows completion status for each tour and allows users to reset tours.
 */
export default function TourManager() {
  const {
    isCompleted,
    isDismissed,
    resetAllTours,
    resetTour,
    startTour,
    isDisabled,
    setDisabled,
  } = useTour()
  const [mounted, setMounted] = useState(false)
  const tours = getAllTours()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-zen-stone-100 rounded-zen" />
        ))}
      </div>
    )
  }

  const completedCount = tours.filter(t => isCompleted(t.id)).length
  const dismissedCount = tours.filter(t => isDismissed(t.id) && !isCompleted(t.id)).length

  return (
    <div className="space-y-4">
      {/* Disable Toggle */}
      <label className="flex items-center justify-between p-3 bg-zen-stone-50 rounded-zen cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={isDisabled}
              onChange={(e) => setDisabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-zen-stone-300 rounded-full peer-checked:bg-zen-ume-500 transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
          </div>
          <div>
            <div className="font-medium text-zen-ink-700">Disable auto-start tours</div>
            <div className="text-xs text-zen-stone-500">
              Tours won&apos;t start automatically when visiting pages
            </div>
          </div>
        </div>
      </label>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zen-stone-600">
          {completedCount} of {tours.length} tours completed
          {dismissedCount > 0 && ` (${dismissedCount} skipped)`}
        </span>
        {(completedCount > 0 || dismissedCount > 0) && (
          <button
            onClick={resetAllTours}
            className="inline-flex items-center gap-1.5 text-zen-ume-600 hover:text-zen-ume-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all
          </button>
        )}
      </div>

      {/* Tour List */}
      <div className="space-y-2">
        {tours.map(tour => {
          const completed = isCompleted(tour.id)
          const dismissed = isDismissed(tour.id)
          const status = completed ? 'completed' : dismissed ? 'skipped' : 'not started'

          return (
            <div
              key={tour.id}
              className="flex items-center justify-between p-3 bg-zen-stone-50 rounded-zen"
            >
              <div className="flex items-center gap-3">
                {completed ? (
                  <CheckCircle className="w-5 h-5 text-zen-moss-500" />
                ) : dismissed ? (
                  <Circle className="w-5 h-5 text-zen-stone-400" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-zen-water-500" />
                )}
                <div>
                  <div className="font-medium text-zen-ink-700">{tour.name}</div>
                  <div className="text-xs text-zen-stone-500">{tour.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  completed
                    ? 'bg-zen-moss-100 text-zen-moss-700'
                    : dismissed
                    ? 'bg-zen-stone-200 text-zen-stone-600'
                    : 'bg-zen-water-100 text-zen-water-700'
                }`}>
                  {status}
                </span>
                {(completed || dismissed) && (
                  <button
                    onClick={() => resetTour(tour.id)}
                    className="p-1.5 text-zen-stone-400 hover:text-zen-stone-600 hover:bg-zen-stone-200 rounded-zen transition-colors"
                    title={`Reset ${tour.name} tour`}
                    aria-label={`Reset ${tour.name} tour`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => startTour(tour.id as TourId)}
                  className="px-2 py-1 text-xs text-zen-moss-600 hover:text-zen-moss-700 hover:bg-zen-moss-50 rounded-zen transition-colors"
                >
                  {completed || dismissed ? 'Replay' : 'Start'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-zen-stone-500 mt-2">
        Tours help you learn each section of the app. They auto-start on your first 3 visits to each page.
        Press <kbd className="px-1.5 py-0.5 bg-zen-stone-200 rounded text-zen-ink-600 font-mono">?</kbd> on any page to start its tour manually.
      </p>
    </div>
  )
}
