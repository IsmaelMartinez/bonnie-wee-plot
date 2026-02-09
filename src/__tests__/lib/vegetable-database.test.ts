import { describe, it, expect } from 'vitest'
import {
  vegetables,
  getVegetableById,
  getVegetablesByCategory,
  searchVegetables,
  getVegetablesForMonth,
  getAllCategories
} from '@/lib/vegetable-database'

describe('vegetables database', () => {
  it('should contain vegetables', () => {
    expect(vegetables.length).toBeGreaterThan(0)
  })

  it('should have valid structure for all vegetables', () => {
    for (const veg of vegetables) {
      expect(veg.id).toBeDefined()
      expect(veg.name).toBeDefined()
      expect(veg.category).toBeDefined()
      expect(veg.planting).toBeDefined()
      expect(veg.care).toBeDefined()
      expect(Array.isArray(veg.enhancedCompanions)).toBe(true)
      expect(Array.isArray(veg.enhancedAvoid)).toBe(true)
    }
  })
})

describe('getVegetableById', () => {
  it('should find vegetable by ID', () => {
    const veg = getVegetableById('carrot')
    
    expect(veg).toBeDefined()
    expect(veg?.name).toBe('Carrot')
  })

  it('should return undefined for non-existent ID', () => {
    const veg = getVegetableById('non-existent')
    
    expect(veg).toBeUndefined()
  })

  it('should find common vegetables', () => {
    const commonVegs = ['carrot', 'potato', 'onion', 'lettuce', 'peas', 'cherry-tomato']
    
    for (const id of commonVegs) {
      expect(getVegetableById(id)).toBeDefined()
    }
  })
})

describe('getVegetablesByCategory', () => {
  it('should return vegetables for valid category', () => {
    const roots = getVegetablesByCategory('root-vegetables')
    
    expect(roots.length).toBeGreaterThan(0)
    expect(roots.every(v => v.category === 'root-vegetables')).toBe(true)
  })

  it('should include carrots in root vegetables', () => {
    const roots = getVegetablesByCategory('root-vegetables')
    
    const carrots = roots.find(v => v.id === 'carrot')
    expect(carrots).toBeDefined()
  })

  it('should include lettuce in leafy greens', () => {
    const greens = getVegetablesByCategory('leafy-greens')
    
    const lettuce = greens.find(v => v.id === 'lettuce')
    expect(lettuce).toBeDefined()
  })

  it('should return empty array for non-existent category', () => {
    const result = getVegetablesByCategory('non-existent' as never)
    
    expect(result).toEqual([])
  })
})

describe('searchVegetables', () => {
  it('should find vegetables by name', () => {
    const results = searchVegetables('carrot')
    
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(v => v.id === 'carrot')).toBe(true)
  })

  it('should be case-insensitive', () => {
    const lower = searchVegetables('carrot')
    const upper = searchVegetables('CARROT')
    const mixed = searchVegetables('CaRrOt')
    
    expect(lower.length).toBe(upper.length)
    expect(lower.length).toBe(mixed.length)
  })

  it('should search in description too', () => {
    // "Scottish" appears in many descriptions
    const results = searchVegetables('Scottish')
    
    expect(results.length).toBeGreaterThan(0)
  })

  it('should return empty array for no matches', () => {
    const results = searchVegetables('xyznonexistent123')
    
    expect(results).toEqual([])
  })
})

describe('getVegetablesForMonth', () => {
  it('should return vegetables for sowing in April', () => {
    const toSow = getVegetablesForMonth(4, 'sow')
    
    expect(toSow.length).toBeGreaterThan(0)
  })

  it('should return vegetables for harvest in August', () => {
    const toHarvest = getVegetablesForMonth(8, 'harvest')
    
    expect(toHarvest.length).toBeGreaterThan(0)
  })

  it('should include potatoes for harvest in September', () => {
    const toHarvest = getVegetablesForMonth(9, 'harvest')
    
    const potatoes = toHarvest.find(v => v.id === 'potato')
    expect(potatoes).toBeDefined()
  })

  it('should include broad beans for sowing in autumn', () => {
    const toSow = getVegetablesForMonth(10, 'sow')
    
    const broadBeans = toSow.find(v => v.id === 'broad-beans')
    expect(broadBeans).toBeDefined()
  })
})

describe('getAllCategories', () => {
  it('should return all unique categories', () => {
    const categories = getAllCategories()
    
    expect(categories.length).toBeGreaterThan(0)
    // Check for expected categories
    expect(categories).toContain('root-vegetables')
    expect(categories).toContain('leafy-greens')
    expect(categories).toContain('brassicas')
    expect(categories).toContain('legumes')
  })

  it('should return unique values', () => {
    const categories = getAllCategories()
    const unique = [...new Set(categories)]
    
    expect(categories.length).toBe(unique.length)
  })
})

describe('vegetable planting data', () => {
  it('should have valid month arrays (1-12)', () => {
    for (const veg of vegetables) {
      const allMonths = [
        ...veg.planting.sowIndoorsMonths,
        ...veg.planting.sowOutdoorsMonths,
        ...veg.planting.transplantMonths,
        ...veg.planting.harvestMonths
      ]
      
      for (const month of allMonths) {
        expect(month).toBeGreaterThanOrEqual(1)
        expect(month).toBeLessThanOrEqual(12)
      }
    }
  })

  it('should have valid days to harvest range', () => {
    for (const veg of vegetables) {
      expect(veg.planting.daysToHarvest.min).toBeLessThanOrEqual(veg.planting.daysToHarvest.max)
      expect(veg.planting.daysToHarvest.min).toBeGreaterThan(0)
    }
  })
})

describe('vegetable care data', () => {
  it('should have valid sun requirements', () => {
    const validSun = ['full-sun', 'partial-shade', 'shade']
    
    for (const veg of vegetables) {
      expect(validSun).toContain(veg.care.sun)
    }
  })

  it('should have valid water requirements', () => {
    const validWater = ['low', 'moderate', 'high']
    
    for (const veg of vegetables) {
      expect(validWater).toContain(veg.care.water)
    }
  })

  it('should have valid difficulty levels', () => {
    const validDifficulty = ['beginner', 'intermediate', 'advanced']
    
    for (const veg of vegetables) {
      expect(validDifficulty).toContain(veg.care.difficulty)
    }
  })

  it('should have positive spacing values', () => {
    // Mushrooms and green manures don't have traditional spacing (substrate/broadcast sown)
    const spacedPlants = vegetables.filter(
      v => v.category !== 'mushrooms' && v.category !== 'green-manures'
    )
    for (const veg of spacedPlants) {
      expect(veg.care.spacing.between).toBeGreaterThan(0)
      expect(veg.care.spacing.rows).toBeGreaterThan(0)
    }
  })
})




