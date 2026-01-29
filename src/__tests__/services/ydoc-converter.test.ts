import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import type { AllotmentData } from '@/types/unified-allotment'

describe('YDoc Converter', () => {
  const sampleData: AllotmentData = {
    version: 16,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-29'
    },
    layout: {
      areas: [{
        id: 'bed-a',
        name: 'Bed A',
        kind: 'rotation-bed',
        canHavePlantings: true
      }]
    },
    seasons: [{
      year: 2026,
      status: 'current',
      areas: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-29'
    }],
    varieties: []
  }

  it('converts AllotmentData to Y.Doc', async () => {
    const { allotmentToYDoc } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)

    const root = ydoc.getMap('allotment')
    expect(root.get('currentYear')).toBe(2026)
    expect(root.get('version')).toBe(16)
  })

  it('converts Y.Doc back to AllotmentData', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)
    const result = yDocToAllotment(ydoc)

    expect(result.currentYear).toBe(2026)
    expect(result.meta.name).toBe('Test Allotment')
    expect(result.layout.areas).toHaveLength(1)
  })

  it('round-trips data without loss', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)
    const result = yDocToAllotment(ydoc)

    expect(result).toEqual(sampleData)
  })
})
