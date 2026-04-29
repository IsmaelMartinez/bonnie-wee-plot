import { describe, it, expect, vi } from 'vitest'
import { getBoostSuggestions } from '@/lib/boost-suggestions'
import type { Planting, StoredVariety } from '@/types/unified-allotment'

vi.mock('@/lib/vegetable-database', () => {
  const db: Record<string, {
    id: string
    name: string
    enhancedCompanions: Array<{
      plantId: string
      confidence: 'proven' | 'likely' | 'traditional' | 'anecdotal'
      mechanism?: string
      bidirectional: boolean
    }>
  }> = {
    tomato: {
      id: 'tomato',
      name: 'Tomato',
      enhancedCompanions: [
        { plantId: 'basil', confidence: 'likely', mechanism: 'pest_confusion', bidirectional: true },
        { plantId: 'marigold', confidence: 'proven', mechanism: 'pest_trap', bidirectional: false },
      ],
    },
    pepper: {
      id: 'pepper',
      name: 'Pepper',
      enhancedCompanions: [
        { plantId: 'basil', confidence: 'traditional', mechanism: 'beneficial_attraction', bidirectional: true },
        { plantId: 'marigold', confidence: 'likely', mechanism: 'pest_trap', bidirectional: false },
      ],
    },
    basil: { id: 'basil', name: 'Basil', enhancedCompanions: [] },
    marigold: { id: 'marigold', name: 'Marigold', enhancedCompanions: [] },
    'broad-bean': {
      id: 'broad-bean',
      name: 'Broad Bean',
      enhancedCompanions: [
        { plantId: 'sweetcorn', confidence: 'proven', mechanism: 'nitrogen_fixation', bidirectional: true },
      ],
    },
    sweetcorn: { id: 'sweetcorn', name: 'Sweetcorn', enhancedCompanions: [] },
    onion: { id: 'onion', name: 'Onion', enhancedCompanions: [] },
  }
  return {
    getVegetableById: (id: string) => db[id] ?? null,
  }
})

function planting(plantId: string): Planting {
  return { id: `p-${plantId}`, plantId }
}

function variety(plantId: string, year: number, status: 'have' | 'ordered' | 'none' = 'have'): StoredVariety {
  return {
    id: `v-${plantId}`,
    plantId,
    name: `${plantId}-default`,
    seedsByYear: { [year]: status },
  } as StoredVariety
}

describe('getBoostSuggestions', () => {
  it('returns no suggestions when the bed is empty', () => {
    expect(getBoostSuggestions([], [], 2026)).toEqual([])
  })

  it('suggests companions for the plantings in the bed', () => {
    const result = getBoostSuggestions([planting('tomato')], [], 2026)
    const ids = result.map((s) => s.plantId)
    expect(ids).toContain('basil')
    expect(ids).toContain('marigold')
  })

  it('omits companions already present in the bed', () => {
    const result = getBoostSuggestions([planting('tomato'), planting('basil')], [], 2026)
    expect(result.map((s) => s.plantId)).not.toContain('basil')
  })

  it('ranks suggestions where the user has seed first', () => {
    const result = getBoostSuggestions(
      [planting('tomato')],
      [variety('basil', 2026, 'have')],
      2026
    )
    expect(result[0].plantId).toBe('basil')
    expect(result[0].hasSeed).toBe(true)
  })

  it('falls back to confidence ranking when seed availability is equal', () => {
    const result = getBoostSuggestions([planting('tomato')], [], 2026)
    // marigold is "proven" via pest_trap, basil is "likely" via pest_confusion
    expect(result[0].plantId).toBe('marigold')
    expect(result[0].confidence).toBe('proven')
  })

  it('aggregates pairings across multiple plantings and keeps the strongest confidence', () => {
    const result = getBoostSuggestions([planting('tomato'), planting('pepper')], [], 2026)
    const basil = result.find((s) => s.plantId === 'basil')!
    expect(basil.pairsWith.sort()).toEqual(['Pepper', 'Tomato'])
    // Tomato's basil pairing is "likely" (stronger than pepper's "traditional")
    expect(basil.confidence).toBe('likely')
  })

  it('applies the limit', () => {
    const result = getBoostSuggestions([planting('tomato'), planting('pepper')], [], 2026, 1)
    expect(result).toHaveLength(1)
  })

  it('produces a mechanism-based reason', () => {
    const result = getBoostSuggestions([planting('broad-bean')], [], 2026)
    const sweetcorn = result.find((s) => s.plantId === 'sweetcorn')!
    expect(sweetcorn.reason).toBe('Fixes nitrogen for the bed')
  })

  it('ignores archived varieties for seed-availability ranking', () => {
    const archived: StoredVariety = {
      ...variety('basil', 2026, 'have'),
      isArchived: true,
    } as StoredVariety
    const result = getBoostSuggestions([planting('tomato')], [archived], 2026)
    const basil = result.find((s) => s.plantId === 'basil')!
    expect(basil.hasSeed).toBe(false)
  })
})
