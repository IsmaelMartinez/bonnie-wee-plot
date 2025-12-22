import { describe, it, expect, vi } from 'vitest'
import {
  ROTATION_GROUPS,
  ROTATION_ORDER,
  getRotationGroup,
  getSuggestedRotation,
  checkRotationViolation,
  getDominantRotationGroup,
  buildRotationHistoryEntry,
  getRotationSummary,
  calculateRotationScore
} from '@/lib/crop-rotation'
import { RotationHistory, GridPlot } from '@/types/garden-planner'

// Mock getVegetableById
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn((id: string) => {
    const mockVegetables: Record<string, { id: string; name: string; category: string }> = {
      'tomato': { id: 'tomato', name: 'Tomato', category: 'solanaceae' },
      'carrot': { id: 'carrot', name: 'Carrot', category: 'root-vegetables' },
      'broccoli': { id: 'broccoli', name: 'Broccoli', category: 'brassicas' },
      'peas': { id: 'peas', name: 'Peas', category: 'legumes' },
      'onion': { id: 'onion', name: 'Onion', category: 'alliums' },
      'basil': { id: 'basil', name: 'Basil', category: 'herbs' },
      'courgette': { id: 'courgette', name: 'Courgette', category: 'cucurbits' }
    }
    return mockVegetables[id] || undefined
  }),
  vegetables: []
}))

describe('ROTATION_GROUPS', () => {
  it('should map all vegetable categories to rotation groups', () => {
    expect(ROTATION_GROUPS['brassicas']).toBe('brassicas')
    expect(ROTATION_GROUPS['legumes']).toBe('legumes')
    expect(ROTATION_GROUPS['root-vegetables']).toBe('roots')
    expect(ROTATION_GROUPS['solanaceae']).toBe('solanaceae')
    expect(ROTATION_GROUPS['herbs']).toBe('permanent')
  })
})

describe('ROTATION_ORDER', () => {
  it('should have legumes, brassicas, roots in correct order', () => {
    expect(ROTATION_ORDER).toEqual(['legumes', 'brassicas', 'roots'])
  })
})

describe('getRotationGroup', () => {
  it('should return rotation group for valid vegetable', () => {
    expect(getRotationGroup('tomato')).toBe('solanaceae')
    expect(getRotationGroup('carrot')).toBe('roots')
    expect(getRotationGroup('broccoli')).toBe('brassicas')
    expect(getRotationGroup('peas')).toBe('legumes')
  })

  it('should return permanent for herbs', () => {
    expect(getRotationGroup('basil')).toBe('permanent')
  })

  it('should return undefined for unknown vegetable', () => {
    expect(getRotationGroup('unknown')).toBeUndefined()
  })
})

describe('getSuggestedRotation', () => {
  it('should suggest legumes when no history', () => {
    const result = getSuggestedRotation('plot-1', 2025, [])
    expect(result).toBe('legumes')
  })

  it('should suggest brassicas after legumes', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'legumes', vegetables: ['peas'] }
    ]
    const result = getSuggestedRotation('plot-1', 2025, history)
    expect(result).toBe('brassicas')
  })

  it('should suggest roots after brassicas', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    const result = getSuggestedRotation('plot-1', 2025, history)
    expect(result).toBe('roots')
  })

  it('should cycle back to legumes after roots', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'roots', vegetables: ['carrot'] }
    ]
    const result = getSuggestedRotation('plot-1', 2025, history)
    expect(result).toBe('legumes')
  })

  it('should suggest legumes for non-standard rotation groups', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'alliums', vegetables: ['onion'] }
    ]
    const result = getSuggestedRotation('plot-1', 2025, history)
    expect(result).toBe('legumes')
  })
})

describe('checkRotationViolation', () => {
  it('should return null for permanent crops', () => {
    const result = checkRotationViolation('basil', 'plot-1', 2025, [])
    expect(result).toBeNull()
  })

  it('should return null when no violation', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    const result = checkRotationViolation('tomato', 'plot-1', 2025, history)
    expect(result).toBeNull()
  })

  it('should return error for same group last year', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    const result = checkRotationViolation('broccoli', 'plot-1', 2025, history)
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('error')
    expect(result?.type).toBe('rotation')
  })

  it('should return warning for same group 2 years ago', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2023, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    const result = checkRotationViolation('broccoli', 'plot-1', 2025, history)
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('warning')
  })

  it('should return null for same group 3+ years ago', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2022, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    const result = checkRotationViolation('broccoli', 'plot-1', 2025, history)
    expect(result).toBeNull()
  })
})

describe('getDominantRotationGroup', () => {
  const createMockPlot = (vegetables: (string | undefined)[]): GridPlot => ({
    id: 'plot-1',
    name: 'Test Plot',
    width: 2,
    length: 2,
    color: '#green',
    sortOrder: 0,
    gridRows: 2,
    gridCols: 2,
    cells: vegetables.map((vegId, i) => ({
      id: `cell-${i}`,
      plotId: 'plot-1',
      row: Math.floor(i / 2),
      col: i % 2,
      vegetableId: vegId
    }))
  })

  it('should return null for empty plot', () => {
    const plot = createMockPlot([undefined, undefined, undefined, undefined])
    expect(getDominantRotationGroup(plot)).toBeNull()
  })

  it('should return dominant group', () => {
    const plot = createMockPlot(['broccoli', 'broccoli', 'carrot', undefined])
    expect(getDominantRotationGroup(plot)).toBe('brassicas')
  })

  it('should exclude permanent crops from dominant group', () => {
    const plot = createMockPlot(['basil', 'basil', 'basil', 'carrot'])
    expect(getDominantRotationGroup(plot)).toBe('roots')
  })
})

describe('buildRotationHistoryEntry', () => {
  const createMockPlot = (vegetables: (string | undefined)[]): GridPlot => ({
    id: 'plot-1',
    name: 'Test Plot',
    width: 2,
    length: 2,
    color: '#green',
    sortOrder: 0,
    gridRows: 2,
    gridCols: 2,
    cells: vegetables.map((vegId, i) => ({
      id: `cell-${i}`,
      plotId: 'plot-1',
      row: Math.floor(i / 2),
      col: i % 2,
      vegetableId: vegId
    }))
  })

  it('should return null for empty plot', () => {
    const plot = createMockPlot([undefined, undefined, undefined, undefined])
    expect(buildRotationHistoryEntry(plot, 2025)).toBeNull()
  })

  it('should build history entry with correct data', () => {
    const plot = createMockPlot(['broccoli', 'broccoli', undefined, undefined])
    const entry = buildRotationHistoryEntry(plot, 2025)
    
    expect(entry).not.toBeNull()
    expect(entry?.plotId).toBe('plot-1')
    expect(entry?.year).toBe(2025)
    expect(entry?.rotationGroup).toBe('brassicas')
    expect(entry?.vegetables).toContain('broccoli')
  })
})

describe('getRotationSummary', () => {
  it('should return empty array for no history', () => {
    const result = getRotationSummary('plot-1', [])
    expect(result).toEqual([])
  })

  it('should return sorted history entries', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2023, rotationGroup: 'roots', vegetables: ['carrot'] },
      { plotId: 'plot-1', year: 2024, rotationGroup: 'legumes', vegetables: ['peas'] },
      { plotId: 'plot-1', year: 2025, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    
    const result = getRotationSummary('plot-1', history)
    
    expect(result).toHaveLength(3)
    expect(result[0].year).toBe(2025)
    expect(result[1].year).toBe(2024)
    expect(result[2].year).toBe(2023)
  })

  it('should filter by plot', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'legumes', vegetables: ['peas'] },
      { plotId: 'plot-2', year: 2024, rotationGroup: 'roots', vegetables: ['carrot'] }
    ]
    
    const result = getRotationSummary('plot-1', history)
    
    expect(result).toHaveLength(1)
    expect(result[0].vegetables).toContain('peas')
  })

  it('should limit years shown', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2022, rotationGroup: 'roots', vegetables: ['carrot'] },
      { plotId: 'plot-1', year: 2023, rotationGroup: 'legumes', vegetables: ['peas'] },
      { plotId: 'plot-1', year: 2024, rotationGroup: 'brassicas', vegetables: ['broccoli'] },
      { plotId: 'plot-1', year: 2025, rotationGroup: 'roots', vegetables: ['carrot'] }
    ]
    
    const result = getRotationSummary('plot-1', history, 2)
    
    expect(result).toHaveLength(2)
    expect(result[0].year).toBe(2025)
    expect(result[1].year).toBe(2024)
  })
})

describe('calculateRotationScore', () => {
  it('should return 75 for permanent crops', () => {
    const score = calculateRotationScore('basil', 'plot-1', 2025, [])
    expect(score).toBe(75)
  })

  it('should return 100 when following suggested rotation', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'roots', vegetables: ['carrot'] }
    ]
    // After roots, suggested is legumes
    const score = calculateRotationScore('peas', 'plot-1', 2025, history)
    expect(score).toBe(100)
  })

  it('should return low score for rotation violation', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'brassicas', vegetables: ['broccoli'] }
    ]
    // Same group as last year - error violation
    const score = calculateRotationScore('broccoli', 'plot-1', 2025, history)
    expect(score).toBe(10)
  })

  it('should return 60 for different group without violation', () => {
    const history: RotationHistory[] = [
      { plotId: 'plot-1', year: 2024, rotationGroup: 'roots', vegetables: ['carrot'] }
    ]
    // After roots, suggested is legumes, but placing tomato (solanaceae)
    const score = calculateRotationScore('tomato', 'plot-1', 2025, history)
    expect(score).toBe(60)
  })
})

