/**
 * useFeatureFlags Hook
 *
 * React hook for managing progressive feature disclosure.
 * Tracks user engagement and provides feature unlock status.
 * Detects newly unlocked features for celebration modals.
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  EngagementData,
  FeatureUnlockStatus,
  UnlockableFeature,
  UnlockProgress,
  loadEngagementData,
  recordVisit,
  manuallyUnlockFeature,
  getFeatureUnlockStatus,
  isFeatureUnlocked,
  getAllUnlockProgress,
  getAiAdvisorProgress,
  getCompostProgress,
  getAllotmentLayoutProgress,
} from '@/lib/feature-flags'
import { AllotmentData } from '@/types/unified-allotment'

// ============ CELEBRATION TRACKING ============

const CELEBRATION_STORAGE_KEY = 'allotment-celebrations-shown'

/**
 * Load which celebrations have already been shown
 */
function loadCelebrationsShown(): UnlockableFeature[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CELEBRATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Mark a celebration as shown
 */
function markCelebrationShown(feature: UnlockableFeature): void {
  if (typeof window === 'undefined') return
  try {
    const shown = loadCelebrationsShown()
    if (!shown.includes(feature)) {
      shown.push(feature)
      localStorage.setItem(CELEBRATION_STORAGE_KEY, JSON.stringify(shown))
    }
  } catch {
    // Silently fail - celebration tracking is non-critical
  }
}

// ============ HOOK TYPES ============

export interface UseFeatureFlagsState {
  /** Current engagement data */
  engagement: EngagementData
  /** Whether initial load is complete */
  isLoaded: boolean
  /** Current unlock status for all features */
  unlockStatus: FeatureUnlockStatus
  /** Feature that was just unlocked and needs celebration (null if none) */
  newlyUnlockedFeature: UnlockableFeature | null
}

export interface UseFeatureFlagsActions {
  /** Check if a specific feature is unlocked */
  isUnlocked: (feature: UnlockableFeature) => boolean
  /** Manually unlock a feature (via CTA click) */
  unlock: (feature: UnlockableFeature) => void
  /** Get progress toward unlocking a feature */
  getProgress: (feature: UnlockableFeature) => UnlockProgress
  /** Get progress for all features */
  getAllProgress: () => UnlockProgress[]
  /** Refresh engagement data from storage */
  refresh: () => void
  /** Dismiss the celebration for the newly unlocked feature */
  dismissCelebration: () => void
}

export type UseFeatureFlagsReturn = UseFeatureFlagsState & UseFeatureFlagsActions

// ============ HOOK IMPLEMENTATION ============

/**
 * Hook for managing feature flags and progressive disclosure
 *
 * @param allotmentData - Current allotment data for computing planting/harvest metrics
 */
export function useFeatureFlags(allotmentData: AllotmentData | null): UseFeatureFlagsReturn {
  const [engagement, setEngagement] = useState<EngagementData>(() => ({
    visitCount: 0,
    lastVisit: new Date().toISOString(),
    manuallyUnlocked: [],
  }))
  const [isLoaded, setIsLoaded] = useState(false)
  const [newlyUnlockedFeature, setNewlyUnlockedFeature] = useState<UnlockableFeature | null>(null)

  // Track previous unlock status to detect changes
  const prevUnlockStatusRef = useRef<FeatureUnlockStatus | null>(null)

  // Load engagement data and record visit on mount
  useEffect(() => {
    const data = recordVisit()
    setEngagement(data)
    setIsLoaded(true)
  }, [])

  // Compute unlock status from engagement and allotment data
  const unlockStatus = useMemo(() => {
    return getFeatureUnlockStatus(engagement, allotmentData)
  }, [engagement, allotmentData])

  // Detect newly unlocked features and trigger celebration
  useEffect(() => {
    if (!isLoaded) return

    const prev = prevUnlockStatusRef.current
    const celebrationsShown = loadCelebrationsShown()

    // Check each feature for new unlock
    const features: UnlockableFeature[] = ['ai-advisor', 'compost', 'allotment-layout']

    for (const feature of features) {
      const wasLocked = prev === null ? true : !prev[feature]
      const isNowUnlocked = unlockStatus[feature]
      const celebrationNotShown = !celebrationsShown.includes(feature)

      if (wasLocked && isNowUnlocked && celebrationNotShown) {
        // Feature just became unlocked and celebration hasn't been shown
        setNewlyUnlockedFeature(feature)
        break // Only show one celebration at a time
      }
    }

    // Update the ref for next comparison
    prevUnlockStatusRef.current = unlockStatus
  }, [unlockStatus, isLoaded])

  // Check if a specific feature is unlocked
  const isUnlocked = useCallback(
    (feature: UnlockableFeature): boolean => {
      return isFeatureUnlocked(feature, engagement, allotmentData)
    },
    [engagement, allotmentData]
  )

  // Manually unlock a feature
  const unlock = useCallback((feature: UnlockableFeature): void => {
    const updated = manuallyUnlockFeature(feature)
    setEngagement(updated)
  }, [])

  // Get progress toward unlocking a feature
  const getProgress = useCallback(
    (feature: UnlockableFeature): UnlockProgress => {
      switch (feature) {
        case 'ai-advisor':
          return getAiAdvisorProgress(engagement, allotmentData)
        case 'compost':
          return getCompostProgress(engagement, allotmentData)
        case 'allotment-layout':
          return getAllotmentLayoutProgress(engagement, allotmentData)
        default:
          // Fallback for exhaustive checking
          return {
            feature,
            isUnlocked: false,
            progress: 0,
            unlockCondition: 'Unknown',
            currentValue: 0,
            targetValue: 1,
          }
      }
    },
    [engagement, allotmentData]
  )

  // Get progress for all features
  const getAllProgress = useCallback((): UnlockProgress[] => {
    return getAllUnlockProgress(engagement, allotmentData)
  }, [engagement, allotmentData])

  // Refresh engagement data from storage
  const refresh = useCallback((): void => {
    const data = loadEngagementData()
    setEngagement(data)
  }, [])

  // Dismiss celebration and mark as shown
  const dismissCelebration = useCallback((): void => {
    if (newlyUnlockedFeature) {
      markCelebrationShown(newlyUnlockedFeature)
      setNewlyUnlockedFeature(null)
    }
  }, [newlyUnlockedFeature])

  return {
    // State
    engagement,
    isLoaded,
    unlockStatus,
    newlyUnlockedFeature,

    // Actions
    isUnlocked,
    unlock,
    getProgress,
    getAllProgress,
    refresh,
    dismissCelebration,
  }
}
