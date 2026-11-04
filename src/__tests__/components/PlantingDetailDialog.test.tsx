/**
 * Unit tests for the PlantingDetailDialog Dates tab.
 *
 * The planting card no longer has a "Complete Harvest" button, so the
 * "Harvest Finished" date here is the way to mark a planting as harvested
 * (status is inferred from actualHarvestEnd when the update is applied).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlantingDetailDialog from '@/components/allotment/PlantingDetailDialog'
import { Planting } from '@/types/unified-allotment'

function makePlanting(overrides: Partial<Planting> = {}): Planting {
  return {
    id: 'p1',
    plantId: 'carrot',
    sowDate: '2026-04-01',
    sowMethod: 'outdoor',
    actualHarvestStart: '2026-07-20',
    status: 'active',
    ...overrides,
  }
}

async function openDatesTab(planting: Planting, onUpdate = vi.fn()) {
  render(
    <PlantingDetailDialog
      planting={planting}
      isOpen
      onClose={vi.fn()}
      onUpdate={onUpdate}
      onDelete={vi.fn()}
    />
  )
  await userEvent.setup().click(screen.getByRole('tab', { name: /dates/i }))
  return onUpdate
}

describe('PlantingDetailDialog – Dates tab', () => {
  it('records a harvest end date so the planting can be marked harvested', async () => {
    const onUpdate = await openDatesTab(makePlanting())

    fireEvent.change(screen.getByLabelText('Harvest Finished'), { target: { value: '2026-09-05' } })

    expect(onUpdate).toHaveBeenCalledWith({ actualHarvestEnd: '2026-09-05' })
  })

  it('shows an existing harvest end date and clears it when emptied', async () => {
    const onUpdate = await openDatesTab(makePlanting({ actualHarvestEnd: '2026-09-05', status: 'harvested' }))

    const input = screen.getByLabelText('Harvest Finished') as HTMLInputElement
    expect(input.value).toBe('2026-09-05')

    fireEvent.change(input, { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith({ actualHarvestEnd: undefined })
  })
})
