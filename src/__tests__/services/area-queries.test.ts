/**
 * isBedLikeKind — the single area-kind → selection-category predicate.
 *
 * Grid clicks (AllotmentGrid), deep-link selection (useAllotmentAreas),
 * and both detail switchers (ItemDetailSwitcher, MobileAreaBottomSheet)
 * all route through this predicate, so its truth table is the routing
 * contract: bed-like kinds set selectedBedId, render BedDetailPanel, and
 * expose the Add Planting flow.
 */
import { describe, expect, it } from 'vitest'
import {
  isBedLikeKind,
  getAllBeds,
  getBedAreaById,
} from '@/services/allotment-storage'
import type { AllotmentData, Area, AreaKind } from '@/types/unified-allotment'

function area(id: string, kind: AreaKind, isArchived = false): Area {
  return {
    id,
    kind,
    name: id,
    canHavePlantings: kind !== 'infrastructure',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...(isArchived ? { isArchived } : {}),
  }
}

function dataWithAreas(areas: Area[]): AllotmentData {
  return {
    version: 18,
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

describe('isBedLikeKind', () => {
  it.each(['rotation-bed', 'perennial-bed', 'other'] as AreaKind[])(
    'returns true for %s',
    kind => {
      expect(isBedLikeKind(kind)).toBe(true)
    }
  )

  it.each(['tree', 'berry', 'herb', 'infrastructure'] as AreaKind[])(
    'returns false for %s',
    kind => {
      expect(isBedLikeKind(kind)).toBe(false)
    }
  )

  it('returns false for undefined (unresolved area)', () => {
    expect(isBedLikeKind(undefined)).toBe(false)
  })
})

describe('legacy bed queries keep rotation+perennial semantics', () => {
  // Deliberate: getAllBeds/getBedAreaById feed the deprecated PhysicalBed
  // wrappers whose 'rotation'|'perennial' status has no representation for
  // 'other'. Selection routing uses isBedLikeKind instead.
  const data = dataWithAreas([
    area('bed-a', 'rotation-bed'),
    area('asparagus-bed', 'perennial-bed'),
    area('flower-patch', 'other'),
    area('shed', 'infrastructure'),
  ])

  it("getAllBeds excludes 'other' areas", () => {
    expect(getAllBeds(data).map(a => a.id)).toEqual(['bed-a', 'asparagus-bed'])
  })

  it("getBedAreaById returns undefined for an 'other' area", () => {
    expect(getBedAreaById(data, 'flower-patch')).toBeUndefined()
    expect(getBedAreaById(data, 'bed-a')?.id).toBe('bed-a')
  })
})
