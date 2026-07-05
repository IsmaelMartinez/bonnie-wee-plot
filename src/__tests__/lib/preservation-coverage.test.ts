import { describe, it, expect } from 'vitest'
import { vegetables } from '@/lib/vegetable-database'
import { preservationGuides } from '@/lib/preservation'
import { PRESERVE_METHODS } from '@/lib/task-generator'

describe('Preservation guide coverage', () => {
  const preserveMethodSet = new Set(PRESERVE_METHODS)
  const preserveCrops = vegetables.filter(v =>
    v.storage?.methods.some(m => preserveMethodSet.has(m))
  )
  const covered = new Set(preservationGuides.map(g => g.plantId))

  it('every crop with a preserve storage method has a guide', () => {
    const missing = preserveCrops.filter(v => !covered.has(v.id)).map(v => v.id)
    expect(
      missing,
      'These crops advertise a preserve method (freeze/jam/pickle/ferment/dry) in ' +
        'Vegetable.storage but have no PreservationGuide. Author one in ' +
        'src/lib/preservation/data/ following data/README.md.'
    ).toEqual([])
  })

  it('the coverage check is non-vacuous', () => {
    expect(preserveCrops.length).toBeGreaterThan(50)
    expect(covered.size).toBeGreaterThan(100)
  })
})
