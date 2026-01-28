/**
 * useFeatureFlags Hook
 *
 * React hook for managing progressive feature disclosure.
 * Tracks user engagement and provides feature unlock status.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// ============ HOOK TYPES ============

export interface UseFeatureFlagsState {
  /** Current engagement data */
  engagement: EngagementData
  /** Whether initial load is complete */
  isLoaded: boolean
  /** Current unlock status for all features */
  unlockStatus: FeatureUnlockStatus
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

  return {
    // State
    engagement,
    isLoaded,
    unlockStatus,

    // Actions
    isUnlocked,
    unlock,
    getProgress,
    getAllProgress,
    refresh,
  }
}
