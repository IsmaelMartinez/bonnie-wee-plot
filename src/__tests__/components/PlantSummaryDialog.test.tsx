import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlantSummaryDialog from '@/components/plants/PlantSummaryDialog'
import type { Vegetable } from '@/types/garden-planner'

const mockLettuce: Vegetable = {
  id: 'lettuce',
  name: 'Lettuce',
  category: 'leafy-greens',
  description: 'A versatile salad green',
  botanicalName: 'Lactuca sativa',
  planting: {
    sowIndoorsMonths: [2, 3],
    sowOutdoorsMonths: [4, 5, 6],
    transplantMonths: [4, 5],
    harvestMonths: [6, 7, 8, 9],
    daysToHarvest: { min: 30, max: 60 },
  },
  care: {
    sun: 'partial-shade',
    water: 'moderate',
    spacing: { between: 25, rows: 30 },
    depth: 1,
    difficulty: 'beginner',
    tips: ['Keep well watered'],
  },
  enhancedCompanions: [],
  enhancedAvoid: [],
}

vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: (id: string) => {
    if (id === 'lettuce') return mockLettuce
    return undefined
  },
}))

// Mock MonthBar to simplify assertions
vi.mock('@/components/plants/MonthBar', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid={`month-bar-${label}`}>{label}</div>
  ),
}))

describe('PlantSummaryDialog', () => {
  const onClose = vi.fn()

  it('renders plant name and key facts when open', () => {
    render(<PlantSummaryDialog plantId="lettuce" isOpen={true} onClose={onClose} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lettuce' })).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('Lactuca sativa')).toBeInTheDocument()
    expect(screen.getByText('Partial Shade')).toBeInTheDocument()
    expect(screen.getByText('25cm')).toBeInTheDocument()
    expect(screen.getByText('1cm')).toBeInTheDocument()
    expect(screen.getByText(/30.60 days to harvest/)).toBeInTheDocument()
  })

  it('renders nothing when plantId is null', () => {
    const { container } = render(
      <PlantSummaryDialog plantId={null} isOpen={true} onClose={onClose} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when plantId does not exist in database', () => {
    const { container } = render(
      <PlantSummaryDialog plantId="nonexistent" isOpen={true} onClose={onClose} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('includes link to full detail page with correct href', () => {
    render(<PlantSummaryDialog plantId="lettuce" isOpen={true} onClose={onClose} />)

    const link = screen.getByRole('link', { name: /view full details/i })
    expect(link).toHaveAttribute('href', '/plants/lettuce')
  })
})
