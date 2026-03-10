/**
 * Unit tests for the /plants page
 *
 * Tests difficulty filter, my-plants checkbox, and planted badges.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

// Mock PageTour (it requires tour context)
vi.mock('@/components/onboarding/PageTour', () => ({
  default: () => null,
}))

// Mock useAllotment with controllable return value
const mockUseAllotment = vi.fn()
vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: () => mockUseAllotment(),
}))

import PlantsPage from '@/app/plants/page'
import type { AllotmentData, SeasonRecord } from '@/types/unified-allotment'

function makeAllotmentData(overrides: {
  currentYear?: number
  seasons?: SeasonRecord[]
} = {}): Partial<AllotmentData> {
  return {
    currentYear: overrides.currentYear ?? 2026,
    seasons: overrides.seasons ?? [],
  }
}

function makeSeason(year: number, plantIds: string[]): SeasonRecord {
  return {
    year,
    status: 'current',
    areas: [
      {
        areaId: 'bed-a',
        plantings: plantIds.map((plantId, i) => ({
          id: `p-${i}`,
          plantId,
        })),
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as SeasonRecord
}

function setupMock(data: Partial<AllotmentData> | null = null) {
  mockUseAllotment.mockReturnValue({
    data,
    isLoading: false,
    error: null,
  })
}

describe('Plants Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock(makeAllotmentData())
  })

  describe('Difficulty filter', () => {
    it('renders the difficulty dropdown', () => {
      render(<PlantsPage />)
      const select = screen.getByDisplayValue('All levels')
      expect(select).toBeInTheDocument()
    })

    it('filters plants by difficulty when selected', async () => {
      render(<PlantsPage />)
      const user = userEvent.setup()

      // Select "Advanced" difficulty
      const select = screen.getByDisplayValue('All levels')
      await user.selectOptions(select, 'advanced')

      // Cauliflower is advanced
      expect(screen.getByText('Cauliflower')).toBeInTheDocument()

      // Lettuce is beginner, should be hidden
      expect(screen.queryByText('Lettuce')).not.toBeInTheDocument()
    })
  })

  describe('My plants checkbox', () => {
    it('renders the my plants checkbox', () => {
      render(<PlantsPage />)
      expect(screen.getByLabelText(/this year only/i)).toBeInTheDocument()
    })

    it('filters to only planted plants when checked', async () => {
      const data = makeAllotmentData({
        currentYear: 2026,
        seasons: [makeSeason(2026, ['lettuce', 'carrot'])],
      })
      setupMock(data)

      render(<PlantsPage />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText(/this year only/i))

      // Lettuce and carrot are planted
      expect(screen.getByText('Lettuce')).toBeInTheDocument()
      expect(screen.getByText('Carrot')).toBeInTheDocument()

      // Kale is not planted
      expect(screen.queryByText('Kale')).not.toBeInTheDocument()
    })

    it('shows custom empty state when my-plants filter yields no results', async () => {
      setupMock(makeAllotmentData({ currentYear: 2026, seasons: [] }))

      render(<PlantsPage />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText(/this year only/i))

      expect(screen.getByText(/no plants planned for this year/i)).toBeInTheDocument()
    })
  })

  describe('Planted badge', () => {
    it('shows planted badge for plants in current season', () => {
      const data = makeAllotmentData({
        currentYear: 2026,
        seasons: [makeSeason(2026, ['lettuce'])],
      })
      setupMock(data)

      render(<PlantsPage />)

      // Find the lettuce link and check for year badge
      const badge = screen.getByText('2026')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('zen-badge-moss')
    })

    it('does not show planted badge for plants not in current season', () => {
      setupMock(makeAllotmentData({ currentYear: 2026, seasons: [] }))

      render(<PlantsPage />)

      expect(screen.queryByText('2026')).not.toBeInTheDocument()
    })
  })
})
