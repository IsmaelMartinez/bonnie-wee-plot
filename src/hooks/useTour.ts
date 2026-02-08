'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { driver, type Driver, type Config } from 'driver.js'
import { TourId, getTourDefinition } from '@/lib/tours/tour-definitions'

const TOUR_STORAGE_KEY = 'bonnie-wee-plot-tours'

interface TourState {
  completed: TourId[]
  dismissed: TourId[]
}

const defaultState: TourState = {
  completed: [],
  dismissed: [],
}

// Singleton state manager for cross-component sync
let tourState: TourState = defaultState
const listeners: Set<() => void> = new Set()

function loadTourState(): TourState {
  if (typeof window === 'undefined') {
    return defaultState
  }
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        completed: parsed.completed || [],
        dismissed: parsed.dismissed || [],
      }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultState
}

function saveTourState(state: TourState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

function setTourState(newState: TourState | ((prev: TourState) => TourState)) {
  const nextState = typeof newState === 'function' ? newState(tourState) : newState
  tourState = nextState
  saveTourState(tourState)
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return tourState
}

function getServerSnapshot() {
  return defaultState
}

// Initialize state from localStorage
if (typeof window !== 'undefined') {
  tourState = loadTourState()

  // Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === TOUR_STORAGE_KEY) {
      tourState = loadTourState()
      listeners.forEach(listener => listener())
    }
  })
}

interface UseTourReturn {
  startTour: (tourId: TourId) => void
  isCompleted: (tourId: TourId) => boolean
  isDismissed: (tourId: TourId) => boolean
  isActive: boolean
  resetAllTours: () => void
  resetTour: (tourId: TourId) => void
}

/**
 * Hook to manage guided tours using driver.js
 * Uses a singleton pattern for cross-component state sync
 */
export function useTour(): UseTourReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isActive, setIsActive] = useState(false)
  const driverRef = useRef<Driver | null>(null)

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
    }, 500)
  }, [markCompleted, markDismissed])

  const isCompleted = useCallback((tourId: TourId): boolean => {
    return state.completed.includes(tourId)
  }, [state.completed])

  const isDismissed = useCallback((tourId: TourId): boolean => {
    return state.dismissed.includes(tourId)
  }, [state.dismissed])

  const resetAllTours = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      completed: [],
      dismissed: [],
    }))
  }, [])

  const resetTour = useCallback((tourId: TourId) => {
    setTourState(prev => ({
      ...prev,
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
  }
}
