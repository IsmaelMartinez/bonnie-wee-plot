import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTodayData } from '@/hooks/useTodayData'
import { SEASONAL_PHASES } from '@/lib/seasons'

// Mock useAllotment hook
vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: vi.fn()
}))

// Mock vegetable database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn()
}))

import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableById } from '@/lib/vegetable-database'

const mockUseAllotment = useAllotment as ReturnType<typeof vi.fn>
const mockGetVegetableById = getVegetableById as ReturnType<typeof vi.fn>

describe('useTodayData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set a fixed date for consistent tests (July = month 7)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 6, 15)) // July 15, 2025
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return current month based on system date', () => {
    mockUseAllotment.mockReturnValue({
      data: null,
      currentSeason: null,
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.currentMonth).toBe(7) // July
  })

  it('should return correct seasonal phase for current month', () => {
    mockUseAllotment.mockReturnValue({
      data: null,
      currentSeason: null,
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    const { result } = renderHook(() => useTodayData())

    // July is month index 6 (0-indexed)
    expect(result.current.seasonalPhase).toEqual(SEASONAL_PHASES[6])
    expect(result.current.seasonalPhase.name).toBe('Midsummer')
  })

  it('should return maintenance tasks for current month', () => {
    const mockTasks = [
      { id: '1', plantingId: 'apple', type: 'prune' as const, month: 7, description: 'Summer prune' }
    ]

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: { beds: [] },
      isLoading: false,
      getTasksForMonth: vi.fn().mockReturnValue(mockTasks),
      getProblemBeds: () => []
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.maintenanceTasks).toEqual(mockTasks)
  })

  it('should return problem beds', () => {
    const mockProblemBeds = [
      { id: 'C', name: 'Bed C', status: 'problem' as const }
    ]

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: { beds: [] },
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: vi.fn().mockReturnValue(mockProblemBeds)
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.problemBeds).toEqual(mockProblemBeds)
  })

  it('should filter harvestReady plantings based on current month', () => {
    const mockPlanting = {
      id: 'planting-1',
      vegetableId: 'peas',
      varietyName: 'Kelvedon Wonder'
    }

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: {
        year: 2025,
        beds: [
          { bedId: 'A', rotationGroup: 'legumes', plantings: [mockPlanting] }
        ]
      },
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    mockGetVegetableById.mockReturnValue({
      id: 'peas',
      name: 'Peas',
      planting: {
        harvestMonths: [6, 7, 8], // June, July, August
        sowIndoorsMonths: [3, 4],
        sowOutdoorsMonths: [4, 5],
        transplantMonths: [5, 6]
      }
    })

    const { result } = renderHook(() => useTodayData())

    // July (7) is in harvestMonths
    expect(result.current.harvestReady).toHaveLength(1)
    expect(result.current.harvestReady[0].id).toBe('planting-1')
  })

  it('should filter needsAttention plantings based on sowing/planting window', () => {
    const mockPlanting = {
      id: 'planting-2',
      vegetableId: 'kale',
      varietyName: 'Dwarf Green'
    }

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: {
        year: 2025,
        beds: [
          { bedId: 'B1', rotationGroup: 'brassicas', plantings: [mockPlanting] }
        ]
      },
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    mockGetVegetableById.mockReturnValue({
      id: 'kale',
      name: 'Kale',
      planting: {
        harvestMonths: [9, 10, 11, 12],
        sowIndoorsMonths: [4, 5],
        sowOutdoorsMonths: [5, 6, 7], // July included
        transplantMonths: [6, 7, 8]
      }
    })

    const { result } = renderHook(() => useTodayData())

    // July (7) is in sowOutdoorsMonths and transplantMonths
    expect(result.current.needsAttention).toHaveLength(1)
    expect(result.current.needsAttention[0].id).toBe('planting-2')
  })

  it('should return empty arrays when no plantings match current month', () => {
    const mockPlanting = {
      id: 'planting-3',
      vegetableId: 'garlic'
    }

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: {
        year: 2025,
        beds: [
          { bedId: 'B2', rotationGroup: 'alliums', plantings: [mockPlanting] }
        ]
      },
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    mockGetVegetableById.mockReturnValue({
      id: 'garlic',
      name: 'Garlic',
      planting: {
        harvestMonths: [7, 8], // July, August - harvest
        sowIndoorsMonths: [],
        sowOutdoorsMonths: [10, 11, 2, 3], // Autumn/winter sowing
        transplantMonths: []
      }
    })

    const { result } = renderHook(() => useTodayData())

    // July is in harvest but not in sow months
    expect(result.current.harvestReady).toHaveLength(1)
    expect(result.current.needsAttention).toHaveLength(0)
  })

  it('should return isLoading state from useAllotment', () => {
    mockUseAllotment.mockReturnValue({
      data: null,
      currentSeason: null,
      isLoading: true,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle missing vegetable data gracefully', () => {
    const mockPlanting = {
      id: 'planting-unknown',
      vegetableId: 'unknown-veg'
    }

    mockUseAllotment.mockReturnValue({
      data: { layout: { beds: [] } },
      currentSeason: {
        year: 2025,
        beds: [
          { bedId: 'A', rotationGroup: 'legumes', plantings: [mockPlanting] }
        ]
      },
      isLoading: false,
      getTasksForMonth: () => [],
      getProblemBeds: () => []
    })

    mockGetVegetableById.mockReturnValue(undefined) // Vegetable not found

    const { result } = renderHook(() => useTodayData())

    // Should not include plantings with unknown vegetables
    expect(result.current.harvestReady).toHaveLength(0)
    expect(result.current.needsAttention).toHaveLength(0)
  })
})
