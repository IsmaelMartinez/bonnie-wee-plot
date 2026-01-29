/**
 * Feature Flags and Progressive Disclosure System
 *
 * Manages feature unlocking based on user engagement metrics.
 * Features are progressively revealed as users engage with the app.
 *
 * Unlock conditions:
 * - AI Advisor: 3 visits OR 1 planting
 * - Compost: 5 visits OR first harvest recorded
 * - Allotment Layout: 5 plantings
 */

import { AllotmentData } from '@/types/unified-allotment'
import { trackEvent } from '@/lib/analytics'

// ============ TYPES ============

/**
 * Features that can be unlocked through progressive disclosure
 */
export type UnlockableFeature = 'ai-advisor' | 'compost' | 'allotment-layout'

/**
 * Engagement metrics stored in localStorage
 */
export interface EngagementData {
  visitCount: number
  lastVisit: string // ISO date
  manuallyUnlocked: UnlockableFeature[] // Features unlocked via CTA click
}

/**
 * Current unlock status for all features
 */
export interface FeatureUnlockStatus {
  'ai-advisor': boolean
  'compost': boolean
  'allotment-layout': boolean
}

/**
 * Progress toward unlocking a feature
 */
export interface UnlockProgress {
  feature: UnlockableFeature
  isUnlocked: boolean
  progress: number // 0-100 percentage
  unlockCondition: string // Human-readable condition
  currentValue: number
  targetValue: number
}

// ============ CONSTANTS ============

import { STORAGE_KEY_ENGAGEMENT } from './storage-keys'

/** @deprecated Use STORAGE_KEY_ENGAGEMENT from storage-keys.ts */
export const ENGAGEMENT_STORAGE_KEY = STORAGE_KEY_ENGAGEMENT

/** Unlock thresholds */
export const UNLOCK_THRESHOLDS = {
  'ai-advisor': {
    visits: 3,
    plantings: 1,
  },
  'compost': {
    visits: 5,
    // Also unlocks on first harvest recorded
  },
  'allotment-layout': {
    plantings: 5,
  },
} as const

// ============ ENGAGEMENT TRACKING ============

/**
 * Get default engagement data for new users
 */
function getDefaultEngagementData(): EngagementData {
  return {
    visitCount: 0,
    lastVisit: new Date().toISOString(),
    manuallyUnlocked: [],
  }
}

/**
 * Load engagement data from localStorage
 */
export function loadEngagementData(): EngagementData {
  if (typeof window === 'undefined') {
    return getDefaultEngagementData()
  }

  try {
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY)
    if (!stored) {
      return getDefaultEngagementData()
    }

    const parsed = JSON.parse(stored) as Partial<EngagementData>

    // Merge with defaults to handle missing fields
    return {
      visitCount: typeof parsed.visitCount === 'number' ? parsed.visitCount : 0,
      lastVisit: typeof parsed.lastVisit === 'string' ? parsed.lastVisit : new Date().toISOString(),
      manuallyUnlocked: Array.isArray(parsed.manuallyUnlocked) ? parsed.manuallyUnlocked : [],
    }
  } catch {
    return getDefaultEngagementData()
  }
}

/**
 * Save engagement data to localStorage
 */
export function saveEngagementData(data: EngagementData): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail - engagement tracking is non-critical
  }
}

/**
 * Record a visit and update engagement data
 * Should be called once per session (on app mount)
 */
export function recordVisit(): EngagementData {
  const data = loadEngagementData()
  const today = new Date().toISOString().split('T')[0]
  const lastVisitDate = data.lastVisit.split('T')[0]

  // Only count as new visit if different day
  if (today !== lastVisitDate) {
    data.visitCount += 1
  }

  data.lastVisit = new Date().toISOString()
  saveEngagementData(data)

  return data
}

/**
 * Manually unlock a feature via CTA click
 */
export function manuallyUnlockFeature(feature: UnlockableFeature): EngagementData {
  const data = loadEngagementData()

  if (!data.manuallyUnlocked.includes(feature)) {
    data.manuallyUnlocked.push(feature)
    saveEngagementData(data)
    trackEvent('feature', 'unlock', feature)
  }

  return data
}

// ============ PLANTING AND HARVEST QUERIES ============

/**
 * Count total plantings across all seasons
 */
export function getTotalPlantingCount(allotmentData: AllotmentData | null): number {
  if (!allotmentData) return 0

  let count = 0
  for (const season of allotmentData.seasons) {
    for (const areaSeason of season.areas) {
      count += areaSeason.plantings?.length ?? 0
    }
  }

  return count
}

/**
 * Check if any harvest has been recorded
 */
export function hasRecordedHarvest(allotmentData: AllotmentData | null): boolean {
  if (!allotmentData) return false

  for (const season of allotmentData.seasons) {
    for (const areaSeason of season.areas) {
      // Check planting-level harvests
      for (const planting of areaSeason.plantings ?? []) {
        if (planting.actualHarvestStart || planting.status === 'harvested') {
          return true
        }
      }

      // Check area-level harvest totals
      if (areaSeason.harvestTotal && areaSeason.harvestTotal > 0) {
        return true
      }

      // Check care log harvest entries
      for (const log of areaSeason.careLogs ?? []) {
        if (log.type === 'harvest') {
          return true
        }
      }
    }
  }

  return false
}

// ============ FEATURE UNLOCK LOGIC ============

/**
 * Check if AI Advisor feature should be unlocked
 * Condition: 3 visits OR 1 planting OR manually unlocked
 */
export function isAiAdvisorUnlocked(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): boolean {
  if (engagement.manuallyUnlocked.includes('ai-advisor')) {
    return true
  }

  const { visits, plantings } = UNLOCK_THRESHOLDS['ai-advisor']
  const plantingCount = getTotalPlantingCount(allotmentData)

  return engagement.visitCount >= visits || plantingCount >= plantings
}

/**
 * Check if Compost feature should be unlocked
 * Condition: 5 visits OR first harvest recorded OR manually unlocked
 */
export function isCompostUnlocked(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): boolean {
  if (engagement.manuallyUnlocked.includes('compost')) {
    return true
  }

  const { visits } = UNLOCK_THRESHOLDS['compost']

  return engagement.visitCount >= visits || hasRecordedHarvest(allotmentData)
}

/**
 * Check if Allotment Layout feature should be unlocked
 * Condition: 5 plantings OR manually unlocked
 */
export function isAllotmentLayoutUnlocked(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): boolean {
  if (engagement.manuallyUnlocked.includes('allotment-layout')) {
    return true
  }

  const { plantings } = UNLOCK_THRESHOLDS['allotment-layout']
  const plantingCount = getTotalPlantingCount(allotmentData)

  return plantingCount >= plantings
}

/**
 * Get unlock status for all features
 */
export function getFeatureUnlockStatus(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): FeatureUnlockStatus {
  return {
    'ai-advisor': isAiAdvisorUnlocked(engagement, allotmentData),
    'compost': isCompostUnlocked(engagement, allotmentData),
    'allotment-layout': isAllotmentLayoutUnlocked(engagement, allotmentData),
  }
}

/**
 * Check if a specific feature is unlocked
 */
export function isFeatureUnlocked(
  feature: UnlockableFeature,
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): boolean {
  switch (feature) {
    case 'ai-advisor':
      return isAiAdvisorUnlocked(engagement, allotmentData)
    case 'compost':
      return isCompostUnlocked(engagement, allotmentData)
    case 'allotment-layout':
      return isAllotmentLayoutUnlocked(engagement, allotmentData)
    default:
      return false
  }
}

// ============ PROGRESS TRACKING ============

/**
 * Get unlock progress for AI Advisor
 */
export function getAiAdvisorProgress(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): UnlockProgress {
  const isUnlocked = isAiAdvisorUnlocked(engagement, allotmentData)
  const { visits, plantings } = UNLOCK_THRESHOLDS['ai-advisor']
  const plantingCount = getTotalPlantingCount(allotmentData)

  // Show whichever path is closer to completion
  const visitProgress = (engagement.visitCount / visits) * 100
  const plantingProgress = (plantingCount / plantings) * 100

  if (plantingProgress >= visitProgress) {
    return {
      feature: 'ai-advisor',
      isUnlocked,
      progress: Math.min(100, plantingProgress),
      unlockCondition: 'Add your first planting',
      currentValue: plantingCount,
      targetValue: plantings,
    }
  }

  return {
    feature: 'ai-advisor',
    isUnlocked,
    progress: Math.min(100, visitProgress),
    unlockCondition: `Visit ${visits} times`,
    currentValue: engagement.visitCount,
    targetValue: visits,
  }
}

/**
 * Get unlock progress for Compost
 */
export function getCompostProgress(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): UnlockProgress {
  const isUnlocked = isCompostUnlocked(engagement, allotmentData)
  const { visits } = UNLOCK_THRESHOLDS['compost']
  const hasHarvest = hasRecordedHarvest(allotmentData)

  if (hasHarvest) {
    return {
      feature: 'compost',
      isUnlocked,
      progress: 100,
      unlockCondition: 'Record your first harvest',
      currentValue: 1,
      targetValue: 1,
    }
  }

  return {
    feature: 'compost',
    isUnlocked,
    progress: Math.min(100, (engagement.visitCount / visits) * 100),
    unlockCondition: `Visit ${visits} times`,
    currentValue: engagement.visitCount,
    targetValue: visits,
  }
}

/**
 * Get unlock progress for Allotment Layout
 */
export function getAllotmentLayoutProgress(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): UnlockProgress {
  const isUnlocked = isAllotmentLayoutUnlocked(engagement, allotmentData)
  const { plantings } = UNLOCK_THRESHOLDS['allotment-layout']
  const plantingCount = getTotalPlantingCount(allotmentData)

  return {
    feature: 'allotment-layout',
    isUnlocked,
    progress: Math.min(100, (plantingCount / plantings) * 100),
    unlockCondition: `Add ${plantings} plantings`,
    currentValue: plantingCount,
    targetValue: plantings,
  }
}

/**
 * Get progress for all lockable features
 */
export function getAllUnlockProgress(
  engagement: EngagementData,
  allotmentData: AllotmentData | null
): UnlockProgress[] {
  return [
    getAiAdvisorProgress(engagement, allotmentData),
    getCompostProgress(engagement, allotmentData),
    getAllotmentLayoutProgress(engagement, allotmentData),
  ]
}
