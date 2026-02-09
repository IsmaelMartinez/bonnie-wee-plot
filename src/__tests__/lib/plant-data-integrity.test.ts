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
      ['cherry-tomato', 'potato', 'bad'],
    ])('%s + %s should be %s', (plantA, plantB, expected) => {
      const result = checkCompanionCompatibility(plantA, plantB)
      expect(result).toBe(expected)
    })
  })

  describe('Three Sisters Relationships', () => {
    it('sweetcorn should have climbing beans as companion for Three Sisters', () => {
      const sweetcorn = getVegetableById('sweetcorn')
      expect(sweetcorn).toBeDefined()
      const hasClimbingBean = sweetcorn?.enhancedCompanions.some(
        c => c.plantId === 'runner-beans' || c.plantId === 'climbing-french-beans'
      )
      expect(hasClimbingBean).toBe(true)
    })

    it('runner beans should have sweetcorn as companion', () => {
      const runnerBeans = getVegetableById('runner-beans')
      expect(runnerBeans).toBeDefined()
      expect(runnerBeans?.enhancedCompanions.some(c =>
        c.plantId === 'sweetcorn'
      )).toBe(true)
    })

    it('squash should have sweetcorn as companion', () => {
      const squash = getVegetableById('squash')
      expect(squash).toBeDefined()
      expect(squash?.enhancedCompanions.some(c =>
        c.plantId === 'sweetcorn'
      )).toBe(true)
    })
  })

  describe('Database Stability', () => {
    it('database should contain expected plant count', () => {
      // Plant count should be in reasonable range (180-215)
      expect(vegetables.length).toBeGreaterThanOrEqual(180)
      expect(vegetables.length).toBeLessThanOrEqual(215)
    })

    it('index should contain expected plant count', () => {
      expect(vegetableIndex.length).toBeGreaterThanOrEqual(180)
      expect(vegetableIndex.length).toBeLessThanOrEqual(215)
    })

    it('index and database should have same count', () => {
      expect(vegetableIndex.length).toBe(vegetables.length)
    })
  })
})
