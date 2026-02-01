/**
 * Unit tests for feature flags and progressive disclosure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  UNLOCK_THRESHOLDS,
  loadEngagementData,
  saveEngagementData,
  recordVisit,
  manuallyUnlockFeature,
  getTotalPlantingCount,
  hasRecordedHarvest,
  isAiAdvisorUnlocked,
  isCompostUnlocked,
  isAllotmentLayoutUnlocked,
  getFeatureUnlockStatus,
  isFeatureUnlocked,
  getAiAdvisorProgress,
  getCompostProgress,
  getAllotmentLayoutProgress,
  getAllUnlockProgress,
  EngagementData,
} from '@/lib/feature-flags'
import { AllotmentData } from '@/types/unified-allotment'
import { STORAGE_KEY_ENGAGEMENT } from '@/lib/storage-keys'

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
})

// Helper to create mock allotment data
function createMockAllotmentData(options: {
  plantingsCount?: number
  hasHarvest?: boolean
  hasHarvestTotal?: boolean
  hasCareLogHarvest?: boolean
}): AllotmentData {
  const { plantingsCount = 0, hasHarvest = false, hasHarvestTotal = false, hasCareLogHarvest = false } = options

  const plantings = Array.from({ length: plantingsCount }, (_, i) => ({
    id: `planting-${i}`,
    plantId: `plant-${i}`,
    ...(hasHarvest && i === 0 ? { actualHarvestStart: '2026-01-15' } : {}),
  }))

  return {
    version: 16,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    layout: {
      areas: [
        { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        areas: [
          {
            areaId: 'bed-a',
            plantings,
            ...(hasHarvestTotal ? { harvestTotal: 5 } : {}),
            ...(hasCareLogHarvest
              ? { careLogs: [{ id: 'log-1', type: 'harvest' as const, date: '2026-01-15' }] }
              : {}),
          },
        ],
      },
    ],
    varieties: [],
  }
}

describe('Feature Flags', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    vi.clearAllMocks()
  })

  describe('Engagement Data Loading/Saving', () => {
    it('returns default engagement data when no storage exists', () => {
      const data = loadEngagementData()
      expect(data.visitCount).toBe(0)
      expect(data.manuallyUnlocked).toEqual([])
      expect(data.lastVisit).toBeDefined()
    })

    it('loads existing engagement data from localStorage', () => {
      const stored: EngagementData = {
        visitCount: 5,
        lastVisit: '2026-01-01T00:00:00.000Z',
        manuallyUnlocked: ['ai-advisor'],
      }
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, JSON.stringify(stored))

      const data = loadEngagementData()
      expect(data.visitCount).toBe(5)
      expect(data.manuallyUnlocked).toEqual(['ai-advisor'])
    })

    it('handles corrupted localStorage gracefully', () => {
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, 'not valid json')

      const data = loadEngagementData()
      expect(data.visitCount).toBe(0)
      expect(data.manuallyUnlocked).toEqual([])
    })

    it('merges with defaults for partial data', () => {
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, JSON.stringify({ visitCount: 3 }))

      const data = loadEngagementData()
      expect(data.visitCount).toBe(3)
      expect(data.manuallyUnlocked).toEqual([])
    })

    it('saves engagement data to localStorage', () => {
      const data: EngagementData = {
        visitCount: 10,
        lastVisit: '2026-01-15T00:00:00.000Z',
        manuallyUnlocked: ['compost'],
      }

      saveEngagementData(data)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY_ENGAGEMENT,
        JSON.stringify(data)
      )
    })
  })

  describe('recordVisit', () => {
    it('increments visit count on new day', () => {
      // Set up yesterday's visit
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const stored: EngagementData = {
        visitCount: 2,
        lastVisit: yesterday.toISOString(),
        manuallyUnlocked: [],
      }
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, JSON.stringify(stored))

      const data = recordVisit()
      expect(data.visitCount).toBe(3)
    })

    it('does not increment visit count for same day visit', () => {
      // Set up today's visit
      const stored: EngagementData = {
        visitCount: 2,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, JSON.stringify(stored))

      const data = recordVisit()
      expect(data.visitCount).toBe(2)
    })

    it('starts from 0 for new users', () => {
      // Make sure we're calling on a "different day" by using yesterday's date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const stored: EngagementData = {
        visitCount: 0,
        lastVisit: yesterday.toISOString(),
        manuallyUnlocked: [],
      }
      mockLocalStorage.setItem(STORAGE_KEY_ENGAGEMENT, JSON.stringify(stored))

      const data = recordVisit()
      expect(data.visitCount).toBe(1)
    })
  })

  describe('manuallyUnlockFeature', () => {
    it('adds feature to manually unlocked list', () => {
      const data = manuallyUnlockFeature('ai-advisor')
      expect(data.manuallyUnlocked).toContain('ai-advisor')
    })

    it('does not duplicate feature in list', () => {
      manuallyUnlockFeature('ai-advisor')
      const data = manuallyUnlockFeature('ai-advisor')
      expect(data.manuallyUnlocked.filter((f) => f === 'ai-advisor')).toHaveLength(1)
    })

    it('preserves other manually unlocked features', () => {
      manuallyUnlockFeature('ai-advisor')
      const data = manuallyUnlockFeature('compost')
      expect(data.manuallyUnlocked).toContain('ai-advisor')
      expect(data.manuallyUnlocked).toContain('compost')
    })
  })

  describe('getTotalPlantingCount', () => {
    it('returns 0 for null data', () => {
      expect(getTotalPlantingCount(null)).toBe(0)
    })

    it('returns 0 for empty seasons', () => {
      const data = createMockAllotmentData({ plantingsCount: 0 })
      expect(getTotalPlantingCount(data)).toBe(0)
    })

    it('counts plantings across seasons', () => {
      const data = createMockAllotmentData({ plantingsCount: 5 })
      expect(getTotalPlantingCount(data)).toBe(5)
    })
  })

  describe('hasRecordedHarvest', () => {
    it('returns false for null data', () => {
      expect(hasRecordedHarvest(null)).toBe(false)
    })

    it('returns false when no harvest recorded', () => {
      const data = createMockAllotmentData({ plantingsCount: 3 })
      expect(hasRecordedHarvest(data)).toBe(false)
    })

    it('returns true when planting has actualHarvestStart', () => {
      const data = createMockAllotmentData({ plantingsCount: 1, hasHarvest: true })
      expect(hasRecordedHarvest(data)).toBe(true)
    })

    it('returns true when area has harvestTotal', () => {
      const data = createMockAllotmentData({ hasHarvestTotal: true })
      expect(hasRecordedHarvest(data)).toBe(true)
    })

    it('returns true when care log has harvest entry', () => {
      const data = createMockAllotmentData({ hasCareLogHarvest: true })
      expect(hasRecordedHarvest(data)).toBe(true)
    })
  })

  describe('AI Advisor Unlock', () => {
    it('unlocks with manual unlock', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: ['ai-advisor'],
      }
      expect(isAiAdvisorUnlocked(engagement, null)).toBe(true)
    })

    it('unlocks with 3+ visits', () => {
      const engagement: EngagementData = {
        visitCount: 3,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      expect(isAiAdvisorUnlocked(engagement, null)).toBe(true)
    })

    it('unlocks with 1+ planting', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 1 })
      expect(isAiAdvisorUnlocked(engagement, data)).toBe(true)
    })

    it('stays locked with 2 visits and 0 plantings', () => {
      const engagement: EngagementData = {
        visitCount: 2,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      expect(isAiAdvisorUnlocked(engagement, null)).toBe(false)
    })
  })

  describe('Compost Unlock', () => {
    it('unlocks with manual unlock', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: ['compost'],
      }
      expect(isCompostUnlocked(engagement, null)).toBe(true)
    })

    it('unlocks with 5+ visits', () => {
      const engagement: EngagementData = {
        visitCount: 5,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      expect(isCompostUnlocked(engagement, null)).toBe(true)
    })

    it('unlocks with recorded harvest', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ hasHarvest: true, plantingsCount: 1 })
      expect(isCompostUnlocked(engagement, data)).toBe(true)
    })

    it('stays locked with 4 visits and no harvest', () => {
      const engagement: EngagementData = {
        visitCount: 4,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      expect(isCompostUnlocked(engagement, null)).toBe(false)
    })
  })

  describe('Allotment Layout Unlock', () => {
    it('unlocks with manual unlock', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: ['allotment-layout'],
      }
      expect(isAllotmentLayoutUnlocked(engagement, null)).toBe(true)
    })

    it('unlocks with 5+ plantings', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 5 })
      expect(isAllotmentLayoutUnlocked(engagement, data)).toBe(true)
    })

    it('stays locked with 4 plantings', () => {
      const engagement: EngagementData = {
        visitCount: 10,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 4 })
      expect(isAllotmentLayoutUnlocked(engagement, data)).toBe(false)
    })
  })

  describe('getFeatureUnlockStatus', () => {
    it('returns status for all features', () => {
      const engagement: EngagementData = {
        visitCount: 3,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: ['compost'],
      }
      const data = createMockAllotmentData({ plantingsCount: 5 })

      const status = getFeatureUnlockStatus(engagement, data)

      expect(status['ai-advisor']).toBe(true)
      expect(status['compost']).toBe(true)
      expect(status['allotment-layout']).toBe(true)
    })

    it('returns correct locked status', () => {
      const engagement: EngagementData = {
        visitCount: 1,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 0 })

      const status = getFeatureUnlockStatus(engagement, data)

      expect(status['ai-advisor']).toBe(false)
      expect(status['compost']).toBe(false)
      expect(status['allotment-layout']).toBe(false)
    })
  })

  describe('isFeatureUnlocked', () => {
    it('returns correct status for each feature type', () => {
      const engagement: EngagementData = {
        visitCount: 3,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }

      expect(isFeatureUnlocked('ai-advisor', engagement, null)).toBe(true)
      expect(isFeatureUnlocked('compost', engagement, null)).toBe(false)
      expect(isFeatureUnlocked('allotment-layout', engagement, null)).toBe(false)
    })
  })

  describe('Progress Tracking', () => {
    it('returns AI Advisor progress based on plantings when closer', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 1 })

      const progress = getAiAdvisorProgress(engagement, data)

      expect(progress.feature).toBe('ai-advisor')
      expect(progress.isUnlocked).toBe(true)
      expect(progress.progress).toBe(100)
    })

    it('returns AI Advisor progress based on visits when closer', () => {
      const engagement: EngagementData = {
        visitCount: 2,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }

      const progress = getAiAdvisorProgress(engagement, null)

      expect(progress.feature).toBe('ai-advisor')
      expect(progress.isUnlocked).toBe(false)
      expect(progress.progress).toBeCloseTo(66.67, 0)
      expect(progress.unlockCondition).toContain('Visit')
    })

    it('returns Compost progress based on visits', () => {
      const engagement: EngagementData = {
        visitCount: 3,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }

      const progress = getCompostProgress(engagement, null)

      expect(progress.feature).toBe('compost')
      expect(progress.isUnlocked).toBe(false)
      expect(progress.progress).toBe(60)
    })

    it('returns Compost progress 100% when harvest recorded', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ hasHarvest: true, plantingsCount: 1 })

      const progress = getCompostProgress(engagement, data)

      expect(progress.progress).toBe(100)
      expect(progress.isUnlocked).toBe(true)
    })

    it('returns Allotment Layout progress', () => {
      const engagement: EngagementData = {
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 3 })

      const progress = getAllotmentLayoutProgress(engagement, data)

      expect(progress.feature).toBe('allotment-layout')
      expect(progress.isUnlocked).toBe(false)
      expect(progress.progress).toBe(60)
      expect(progress.currentValue).toBe(3)
      expect(progress.targetValue).toBe(5)
    })

    it('getAllUnlockProgress returns progress for all features', () => {
      const engagement: EngagementData = {
        visitCount: 2,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
      }
      const data = createMockAllotmentData({ plantingsCount: 2 })

      const progress = getAllUnlockProgress(engagement, data)

      expect(progress).toHaveLength(3)
      expect(progress.map((p) => p.feature)).toEqual(['ai-advisor', 'compost', 'allotment-layout'])
    })
  })

  describe('Threshold Constants', () => {
    it('has correct AI Advisor thresholds', () => {
      expect(UNLOCK_THRESHOLDS['ai-advisor'].visits).toBe(3)
      expect(UNLOCK_THRESHOLDS['ai-advisor'].plantings).toBe(1)
    })

    it('has correct Compost thresholds', () => {
      expect(UNLOCK_THRESHOLDS['compost'].visits).toBe(5)
    })

    it('has correct Allotment Layout thresholds', () => {
      expect(UNLOCK_THRESHOLDS['allotment-layout'].plantings).toBe(5)
    })
  })
})
