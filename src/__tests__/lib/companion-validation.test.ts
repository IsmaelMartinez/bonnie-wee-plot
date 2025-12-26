import { describe, it, expect } from 'vitest'
import {
  getAdjacentCells,
  checkCompanionCompatibility,
  validatePlacement,
  getSuggestedCompanions,
  getAvoidedPlants,
  calculateCompanionScore
} from '@/lib/companion-validation'
import { PlotCell, GridPlot } from '@/types/garden-planner'

// Helper to create a test grid plot
function createTestPlot(cells: Partial<PlotCell>[]): GridPlot {
  return {
    id: 'test-plot',
    name: 'Test Plot',
    width: 2,
    length: 2,
    color: '#22c55e',
    sortOrder: 0,
    gridRows: 3,
    gridCols: 3,
    cells: cells.map((c, i) => ({
      id: `cell-${i}`,
      plotId: 'test-plot',
      row: Math.floor(i / 3),
      col: i % 3,
      ...c
    }))
  }
}

describe('getAdjacentCells', () => {
  it('should return adjacent cells for a center cell', () => {
    const plot = createTestPlot([
      {}, {}, {},
      {}, {}, {},
      {}, {}, {}
    ])
    const centerCell = plot.cells[4] // Row 1, Col 1 - center
    
    const adjacent = getAdjacentCells(centerCell, plot.cells)
    
    // Center cell should have 8 adjacent cells
    expect(adjacent).toHaveLength(8)
  })

  it('should return fewer adjacent cells for a corner cell', () => {
    const plot = createTestPlot([
      {}, {}, {},
      {}, {}, {},
      {}, {}, {}
    ])
    const cornerCell = plot.cells[0] // Row 0, Col 0 - top-left corner
    
    const adjacent = getAdjacentCells(cornerCell, plot.cells)
    
    // Corner cell should have 3 adjacent cells
    expect(adjacent).toHaveLength(3)
  })

  it('should return edge cells correctly', () => {
    const plot = createTestPlot([
      {}, {}, {},
      {}, {}, {},
      {}, {}, {}
    ])
    const edgeCell = plot.cells[1] // Row 0, Col 1 - top edge
    
    const adjacent = getAdjacentCells(edgeCell, plot.cells)
    
    // Top edge cell should have 5 adjacent cells
    expect(adjacent).toHaveLength(5)
  })
})

describe('checkCompanionCompatibility', () => {
  it('should return good for known companions (carrots and onions)', () => {
    const result = checkCompanionCompatibility('carrots', 'onions')
    expect(result).toBe('good')
  })

  it('should return bad for plants that should be avoided (carrots and dill)', () => {
    const result = checkCompanionCompatibility('carrots', 'parsnips')
    // Carrots avoid Dill and Parsnips
    expect(result).toBe('bad')
  })

  it('should return neutral for plants with no relationship', () => {
    const result = checkCompanionCompatibility('lettuce', 'kale')
    expect(result).toBe('neutral')
  })

  it('should return neutral for unknown vegetable IDs', () => {
    const result = checkCompanionCompatibility('unknown1', 'unknown2')
    expect(result).toBe('neutral')
  })

  it('should be bidirectional - checking either direction gives same result', () => {
    const result1 = checkCompanionCompatibility('carrots', 'onions')
    const result2 = checkCompanionCompatibility('onions', 'carrots')
    expect(result1).toBe(result2)
  })
})

describe('validatePlacement', () => {
  it('should return valid for placement with no neighbors', () => {
    const plot = createTestPlot([
      {}, {}, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const result = validatePlacement('carrots', plot.cells[4], plot)
    
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.compatibility).toBe('neutral')
  })

  it('should return good compatibility when placed near a companion', () => {
    const plot = createTestPlot([
      {}, { vegetableId: 'onions' }, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const result = validatePlacement('carrots', plot.cells[4], plot)
    
    expect(result.isValid).toBe(true)
    expect(result.compatibility).toBe('good')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('should return bad compatibility with warnings when placed near avoided plant', () => {
    const plot = createTestPlot([
      {}, { vegetableId: 'parsnips' }, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const result = validatePlacement('carrots', plot.cells[4], plot)
    
    expect(result.compatibility).toBe('bad')
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0].type).toBe('avoid')
  })

  it('should return invalid for unknown vegetable', () => {
    const plot = createTestPlot([{}, {}, {}, {}, {}, {}, {}, {}, {}])
    
    const result = validatePlacement('unknown-veg-id', plot.cells[4], plot)
    
    expect(result.isValid).toBe(false)
    expect(result.warnings[0].severity).toBe('error')
  })
})

describe('getSuggestedCompanions', () => {
  it('should return suggested companion vegetable IDs', () => {
    const companions = getSuggestedCompanions('carrots')
    
    expect(companions.length).toBeGreaterThan(0)
    // Carrots have onions, leeks as companions
    expect(companions).toContain('onions')
    expect(companions).toContain('leeks')
  })

  it('should return empty array for unknown vegetable', () => {
    const companions = getSuggestedCompanions('unknown-veg')
    
    expect(companions).toEqual([])
  })
})

describe('getAvoidedPlants', () => {
  it('should return plants to avoid', () => {
    const avoided = getAvoidedPlants('carrots')
    
    expect(avoided.length).toBeGreaterThan(0)
    // Carrots should avoid parsnips
    expect(avoided).toContain('parsnips')
  })

  it('should return empty array for unknown vegetable', () => {
    const avoided = getAvoidedPlants('unknown-veg')
    
    expect(avoided).toEqual([])
  })
})

describe('calculateCompanionScore', () => {
  it('should return 50 for cell with no neighbors', () => {
    const plot = createTestPlot([
      {}, {}, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const score = calculateCompanionScore('carrots', plot.cells[4], plot)
    
    expect(score).toBe(50)
  })

  it('should return higher score when near companions', () => {
    const plot = createTestPlot([
      {}, { vegetableId: 'onions' }, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const score = calculateCompanionScore('carrots', plot.cells[4], plot)
    
    expect(score).toBeGreaterThan(50)
  })

  it('should return lower score when near avoided plants', () => {
    const plot = createTestPlot([
      {}, { vegetableId: 'parsnips' }, {},
      {}, {}, {},
      {}, {}, {}
    ])
    
    const score = calculateCompanionScore('carrots', plot.cells[4], plot)
    
    expect(score).toBeLessThan(50)
  })

  it('should clamp score between 0 and 100', () => {
    // Create plot with many bad neighbors
    const plot = createTestPlot([
      { vegetableId: 'parsnips' }, { vegetableId: 'parsnips' }, { vegetableId: 'parsnips' },
      { vegetableId: 'parsnips' }, {}, { vegetableId: 'parsnips' },
      { vegetableId: 'parsnips' }, { vegetableId: 'parsnips' }, { vegetableId: 'parsnips' }
    ])
    
    const score = calculateCompanionScore('carrots', plot.cells[4], plot)
    
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})



