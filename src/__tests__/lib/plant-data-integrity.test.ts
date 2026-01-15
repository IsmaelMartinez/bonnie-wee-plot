import { describe, it, expect } from 'vitest'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { vegetableIndex } from '@/lib/vegetables/index'
import { checkCompanionCompatibility } from '@/lib/companion-validation'

/**
 * Plant Data Integrity Tests
 *
 * These tests verify the consistency and quality of plant data
 * between the vegetable index and database.
 */

describe('Plant Data Integrity', () => {
  describe('ID Synchronization', () => {
    it('all index IDs should exist in database', () => {
      const missingIds: string[] = []

      for (const indexEntry of vegetableIndex) {
        const dbEntry = getVegetableById(indexEntry.id)
        if (!dbEntry) {
          missingIds.push(indexEntry.id)
        }
      }

      expect(missingIds).toEqual([])
    })

    it('all database IDs should exist in index', () => {
      const indexIds = new Set(vegetableIndex.map(v => v.id))
      const orphanedIds: string[] = []

      for (const veg of vegetables) {
        if (!indexIds.has(veg.id)) {
          orphanedIds.push(veg.id)
        }
      }

      expect(orphanedIds).toEqual([])
    })

    it('all plant IDs should be unique', () => {
      const ids = vegetables.map(v => v.id)
      const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)

      expect(duplicates).toEqual([])
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('Critical Companion Pairs', () => {
    it.each([
      ['carrot', 'onion', 'good'],
      ['carrot', 'leek', 'good'],
      ['tomato', 'potato', 'bad'],
    ])('%s + %s should be %s', (plantA, plantB, expected) => {
      const result = checkCompanionCompatibility(plantA, plantB)
      expect(result).toBe(expected)
    })
  })

  describe('Three Sisters Relationships', () => {
    it('sweetcorn should have beans as companion', () => {
      const sweetcorn = getVegetableById('sweetcorn')
      expect(sweetcorn).toBeDefined()
      expect(sweetcorn?.companionPlants.some(c =>
        c.toLowerCase().includes('bean')
      )).toBe(true)
    })

    // TODO: Phase 1 - Add sweetcorn to runner beans companions
    it.skip('runner beans should have sweetcorn as companion', () => {
      const runnerBeans = getVegetableById('runner-beans')
      expect(runnerBeans).toBeDefined()
      expect(runnerBeans?.companionPlants.some(c =>
        c.toLowerCase().includes('sweetcorn') || c.toLowerCase().includes('corn')
      )).toBe(true)
    })

    // TODO: Phase 1 - Add sweetcorn to squash companions
    it.skip('squash should have sweetcorn as companion', () => {
      const squash = getVegetableById('squash')
      expect(squash).toBeDefined()
      expect(squash?.companionPlants.some(c =>
        c.toLowerCase().includes('sweetcorn') || c.toLowerCase().includes('corn')
      )).toBe(true)
    })
  })

  describe('Companion Data Quality', () => {
    const VAGUE_REFERENCES = [
      'All vegetables',
      'Alliums',
      'Climbing vegetables',
      'Companion honeyberry varieties',
      'Dill should be kept separate',
      'Herbs',
      'Most vegetables',
      'Native hedgerow plants',
      'Native plants',
      'Nitrogen-loving plants nearby',
      'Perennial vegetables',
      'Shade vegetables',
      'Vegetables',
      'Vegetables (general)',
      'Water-loving plants',
      'Woodland plants',
    ]

    it('should not contain instruction strings in companion arrays', () => {
      const instructions: Array<{ plant: string; value: string }> = []

      for (const veg of vegetables) {
        for (const companion of veg.companionPlants) {
          if (companion.includes('should') || companion.includes('must')) {
            instructions.push({ plant: veg.id, value: companion })
          }
        }
      }

      expect(instructions).toEqual([])
    })

    it('should track vague references (improvement metric)', () => {
      const allCompanions = vegetables.flatMap(v => v.companionPlants)
      const vagueCount = allCompanions.filter(c => VAGUE_REFERENCES.includes(c)).length

      // This test documents current state; count should decrease over time
      // After Phase 0, this should be < 20 (we removed 'Dill should be kept separate')
      expect(vagueCount).toBeLessThan(50)
    })
  })

  describe('Database Stability', () => {
    it('database should contain expected plant count', () => {
      // Plant count should be in reasonable range (190-220)
      expect(vegetables.length).toBeGreaterThanOrEqual(190)
      expect(vegetables.length).toBeLessThanOrEqual(220)
    })

    it('index should contain expected plant count', () => {
      expect(vegetableIndex.length).toBeGreaterThanOrEqual(190)
      expect(vegetableIndex.length).toBeLessThanOrEqual(220)
    })

    it('index and database should have same count', () => {
      expect(vegetableIndex.length).toBe(vegetables.length)
    })
  })
})
