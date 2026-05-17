/**
 * Unit tests for PlantingCard component.
 *
 * Covers the plant-name-as-button affordance: when `onPlantInfo` is provided
 * and the planting maps to a known vegetable, the plant name renders as a
 * button that opens the plant info dialog without triggering the card's
 * own `onClick` (planting detail dialog).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlantingCard from '@/components/allotment/PlantingCard'
import type { Planting } from '@/types/unified-allotment'
import type { Vegetable } from '@/types/garden-planner'

const mockTomato: Vegetable = {
  id: 'tomato',
  name: 'Tomato',
  category: 'solanaceae',
  description: 'A juicy fruiting vegetable',
  botanicalName: 'Solanum lycopersicum',
  planting: {
    sowIndoorsMonths: [2, 3, 4],
    sowOutdoorsMonths: [],
    transplantMonths: [5, 6],
    harvestMonths: [7, 8, 9, 10],
    daysToHarvest: { min: 60, max: 85 },
  },
  care: {
    sun: 'full-sun',
    water: 'moderate',
    spacing: { between: 45, rows: 60 },
    depth: 1,
    difficulty: 'intermediate',
    tips: [],
  },
  enhancedCompanions: [],
  enhancedAvoid: [],
}

vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: (id: string) => (id === 'tomato' ? mockTomato : undefined),
}))

vi.mock('@/lib/companion-utils', () => ({
  getCompanionStatusForPlanting: () => ({ goods: [], bads: [] }),
}))

function makePlanting(overrides: Partial<Planting> = {}): Planting {
  return {
    id: 'p1',
    plantId: 'tomato',
    ...overrides,
  }
}

describe('PlantingCard', () => {
  it('renders the plant name as a button when onPlantInfo is provided', () => {
    const onPlantInfo = vi.fn()
    const onUpdate = vi.fn()

    render(
      <PlantingCard
        planting={makePlanting()}
        onUpdate={onUpdate}
        onPlantInfo={onPlantInfo}
      />
    )

    const nameButton = screen.getByRole('button', { name: /info about tomato/i })
    expect(nameButton).toBeInTheDocument()
    expect(nameButton).toHaveTextContent('Tomato')
  })

  it('clicking the plant name calls onPlantInfo and does not bubble to the card onClick', async () => {
    const user = userEvent.setup()
    const onPlantInfo = vi.fn()
    const onClick = vi.fn()
    const onUpdate = vi.fn()

    render(
      <PlantingCard
        planting={makePlanting()}
        onUpdate={onUpdate}
        onPlantInfo={onPlantInfo}
        onClick={onClick}
      />
    )

    await user.click(screen.getByRole('button', { name: /info about tomato/i }))

    expect(onPlantInfo).toHaveBeenCalledTimes(1)
    expect(onPlantInfo).toHaveBeenCalledWith('tomato')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders the plant name as plain text when onPlantInfo is not provided', () => {
    const onUpdate = vi.fn()

    render(<PlantingCard planting={makePlanting()} onUpdate={onUpdate} />)

    expect(
      screen.queryByRole('button', { name: /info about tomato/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Tomato')).toBeInTheDocument()
  })
})
