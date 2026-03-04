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
import { StoredVariety, NewPlanting } from '@/types/unified-allotment'

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

// Mock PlantingTimeline
vi.mock('@/components/allotment/PlantingTimeline', () => ({
  default: () => <div data-testid="planting-timeline">Timeline preview</div>,
}))

describe('AddPlantingForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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
})
