import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTodayData } from '@/hooks/useTodayData'
import { SEASONAL_PHASES } from '@/lib/seasons'

// Mock useAllotment hook
vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: vi.fn()
}))

// Mock task-generator
vi.mock('@/lib/task-generator', () => ({
  generateTasksForMonth: vi.fn().mockReturnValue([])
}))

import { useAllotment } from '@/hooks/useAllotment'

const mockUseAllotment = useAllotment as ReturnType<typeof vi.fn>

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
      getAllAreas: () => [],
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
      getAllAreas: () => [],
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
      data: { layout: { areas: [] } },
      currentSeason: { areas: [] },
      isLoading: false,
      getTasksForMonth: vi.fn().mockReturnValue(mockTasks),
      getAllAreas: () => [],
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.maintenanceTasks).toEqual(mockTasks)
  })

  it('should return isLoading state from useAllotment', () => {
    mockUseAllotment.mockReturnValue({
      data: null,
      currentSeason: null,
      isLoading: true,
      getTasksForMonth: () => [],
      getAllAreas: () => [],
    })

    const { result } = renderHook(() => useTodayData())

    expect(result.current.isLoading).toBe(true)
  })
})
