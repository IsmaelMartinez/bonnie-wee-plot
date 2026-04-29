/**
 * Unit tests for PlantingProgress component (the lifecycle strip rendered
 * inside PlantingDetailDialog).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlantingProgress from '@/components/allotment/PlantingProgress'
import { Planting } from '@/types/unified-allotment'

function makePlanting(overrides: Partial<Planting> = {}): Planting {
  return {
    id: 'p1',
    plantId: 'tomato',
    sowDate: '2026-04-01',
    expectedHarvestStart: '2026-07-01',
    expectedHarvestEnd: '2026-08-15',
    ...overrides,
  }
}

describe('PlantingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the progress strip when sowDate and expectedHarvestStart are present', () => {
    render(<PlantingProgress planting={makePlanting()} />)
    expect(screen.getByRole('region', { name: /planting progress/i })).toBeInTheDocument()
  })

  it('renders nothing when sowDate is missing', () => {
    const { container } = render(<PlantingProgress planting={makePlanting({ sowDate: undefined })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when expectedHarvestStart is missing', () => {
    const { container } = render(
      <PlantingProgress planting={makePlanting({ expectedHarvestStart: undefined })} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the today line when current date is within the range', () => {
    render(<PlantingProgress planting={makePlanting()} />)
    expect(screen.getByLabelText('Today')).toBeInTheDocument()
  })

  it('hides the today line when the range is entirely in the past', () => {
    render(
      <PlantingProgress
        planting={makePlanting({
          sowDate: '2025-01-01',
          expectedHarvestStart: '2025-04-01',
          expectedHarvestEnd: '2025-04-15',
        })}
      />
    )
    expect(screen.queryByLabelText('Today')).not.toBeInTheDocument()
  })

  it('renders the actual harvest overlay when actualHarvestStart is set', () => {
    render(
      <PlantingProgress
        planting={makePlanting({
          actualHarvestStart: '2026-07-10',
          actualHarvestEnd: '2026-07-25',
        })}
      />
    )
    expect(screen.getByLabelText('Actual harvest')).toBeInTheDocument()
  })
})
