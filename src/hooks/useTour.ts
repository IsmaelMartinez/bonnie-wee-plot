'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { driver, type Driver, type Config } from 'driver.js'
import { TourId, getTourDefinition, type SettingsTabStep } from '@/lib/tours/tour-definitions'

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

    // Check if steps need tab switching (settings tour)
    const hasTabSteps = definition.steps.some(
      (step) => (step as SettingsTabStep).settingsTab
    )

    // Switch to the required tab for a step, returns true if a switch happened
    const switchToTab = (stepIndex: number): boolean => {
      const step = definition.steps[stepIndex] as SettingsTabStep
      if (!step?.settingsTab) return false
      const tabButton = document.querySelector(`#tab-${step.settingsTab}`) as HTMLElement | null
      if (tabButton && tabButton.getAttribute('aria-selected') !== 'true') {
        tabButton.click()
        return true
      }
      return false
    }

    // For the initial step, switch tab first so elements exist
    if (hasTabSteps) {
      switchToTab(0)
    }

    // Filter steps whose elements exist (or will exist after tab switch)
    const availableSteps = definition.steps.filter(step => {
      if ((step as SettingsTabStep).settingsTab) return true
      if (typeof step.element === 'string') {
        return document.querySelector(step.element) !== null
      }
      return true
    })

    if (availableSteps.length === 0) {
      console.warn(`No elements found for tour "${tourId}"`)
      return
    }

    // Move to a step with tab switching and delay
    const moveToStep = (targetIndex: number, onComplete?: () => void) => {
      const switched = switchToTab(targetIndex)
      if (switched) {
        // Delay to let React render the new tab content
        setTimeout(() => {
          onComplete?.()
        }, 100)
      } else {
        onComplete?.()
      }
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
        if (!driverRef.current) return
        const currentIndex = driverRef.current.getActiveIndex() ?? 0
        const isLastStep = currentIndex === availableSteps.length - 1

        if (isLastStep) {
          markCompleted(tourId)
          driverRef.current.destroy()
        } else if (hasTabSteps) {
          moveToStep(currentIndex + 1, () => {
            driverRef.current?.moveNext()
          })
        } else {
          driverRef.current.moveNext()
        }
      },
      onPrevClick: () => {
        if (!driverRef.current) return
        if (hasTabSteps) {
          const currentIndex = driverRef.current.getActiveIndex() ?? 0
          if (currentIndex > 0) {
            moveToStep(currentIndex - 1, () => {
              driverRef.current?.movePrevious()
            })
          }
        } else {
          driverRef.current.movePrevious()
        }
      },
    }

    // Small delay to ensure DOM is ready (longer if we switched tabs)
    const initialDelay = hasTabSteps ? 600 : 500
    setTimeout(() => {
      const driverInstance = driver(config)
      driverRef.current = driverInstance

      setIsActive(true)
      driverInstance.drive()
    }, initialDelay)
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
