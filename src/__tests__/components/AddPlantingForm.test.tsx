/**
 * Unit tests for AddPlantingForm component
 *
 * Tests plant selection flow, form submission, variety suggestions,
 * sow method selection, date handling, and cancel/add-another behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddPlantingForm from '@/components/allotment/AddPlantingForm'
import { AllotmentData, SeasonRecord, StoredVariety, NewPlanting } from '@/types/unified-allotment'
import type { PlanAdjustment } from '@/lib/season-review/plan-adjustments'

// Mock the shared last-season adjustments hook (Season Observer Phase 4) so
// these tests control the adjustments directly — no weather or season setup.
const { mockUseLastSeasonAdjustments, mockUseAllotment } = vi.hoisted(() => ({
  mockUseLastSeasonAdjustments: vi.fn(),
  mockUseAllotment: vi.fn(),
}))
vi.mock('@/hooks/useLastSeasonAdjustments', () => ({
  useLastSeasonAdjustments: mockUseLastSeasonAdjustments,
}))
// Mock useAllotment so the planning-year gate tests can supply seasons
// without standing up the Yjs storage engine. The form only reads `data`
// and `getAllAreas` from it.
vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: mockUseAllotment,
}))

// Mock the vegetable database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn((id: string) => {
    if (id === 'tomato') {
      return {
        id: 'tomato',
        name: 'Tomato',
        category: 'fruiting-vegetables',
        planting: {
          sowIndoorsMonths: [2, 3, 4],
          sowOutdoorsMonths: [],
          transplantMonths: [5, 6],
          harvestMonths: [7, 8, 9, 10],
          daysToGermination: { min: 5, max: 10 },
          daysToHarvest: { min: 60, max: 85 },
        },
        companions: { good: [], bad: [] },
      }
    }
    if (id === 'lettuce') {
      return {
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          sowIndoorsMonths: [2, 3],
          sowOutdoorsMonths: [3, 4, 5, 6, 7, 8],
          transplantMonths: [4, 5],
          harvestMonths: [5, 6, 7, 8, 9, 10],
          daysToGermination: { min: 3, max: 7 },
          daysToHarvest: { min: 30, max: 60 },
        },
        companions: { good: [], bad: [] },
      }
    }
    return undefined
  }),
}))

// Mock companion utils
vi.mock('@/lib/companion-utils', () => ({
  getCompanionStatusForVegetable: vi.fn(() => ({
    goods: [],
    bads: [],
  })),
}))

// Mock planting utils
vi.mock('@/lib/planting-utils', () => ({
  getRecommendedSowMethod: vi.fn(() => ({
    recommended: 'indoor',
    reason: 'Best started indoors this month',
    alternatives: [],
  })),
}))

// Mock date calculator
vi.mock('@/lib/date-calculator', () => ({
  populateExpectedHarvest: vi.fn((planting: NewPlanting) => planting),
}))

// Mock PlantCombobox to make testing feasible without the full dropdown
vi.mock('@/components/allotment/PlantCombobox', () => ({
  default: ({ value, onChange, required }: {
    value: string
    onChange: (id: string) => void
    required?: boolean
  }) => (
    <div data-testid="plant-combobox-mock">
      <select
        data-testid="plant-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-label="Select plant"
      >
        <option value="">Select a plant...</option>
        <option value="tomato">Tomato</option>
        <option value="lettuce">Lettuce</option>
      </select>
    </div>
  ),
}))

// Mock SowDateValidator
vi.mock('@/components/allotment/SowDateValidator', () => ({
  default: () => <div data-testid="sow-date-validator">Sow-date validator</div>,
}))

describe('AddPlantingForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Default to a settled, adjustment-free previous season; the nudge
    // tests override this per test.
    mockUseLastSeasonAdjustments.mockReturnValue({ settled: true, adjustments: [] })
    mockUseAllotment.mockReturnValue({ data: null, getAllAreas: () => [] })
  })

  describe('Initial state', () => {
    it('renders the plant selection combobox', () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      expect(screen.getByTestId('plant-combobox-mock')).toBeInTheDocument()
    })

    it('disables the Add Planting button when no plant is selected', () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      const submitButton = screen.getByRole('button', { name: /add planting/i })
      expect(submitButton).toBeDisabled()
    })

    it('does not show variety, date, or notes fields before plant selection', () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      expect(screen.queryByLabelText(/variety name/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/timing & dates/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/notes/i)).not.toBeInTheDocument()
    })
  })

  describe('After plant selection', () => {
    it('shows variety, timing, and notes fields after selecting a plant', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getByLabelText(/variety name/i)).toBeInTheDocument()
      expect(screen.getByText(/timing & dates/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('enables the Add Planting button after selecting a plant', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      const submitButton = screen.getByRole('button', { name: /add planting/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('shows "Add & add another" button after selecting a plant', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getByRole('button', { name: /add & add another/i })).toBeInTheDocument()
    })
  })

  describe('Form submission', () => {
    it('submits with plantId and closes form', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByRole('button', { name: /add planting/i }))

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      const submitted = mockOnSubmit.mock.calls[0][0]
      expect(submitted.plantId).toBe('tomato')
      expect(submitted.status).toBe('planned') // no sow date = planned
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('includes variety name in submission', async () => {
      // Provide a matching variety so the effect doesn't clear the input
      const varieties: StoredVariety[] = [
        { id: 'v1', plantId: 'tomato', name: 'San Marzano', seedsByYear: {} },
      ]

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          varieties={varieties}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      // The effect auto-selects the only matching variety
      await waitFor(() => {
        expect(screen.getByLabelText(/variety name/i)).toHaveValue('San Marzano')
      })

      await userEvent.click(screen.getByRole('button', { name: /add planting/i }))

      const submitted = mockOnSubmit.mock.calls[0][0]
      expect(submitted.varietyName).toBe('San Marzano')
    })

    it('includes notes in submission', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.type(screen.getByLabelText(/notes/i), 'Plant near wall')
      await userEvent.click(screen.getByRole('button', { name: /add planting/i }))

      const submitted = mockOnSubmit.mock.calls[0][0]
      expect(submitted.notes).toBe('Plant near wall')
    })

    it('sets status to active when sow date is provided', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      // Expand timing section
      await userEvent.click(screen.getByText(/timing & dates/i))

      // Fill in sow date
      const sowDateInput = screen.getByLabelText(/sow date/i)
      await userEvent.type(sowDateInput, '2026-03-15')

      await userEvent.click(screen.getByRole('button', { name: /add planting/i }))

      const submitted = mockOnSubmit.mock.calls[0][0]
      expect(submitted.status).toBe('active')
      expect(submitted.sowDate).toBe('2026-03-15')
    })
  })

  describe('Timing & Dates section', () => {
    it('expands timing section when clicked', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByText(/timing & dates/i))

      expect(screen.getByLabelText(/how are you starting this plant/i)).toBeInTheDocument()
    })

    it('shows sow method selector with three options', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByText(/timing & dates/i))

      const sowMethodSelect = screen.getByLabelText(/how are you starting this plant/i)
      expect(sowMethodSelect).toBeInTheDocument()

      const options = sowMethodSelect.querySelectorAll('option')
      expect(options).toHaveLength(3)
    })

    it('shows transplant date field only for indoor sowings', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByText(/timing & dates/i))

      // Default mock returns 'indoor' as recommended, which sets the initial method
      await waitFor(() => {
        expect(screen.getByLabelText(/transplant date/i)).toBeInTheDocument()
      })

      // Switch to outdoor
      await userEvent.selectOptions(
        screen.getByLabelText(/how are you starting this plant/i),
        'outdoor'
      )

      expect(screen.queryByLabelText(/transplant date/i)).not.toBeInTheDocument()
    })
  })

  describe('Cancel and Add Another', () => {
    it('calls onCancel when Cancel button is clicked', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('resets form and stays open after "Add & add another"', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByRole('button', { name: /add & add another/i }))

      // Should have submitted
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      // Should NOT have closed (onCancel not called)
      expect(mockOnCancel).not.toHaveBeenCalled()

      // Plant select should be reset
      await waitFor(() => {
        expect(screen.getByTestId('plant-select')).toHaveValue('')
      })
    })

    it('shows success feedback after "Add & add another"', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByRole('button', { name: /add & add another/i }))

      await waitFor(() => {
        expect(screen.getByText(/tomato added!/i)).toBeInTheDocument()
      })
    })

    it('shows "Done" instead of "Cancel" after an add-another action', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')
      await userEvent.click(screen.getByRole('button', { name: /add & add another/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
      })
    })
  })

  describe('Variety suggestions', () => {
    it('renders link to seed library when matching varieties exist', async () => {
      const varieties: StoredVariety[] = [
        {
          id: 'v1',
          plantId: 'tomato',
          name: 'San Marzano',
          seedsByYear: { 2026: 'have' },
        },
        {
          id: 'v2',
          plantId: 'tomato',
          name: 'Gardeners Delight',
          seedsByYear: {},
        },
      ]

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          varieties={varieties}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getByText(/view 2 varieties in seed library/i)).toBeInTheDocument()
    })

    it('shows "Add varieties" link when no matching varieties', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          varieties={[]}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getByText(/add varieties to seed library/i)).toBeInTheDocument()
    })
  })

  describe('Last-season nudges (Season Observer Phase 4)', () => {
    const tomatoAdjustment: PlanAdjustment = {
      id: 'plan:cold-soil-sowing:2025:p1',
      findingId: 'cold-soil-sowing:2025:p1',
      ruleId: 'cold-soil-sowing',
      severity: 'warning',
      observed: 'Tomato went into 6.5°C soil on 20 Mar — below the ~7°C it needs to germinate.',
      action: 'This year wait until the soil holds 7°C before sowing Tomato outdoors, or start it indoors.',
      entities: [{ plantingId: 'p1', plantId: 'tomato', plantName: 'Tomato' }],
    }
    const plotWideAdjustment: PlanAdjustment = {
      id: 'plan:dry-spell:2025:2025-06-10',
      findingId: 'dry-spell:2025:2025-06-10',
      ruleId: 'dry-spell',
      severity: 'notice',
      observed: 'A 23-day dry spell ran 10 Jun–2 Jul with only 3.4mm of rain.',
      action: 'This year mulch beds in spring to hold moisture, and plan a watering routine for June–July.',
      entities: [],
    }

    it("shows last year's lesson for the picked crop, excluding plot-wide adjustments", async () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [tomatoAdjustment, plotWideAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getByText(/last year:/i)).toBeInTheDocument()
      expect(screen.getByText(/went into 6\.5°C soil on 20 Mar/)).toBeInTheDocument()
      expect(screen.getByText(/wait until the soil holds 7°C/)).toBeInTheDocument()
      // Plot-wide dry-spell advice stays on the /allotment panel, never here.
      expect(screen.queryByText(/dry spell/)).not.toBeInTheDocument()
    })

    it('stays silent for a picked crop without a matching adjustment', async () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [tomatoAdjustment, plotWideAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'lettuce')

      expect(screen.queryByText(/last year:/i)).not.toBeInTheDocument()
    })

    it('stays silent when the previous season produced no adjustments', async () => {
      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.queryByText(/last year:/i)).not.toBeInTheDocument()
    })
  })

  describe('Bed-scoped nudges (Season Observer Phase 5)', () => {
    const bedAdjustment: PlanAdjustment = {
      id: 'plan:pest-disease-cluster:2025:bed-b:pest',
      findingId: 'pest-disease-cluster:2025:bed-b:pest',
      ruleId: 'pest-disease-cluster',
      severity: 'notice',
      observed: '4 pest observations were logged in Bed B, starting 5 Jun.',
      action:
        'This year protect Bed B from the start — netting or collars in place before June — and check young plants weekly.',
      entities: [{ areaId: 'bed-b', areaName: 'Bed B' }],
    }
    const tomatoAdjustment: PlanAdjustment = {
      id: 'plan:cold-soil-sowing:2025:p1',
      findingId: 'cold-soil-sowing:2025:p1',
      ruleId: 'cold-soil-sowing',
      severity: 'warning',
      observed: 'Tomato went into 6.5°C soil on 20 Mar — below the ~7°C it needs to germinate.',
      action: 'This year wait until the soil holds 7°C before sowing Tomato outdoors, or start it indoors.',
      entities: [{ plantingId: 'p1', plantId: 'tomato', plantName: 'Tomato', areaId: 'bed-b', areaName: 'Bed B' }],
    }

    it("shows the bed's lesson before any plant is picked", () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [bedAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          areaId="bed-b"
        />
      )

      expect(screen.getByText(/last year in this bed:/i)).toBeInTheDocument()
      expect(screen.getByText(/4 pest observations were logged in Bed B/)).toBeInTheDocument()
    })

    it("keeps showing the bed's lesson whichever plant is picked", async () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [bedAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          areaId="bed-b"
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'lettuce')

      expect(screen.getByText(/last year in this bed:/i)).toBeInTheDocument()
    })

    it('renders a crop-and-bed adjustment once, as a crop nudge only', async () => {
      // The tomato adjustment carries both plantId and areaId; the bed
      // cluster carries only the bed. Picking tomato must show each note
      // exactly once — the crop lesson never duplicates as a bed nudge.
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [bedAdjustment, tomatoAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          areaId="bed-b"
        />
      )

      await userEvent.selectOptions(screen.getByTestId('plant-select'), 'tomato')

      expect(screen.getAllByText(/4 pest observations were logged in Bed B/)).toHaveLength(1)
      expect(screen.getAllByText(/went into 6\.5°C soil on 20 Mar/)).toHaveLength(1)
      expect(screen.getByText(/last year in this bed:/i)).toBeInTheDocument()
      expect(screen.getByText(/^last year:$/i)).toBeInTheDocument()
    })

    it('stays silent for a bed without a matching adjustment', () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [bedAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
          areaId="bed-a"
        />
      )

      expect(screen.queryByText(/last year in this bed:/i)).not.toBeInTheDocument()
    })

    it('stays silent when no area id is provided', () => {
      mockUseLastSeasonAdjustments.mockReturnValue({
        settled: true,
        adjustments: [bedAdjustment],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={2026}
        />
      )

      expect(screen.queryByText(/last year in this bed:/i)).not.toBeInTheDocument()
    })
  })

  describe('Planning-year gate (Season Observer Phase 5.1)', () => {
    // The gate compares against the real current year, same as the
    // LastSeasonPanel gate on /allotment, so years here are relative.
    const CURRENT_YEAR = new Date().getFullYear()

    function season(year: number): SeasonRecord {
      return {
        year,
        status: 'historical',
        areas: [],
        createdAt: `${year}-01-01T00:00:00.000Z`,
        updatedAt: `${year}-12-01T00:00:00.000Z`,
      }
    }

    function dataWithSeasons(years: number[]): AllotmentData {
      return {
        version: 19,
        meta: {
          name: 'Test Allotment',
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
        layout: { areas: [] },
        seasons: years.map(season),
        currentYear: CURRENT_YEAR,
        varieties: [],
      } as unknown as AllotmentData
    }

    const bedAdjustment: PlanAdjustment = {
      id: 'plan:pest-disease-cluster:prev:bed-b:pest',
      findingId: 'pest-disease-cluster:prev:bed-b:pest',
      ruleId: 'pest-disease-cluster',
      severity: 'notice',
      observed: '4 pest observations were logged in Bed B, starting 5 Jun.',
      action: 'This year protect Bed B from the start.',
      entities: [{ areaId: 'bed-b', areaName: 'Bed B' }],
    }

    beforeEach(() => {
      // Behave like the real hook: a null season record settles to silence,
      // so the gate's effect shows through to the rendered nudges.
      mockUseLastSeasonAdjustments.mockImplementation(
        ({ seasonRecord }: { seasonRecord: SeasonRecord | null }) => ({
          settled: true,
          adjustments: seasonRecord ? [bedAdjustment] : [],
        })
      )
    })

    it('passes the previous season record when planning the current year', () => {
      mockUseAllotment.mockReturnValue({
        data: dataWithSeasons([CURRENT_YEAR - 1, CURRENT_YEAR]),
        getAllAreas: () => [],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={CURRENT_YEAR}
          areaId="bed-b"
        />
      )

      expect(mockUseLastSeasonAdjustments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          planYear: CURRENT_YEAR,
          seasonRecord: expect.objectContaining({ year: CURRENT_YEAR - 1 }),
        })
      )
      expect(screen.getByText(/last year in this bed:/i)).toBeInTheDocument()
    })

    it('passes the previous season record when planning next year', () => {
      mockUseAllotment.mockReturnValue({
        data: dataWithSeasons([CURRENT_YEAR, CURRENT_YEAR + 1]),
        getAllAreas: () => [],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={CURRENT_YEAR + 1}
          areaId="bed-b"
        />
      )

      expect(mockUseLastSeasonAdjustments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          planYear: CURRENT_YEAR + 1,
          seasonRecord: expect.objectContaining({ year: CURRENT_YEAR }),
        })
      )
      expect(screen.getByText(/last year in this bed:/i)).toBeInTheDocument()
    })

    it('passes no season record when back-filling a historical year, even though that season exists', () => {
      // Planning CURRENT_YEAR - 2 with CURRENT_YEAR - 3 on record: without
      // the gate this would surface imperative advice about the older
      // season and could fetch its weather.
      mockUseAllotment.mockReturnValue({
        data: dataWithSeasons([CURRENT_YEAR - 3, CURRENT_YEAR - 2]),
        getAllAreas: () => [],
      })

      render(
        <AddPlantingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          selectedYear={CURRENT_YEAR - 2}
          areaId="bed-b"
        />
      )

      expect(mockUseLastSeasonAdjustments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          planYear: CURRENT_YEAR - 2,
          seasonRecord: null,
        })
      )
      expect(screen.queryByText(/last year in this bed:/i)).not.toBeInTheDocument()
    })
  })
})
