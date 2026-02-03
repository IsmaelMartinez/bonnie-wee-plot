import { describe, it, expect } from 'vitest'
import {
  searchVegetableIndex,
  searchAndScoreVegetables,
  vegetableIndex,
} from '@/lib/vegetables/index'

describe('searchVegetableIndex', () => {
  it('should find vegetables by exact name match', () => {
    const results = searchVegetableIndex('Lettuce')
    expect(results.some(v => v.id === 'lettuce')).toBe(true)
  })

  it('should be case-insensitive', () => {
    const results = searchVegetableIndex('lettuce')
    expect(results.some(v => v.id === 'lettuce')).toBe(true)
  })

  it('should match partial names (substring)', () => {
    const results = searchVegetableIndex('lett')
    expect(results.some(v => v.id === 'lettuce')).toBe(true)
  })

  it('should match by ID', () => {
    const results = searchVegetableIndex('pak-choi')
    expect(results.some(v => v.id === 'pak-choi')).toBe(true)
  })

  it('should return empty array for no matches', () => {
    const results = searchVegetableIndex('zzzzz-nonexistent')
    expect(results).toEqual([])
  })

  it('should return multiple matches for broad queries', () => {
    const results = searchVegetableIndex('bean')
    expect(results.length).toBeGreaterThan(1)
    // Should match runner beans, broad beans, french beans, etc.
    expect(results.some(v => v.id === 'runner-beans')).toBe(true)
    expect(results.some(v => v.id === 'broad-beans')).toBe(true)
  })

  it('should match names with parenthetical content', () => {
    const results = searchVegetableIndex('Daikon')
    expect(results.some(v => v.id === 'mooli')).toBe(true)
  })

  it('should match partial ID', () => {
    const results = searchVegetableIndex('cherry')
    expect(results.some(v => v.id === 'cherry-tomato')).toBe(true)
    expect(results.some(v => v.id === 'cherry-tree')).toBe(true)
  })
})

describe('searchAndScoreVegetables', () => {
  describe('scoring', () => {
    it('should give exact match the highest score', () => {
      const results = searchAndScoreVegetables('Lettuce')
      const lettuce = results.find(v => v.id === 'lettuce')
      expect(lettuce).toBeDefined()
      // Exact match: 200 + prefix: 100 + word boundary: 50 + substring: 25 = 375
      expect(lettuce!.score).toBe(375)
    })

    it('should give prefix match a high score', () => {
      const results = searchAndScoreVegetables('lett')
      const lettuce = results.find(v => v.id === 'lettuce')
      expect(lettuce).toBeDefined()
      // Prefix: 100 + word boundary: 50 + substring: 25 = 175
      expect(lettuce!.score).toBe(175)
    })

    it('should give word boundary match a medium score', () => {
      // "Spinach" as a word in "Perpetual Spinach" - word starts with query
      const results = searchAndScoreVegetables('spinach')
      const perpetualSpinach = results.find(v => v.id === 'perpetual-spinach')
      expect(perpetualSpinach).toBeDefined()
      // Not prefix (doesn't start with 'spinach'), but word boundary + substring
      // word boundary: 50 + substring: 25 = 75
      expect(perpetualSpinach!.score).toBe(75)

      // Regular Spinach should score higher (exact + prefix + word boundary + substring)
      const spinach = results.find(v => v.id === 'spinach')
      expect(spinach).toBeDefined()
      expect(spinach!.score).toBe(375)
    })

    it('should give substring-only match the lowest score', () => {
      // "uce" is a substring of "Lettuce" but not a prefix or word boundary start
      const results = searchAndScoreVegetables('uce')
      const lettuce = results.find(v => v.id === 'lettuce')
      expect(lettuce).toBeDefined()
      // Substring only: 25
      expect(lettuce!.score).toBe(25)
    })

    it('should sort results by score descending', () => {
      const results = searchAndScoreVegetables('spinach')
      // The first result should be the best match
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
      }
    })

    it('should sort alphabetically when scores are equal', () => {
      // Find two results with the same score and check alphabetical order
      const results = searchAndScoreVegetables('squash')
      const sameScoreGroups: Record<number, string[]> = {}
      for (const r of results) {
        if (!sameScoreGroups[r.score]) sameScoreGroups[r.score] = []
        sameScoreGroups[r.score].push(r.name)
      }
      for (const names of Object.values(sameScoreGroups)) {
        if (names.length > 1) {
          const sorted = [...names].sort((a, b) => a.localeCompare(b))
          expect(names).toEqual(sorted)
        }
      }
    })
  })

  describe('filtering', () => {
    it('should exclude non-matching vegetables', () => {
      const results = searchAndScoreVegetables('lettuce')
      expect(results.every(v => v.score > 0)).toBe(true)
      expect(results.some(v => v.id === 'carrot')).toBe(false)
    })

    it('should filter by category when provided', () => {
      const results = searchAndScoreVegetables('', 'herbs')
      expect(results.every(v => v.category === 'herbs')).toBe(true)
      // Should include parsley, coriander, mint, etc.
      expect(results.some(v => v.id === 'parsley')).toBe(true)
    })

    it('should apply both query and category filter', () => {
      const results = searchAndScoreVegetables('mint', 'herbs')
      expect(results.every(v => v.category === 'herbs')).toBe(true)
      expect(results.some(v => v.id === 'mint')).toBe(true)
    })

    it('should not return items from other categories when category is specified', () => {
      const results = searchAndScoreVegetables('tomato', 'herbs')
      // No tomatoes in herbs
      expect(results.some(v => v.id === 'cherry-tomato')).toBe(false)
    })
  })

  describe('empty query', () => {
    it('should return all vegetables with score 0 when query is empty', () => {
      const results = searchAndScoreVegetables('')
      expect(results.length).toBe(vegetableIndex.length)
      expect(results.every(v => v.score === 0)).toBe(true)
    })

    it('should return all vegetables with score 0 for whitespace-only query', () => {
      const results = searchAndScoreVegetables('   ')
      expect(results.length).toBe(vegetableIndex.length)
      expect(results.every(v => v.score === 0)).toBe(true)
    })

    it('should return only category items with score 0 when query is empty and category is set', () => {
      const results = searchAndScoreVegetables('', 'berries')
      expect(results.every(v => v.category === 'berries')).toBe(true)
      expect(results.every(v => v.score === 0)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle single character queries', () => {
      const results = searchAndScoreVegetables('k')
      expect(results.length).toBeGreaterThan(0)
      // Should find kale
      expect(results.some(v => v.id === 'kale')).toBe(true)
    })

    it('should handle queries matching parenthetical content', () => {
      // "Spider Flower" is in parentheses for Cleome
      const results = searchAndScoreVegetables('Spider')
      expect(results.some(v => v.id === 'cleome')).toBe(true)
    })

    it('should handle queries with mixed case', () => {
      const results = searchAndScoreVegetables('KALE')
      expect(results.some(v => v.id === 'kale')).toBe(true)
    })
  })
})
