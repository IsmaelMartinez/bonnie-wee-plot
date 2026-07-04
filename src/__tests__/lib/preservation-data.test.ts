import { describe, it, expect } from 'vitest'
import { preservationGuides, getPreservationGuide, getMethodsInUse, PRESERVATION_METHOD_LABELS } from '@/lib/preservation'
import { vegetableIndex } from '@/lib/vegetables/index'

describe('Preservation Data Integrity', () => {
  const indexIds = new Set(vegetableIndex.map(v => v.id))

  it('every guide references a real plant id', () => {
    const unknown = preservationGuides.filter(g => !indexIds.has(g.plantId))
    expect(unknown.map(g => g.plantId)).toEqual([])
  })

  it('plant ids are unique across all category files', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const g of preservationGuides) {
      if (seen.has(g.plantId)) duplicates.push(g.plantId)
      seen.add(g.plantId)
    }
    expect(duplicates).toEqual([])
  })

  it('every guide has at least one method with instructions', () => {
    for (const g of preservationGuides) {
      expect(g.methods.length, `${g.plantId} has no methods`).toBeGreaterThan(0)
      for (const m of g.methods) {
        expect(m.how.trim().length, `${g.plantId}/${m.method} has empty instructions`).toBeGreaterThan(0)
      }
    }
  })

  it('methods are not repeated within a guide', () => {
    for (const g of preservationGuides) {
      const methods = g.methods.map(m => m.method)
      expect(new Set(methods).size, `${g.plantId} repeats a method`).toBe(methods.length)
    }
  })

  it('all resource links are well-formed https URLs', () => {
    for (const g of preservationGuides) {
      const resources = [
        ...g.methods.flatMap(m => m.resources ?? []),
        ...(g.recipeIdeas ?? []),
      ]
      for (const r of resources) {
        expect(r.url, `${g.plantId}: ${r.title}`).toMatch(/^https:\/\//)
        expect(() => new URL(r.url), `${g.plantId}: invalid URL ${r.url}`).not.toThrow()
        expect(r.title.trim().length, `${g.plantId} has a resource without a title`).toBeGreaterThan(0)
        expect(r.source.trim().length, `${g.plantId}: ${r.title} has no source`).toBeGreaterThan(0)
      }
    }
  })

  it('getPreservationGuide looks up by plant id', () => {
    if (preservationGuides.length === 0) return
    const first = preservationGuides[0]
    expect(getPreservationGuide(first.plantId)).toBe(first)
    expect(getPreservationGuide('not-a-real-plant')).toBeUndefined()
  })

  it('getMethodsInUse returns only methods present in guides, in label order', () => {
    const inUse = getMethodsInUse()
    const labelOrder = Object.keys(PRESERVATION_METHOD_LABELS)
    expect(inUse).toEqual(labelOrder.filter(m => inUse.includes(m as never)))
    const allMethods = new Set(preservationGuides.flatMap(g => g.methods.map(m => m.method)))
    expect(new Set(inUse)).toEqual(allMethods)
  })
})
