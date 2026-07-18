/**
 * useAllotmentAreas — unified item selection.
 *
 * The contract under test (Season Observer Phase 5.1): selectItem resolves
 * 'area' refs (produced only by the /allotment?bed= deep link) to the legacy
 * selectedBedId by looking up the area's kind — bed-like kinds set it, so
 * the Add Planting flow gets areaId/existingPlantings and submit works;
 * permanent and infrastructure kinds keep it null, so bed-only UI stays
 * hidden for them exactly as it does for grid clicks.
 */
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAllotmentAreas } from '@/hooks/allotment/useAllotmentAreas'
import type { AllotmentData, Area, AreaKind } from '@/types/unified-allotment'

function area(id: string, kind: AreaKind): Area {
  return {
    id,
    kind,
    name: id,
    canHavePlantings: kind !== 'infrastructure',
    createdAt: '2025-01-01T00:00:00.000Z',
  }
}

function dataWithAreas(areas: Area[]): AllotmentData {
  return {
    version: 19,
    meta: {
      name: 'Test Allotment',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: { areas },
    seasons: [],
    currentYear: 2026,
    varieties: [],
  } as unknown as AllotmentData
}

const ALL_KINDS_DATA = dataWithAreas([
  area('bed-a', 'rotation-bed'),
  area('asparagus-bed', 'perennial-bed'),
  area('flower-patch', 'other'),
  area('apple-tree', 'tree'),
  area('raspberry-row', 'berry'),
  area('herb-spiral', 'herb'),
  area('shed', 'infrastructure'),
])

function renderAreasHook(data: AllotmentData | null = ALL_KINDS_DATA) {
  return renderHook(
    (props: { data: AllotmentData | null }) =>
      useAllotmentAreas({ data: props.data, mutate: vi.fn() }),
    { initialProps: { data } }
  )
}

describe('useAllotmentAreas selection', () => {
  describe("selectItem with 'area' refs (deep-link path)", () => {
    it.each([
      ['rotation-bed', 'bed-a'],
      ['perennial-bed', 'asparagus-bed'],
      ['other', 'flower-patch'],
    ])('sets selectedBedId for a %s area', (_kind, id) => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'area', id }))

      expect(result.current.selectedItemRef).toEqual({ type: 'area', id })
      // selectedBedId set means the Add Planting submit guard passes —
      // the deep-link path can actually add plantings.
      expect(result.current.selectedBedId).toBe(id)
    })

    it.each([
      ['tree', 'apple-tree'],
      ['berry', 'raspberry-row'],
      ['herb', 'herb-spiral'],
      ['infrastructure', 'shed'],
    ])('keeps selectedBedId null for a %s area', (_kind, id) => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'area', id }))

      expect(result.current.selectedItemRef).toEqual({ type: 'area', id })
      expect(result.current.selectedBedId).toBeNull()
    })

    it('stores the canonical area id when the ref uses a shortId', () => {
      // getAreaById resolves shortIds/names too; downstream consumers
      // exact-match selectedBedId against AreaSeason.areaId, so the raw
      // ref id would silently miss (empty plantings, orphaned submit).
      const withShortId = dataWithAreas([
        { ...area('bed-a', 'rotation-bed'), shortId: 'A' },
      ])
      const { result } = renderAreasHook(withShortId)

      act(() => result.current.selectItem({ type: 'area', id: 'A' }))

      expect(result.current.selectedBedId).toBe('bed-a')
    })

    it('keeps selectedBedId null for an unknown area id', () => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'area', id: 'no-such-area' }))

      expect(result.current.selectedBedId).toBeNull()
    })

    it('keeps selectedBedId null when data has not loaded yet', () => {
      const { result } = renderAreasHook(null)

      act(() => result.current.selectItem({ type: 'area', id: 'bed-a' }))

      expect(result.current.selectedBedId).toBeNull()
    })

    it('resolves against the latest data even though selectItem was created earlier', () => {
      const { result, rerender } = renderAreasHook(null)
      const selectItemBeforeData = result.current.selectItem

      rerender({ data: ALL_KINDS_DATA })

      act(() => selectItemBeforeData({ type: 'area', id: 'bed-a' }))

      expect(result.current.selectedBedId).toBe('bed-a')
    })
  })

  describe("selectItem with typed refs (grid click path — unchanged)", () => {
    it("sets selectedBedId for 'bed' refs", () => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'bed', id: 'bed-a' }))

      expect(result.current.selectedBedId).toBe('bed-a')
    })

    it("keeps selectedBedId null for 'permanent' refs", () => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'permanent', id: 'apple-tree' }))

      expect(result.current.selectedBedId).toBeNull()
    })

    it("keeps selectedBedId null for 'infrastructure' refs", () => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'infrastructure', id: 'shed' }))

      expect(result.current.selectedBedId).toBeNull()
    })

    it('clears both selections on null', () => {
      const { result } = renderAreasHook()

      act(() => result.current.selectItem({ type: 'area', id: 'bed-a' }))
      act(() => result.current.selectItem(null))

      expect(result.current.selectedItemRef).toBeNull()
      expect(result.current.selectedBedId).toBeNull()
    })
  })

  it('keeps selectItem referentially stable across data changes', () => {
    // The /allotment deep-link effect depends on selectItem; a data-keyed
    // identity would re-fire it (re-selecting the query bed) on every
    // mutation.
    const { result, rerender } = renderAreasHook()
    const first = result.current.selectItem

    rerender({ data: dataWithAreas([area('bed-a', 'rotation-bed')]) })

    expect(result.current.selectItem).toBe(first)
  })
})
