'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { driver, type Driver, type Config } from 'driver.js'
import { TourId, getTourDefinition } from '@/lib/tours/tour-definitions'

const TOUR_STORAGE_KEY = 'bonnie-wee-plot-tours'

interface TourState {
  completed: TourId[]
  dismissed: TourId[]
}

function loadTourState(): TourState {
  if (typeof window === 'undefined') {
    return { completed: [], dismissed: [] }
  }
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return { completed: [], dismissed: [] }
}

function saveTourState(state: TourState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

interface UseTourOptions {
  /** Auto-start tour on first visit if not completed */
  autoStart?: boolean
  /** Delay before auto-starting tour (ms) */
  autoStartDelay?: number
}

interface UseTourReturn {
  /** Start a specific tour */
  startTour: (tourId: TourId) => void
  /** Check if a tour has been completed */
  isCompleted: (tourId: TourId) => boolean
  /** Check if a tour has been dismissed (skipped) */
  isDismissed: (tourId: TourId) => boolean
  /** Check if tour is currently active */
  isActive: boolean
  /** Reset all tour progress */
  resetAllTours: () => void
  /** Reset a specific tour */
  resetTour: (tourId: TourId) => void
  /** Check if a tour should auto-start (not completed or dismissed) */
  shouldAutoStart: (tourId: TourId) => boolean
}

/**
 * Hook to manage guided tours using driver.js
 *
 * @example
 * ```tsx
 * const { startTour, isCompleted, shouldAutoStart } = useTour()
 *
 * useEffect(() => {
 *   if (shouldAutoStart('allotment')) {
 *     startTour('allotment')
 *   }
 * }, [shouldAutoStart, startTour])
 * ```
 */
export function useTour(options: UseTourOptions = {}): UseTourReturn {
  const { autoStartDelay = 500 } = options
  const [tourState, setTourState] = useState<TourState>({ completed: [], dismissed: [] })
  const [isActive, setIsActive] = useState(false)
  const driverRef = useRef<Driver | null>(null)

  // Load state on mount
  useEffect(() => {
    setTourState(loadTourState())
  }, [])

  // Persist state changes
  useEffect(() => {
    saveTourState(tourState)
  }, [tourState])

  const markCompleted = useCallback((tourId: TourId) => {
    setTourState(prev => ({
      ...prev,
      completed: prev.completed.includes(tourId)
        ? prev.completed
        : [...prev.completed, tourId],
    }))
  }, [])

  const markDismissed = useCallback((tourId: TourId) => {
    setTourState(prev => ({
      ...prev,
      dismissed: prev.dismissed.includes(tourId)
        ? prev.dismissed
        : [...prev.dismissed, tourId],
    }))
  }, [])

  const startTour = useCallback((tourId: TourId) => {
    const definition = getTourDefinition(tourId)
    if (!definition) {
      console.warn(`Tour "${tourId}" not found`)
      return
    }

    // Clean up any existing tour
    if (driverRef.current) {
      driverRef.current.destroy()
    }

    // Filter steps to only include those with existing elements
    const availableSteps = definition.steps.filter(step => {
      if (typeof step.element === 'string') {
        return document.querySelector(step.element) !== null
      }
      return true
    })

    if (availableSteps.length === 0) {
      console.warn(`No elements found for tour "${tourId}"`)
      return
    }

    const config: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: availableSteps,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'bonnie-tour-popover',
      onDestroyStarted: () => {
        // User clicked X or clicked outside - mark as dismissed
        markDismissed(tourId)
        setIsActive(false)
        driverRef.current?.destroy()
      },
      onDestroyed: () => {
        setIsActive(false)
        driverRef.current = null
      },
      onCloseClick: () => {
        markDismissed(tourId)
        driverRef.current?.destroy()
      },
      onNextClick: () => {
        driverRef.current?.moveNext()
      },
      onPrevClick: () => {
        driverRef.current?.movePrevious()
      },
    }

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const driverInstance = driver(config)
      driverRef.current = driverInstance

      // Track when tour completes (last step)
      const originalMoveNext = driverInstance.moveNext.bind(driverInstance)
      driverInstance.moveNext = () => {
        const currentIndex = driverInstance.getActiveIndex()
        const isLastStep = currentIndex === availableSteps.length - 1

        if (isLastStep) {
          markCompleted(tourId)
          driverInstance.destroy()
        } else {
          originalMoveNext()
        }
      }

      setIsActive(true)
      driverInstance.drive()
    }, autoStartDelay)
  }, [autoStartDelay, markCompleted, markDismissed])

  const isCompleted = useCallback((tourId: TourId): boolean => {
    return tourState.completed.includes(tourId)
  }, [tourState.completed])

  const isDismissed = useCallback((tourId: TourId): boolean => {
    return tourState.dismissed.includes(tourId)
  }, [tourState.dismissed])

  const shouldAutoStart = useCallback((tourId: TourId): boolean => {
    return !tourState.completed.includes(tourId) && !tourState.dismissed.includes(tourId)
  }, [tourState.completed, tourState.dismissed])

  const resetAllTours = useCallback(() => {
    setTourState({ completed: [], dismissed: [] })
  }, [])

  const resetTour = useCallback((tourId: TourId) => {
    setTourState(prev => ({
      completed: prev.completed.filter(id => id !== tourId),
      dismissed: prev.dismissed.filter(id => id !== tourId),
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy()
      }
    }
  }, [])

  return {
    startTour,
    isCompleted,
    isDismissed,
    isActive,
    resetAllTours,
    resetTour,
    shouldAutoStart,
  }
}
