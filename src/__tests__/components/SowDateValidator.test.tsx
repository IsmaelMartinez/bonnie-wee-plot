/**
 * Unit tests for SowDateValidator date display
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SowDateValidator from '@/components/allotment/SowDateValidator'
import { Vegetable } from '@/types/garden-planner'

// Autumn-to-spring sowing window that wraps the year end.
const wrapBerry = {
  id: 'wrap-berry',
  name: 'Wrap Berry',
  category: 'berries',
  planting: {
    sowIndoorsMonths: [],
    sowOutdoorsMonths: [11, 12, 1, 2, 3],
    transplantMonths: [],
    harvestMonths: [6, 7],
    daysToHarvest: { min: 200, max: 240 },
  },
} as unknown as Vegetable

describe('SowDateValidator', () => {
  it('shows the recommended window on the stored calendar days', () => {
    render(<SowDateValidator sowDate="2025-06-15" sowMethod="outdoor" vegetable={wrapBerry} />)

    expect(screen.getByText('Recommended: 1 Nov 2025 - 15 Mar 2026')).toBeInTheDocument()
  })

  it('shows the germination window from the sow date', () => {
    render(<SowDateValidator sowDate="2026-04-01" sowMethod="indoor" vegetable={{ ...wrapBerry, category: 'solanaceae' } as Vegetable} />)

    expect(screen.getByText(/^1 Apr 2026 - /)).toBeInTheDocument()
  })
})
