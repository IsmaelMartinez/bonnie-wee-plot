/**
 * ItemDetailSwitcher — kind → detail-panel routing.
 *
 * The contract under test: routing agrees with isBedLikeKind, so an
 * 'other' area renders BedDetailPanel (matching the grid/selectItem bed
 * routing that already enables the Add Planting flow for it) instead of
 * silently falling back to the empty state, while unresolvable ids
 * (unknown or archived — getArea filters archived areas) still show the
 * empty state.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ItemDetailSwitcher from '@/components/allotment/details/ItemDetailSwitcher'
import type { Area, AreaKind } from '@/types/unified-allotment'

function area(id: string, kind: AreaKind, isArchived = false): Area {
  return {
    id,
    kind,
    name: `Name of ${id}`,
    canHavePlantings: kind !== 'infrastructure',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...(isArchived ? { isArchived } : {}),
  }
}

const AREAS: Area[] = [
  area('bed-a', 'rotation-bed'),
  area('flower-patch', 'other'),
  area('apple-tree', 'tree'),
  area('old-bed', 'rotation-bed', true),
]

function renderSwitcher(selectedId: string | null) {
  // Mirrors production: getArea resolves via getAreaById, which filters
  // archived areas.
  const getArea = (id: string) =>
    AREAS.find(a => a.id === id && !a.isArchived)

  return render(
    <ItemDetailSwitcher
      selectedItemRef={selectedId ? { type: 'bed', id: selectedId } : null}
      getArea={getArea}
      getAreaSeason={() => undefined}
      getPlantings={() => []}
      getAreaNotes={() => []}
      getPreviousYearRotation={() => null}
      getCareLogs={() => []}
      getHarvestTotal={() => null}
      selectedYear={2026}
      varieties={[]}
      onAddPlanting={vi.fn()}
      onAddPlantingToArea={vi.fn()}
      onDeletePlanting={vi.fn()}
      onRemovePlantingFromArea={vi.fn()}
      onUpdatePlanting={vi.fn()}
      onAddNote={vi.fn()}
      onUpdateNote={vi.fn()}
      onRemoveNote={vi.fn()}
      onUpdateRotation={vi.fn()}
      onAutoRotate={vi.fn()}
      onArchiveArea={vi.fn()}
      onUpdateArea={vi.fn()}
      onAddCareLog={vi.fn()}
      onRemoveCareLog={vi.fn()}
      onLogHarvest={vi.fn()}
      quickStats={{ rotationBeds: 1, perennialBeds: 0, permanentPlantings: 1 }}
    />
  )
}

describe('ItemDetailSwitcher routing', () => {
  it("renders the bed panel for an 'other' area", () => {
    renderSwitcher('flower-patch')

    expect(screen.getByText('Name of flower-patch')).toBeInTheDocument()
    expect(screen.getByText('2026 Plantings')).toBeInTheDocument()
    expect(screen.queryByText('Select an item')).not.toBeInTheDocument()
    // Rotation-specific UI stays hidden and the subtitle degrades to a
    // plain label, not the perennial one.
    expect(screen.queryByLabelText('Rotation Type')).not.toBeInTheDocument()
    expect(screen.queryByText('Perennial')).not.toBeInTheDocument()
    expect(screen.getByText('Area')).toBeInTheDocument()
  })

  it('still renders rotation UI for a rotation bed', () => {
    renderSwitcher('bed-a')

    expect(screen.getByText('Name of bed-a')).toBeInTheDocument()
    expect(screen.getByLabelText('Rotation Type')).toBeInTheDocument()
  })

  it('renders the empty state for an unknown id', () => {
    renderSwitcher('no-such-area')

    expect(screen.getByText('Select an item')).toBeInTheDocument()
  })

  it('renders the empty state for an archived id', () => {
    renderSwitcher('old-bed')

    expect(screen.getByText('Select an item')).toBeInTheDocument()
  })

  it('renders the empty state with no selection', () => {
    renderSwitcher(null)

    expect(screen.getByText('Select an item')).toBeInTheDocument()
  })
})
