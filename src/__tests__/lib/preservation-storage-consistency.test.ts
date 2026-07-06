import { describe, it, expect } from 'vitest'
import { vegetables } from '@/lib/vegetable-database'
import { preservationGuides } from '@/lib/preservation'
import { PRESERVE_METHODS } from '@/lib/task-generator'

/**
 * Guards against drift between PreservationGuide.methods and
 * Vegetable.storage.methods. The Today-dashboard glut nudge
 * (task-generator.ts) and the coverage test both key off storage.methods,
 * so a preserve method that exists only in the guide would silently skip
 * both. If this fails, back-fill the crop's storage.methods in
 * src/lib/vegetables/data/ (or remove the unsound method from the guide).
 */
describe('Preservation guide / storage.methods consistency', () => {
  const preserveMethodSet = new Set(PRESERVE_METHODS)
  const vegetableById = new Map(vegetables.map(v => [v.id, v]))

  it('every preserve method in a guide appears in the crop storage.methods', () => {
    const drift: string[] = []

    for (const guide of preservationGuides) {
      const vegetable = vegetableById.get(guide.plantId)
      if (!vegetable) continue // guide-to-crop matching is covered by preservation-data.test.ts

      const storageMethods = new Set(vegetable.storage?.methods ?? [])
      for (const { method } of guide.methods) {
        if (preserveMethodSet.has(method) && !storageMethods.has(method)) {
          drift.push(`${guide.plantId}: guide has '${method}' but storage.methods lacks it`)
        }
      }
    }

    expect(
      drift,
      'These guides advertise a preserve method (freeze/jam/pickle/ferment/dry) that is ' +
        'missing from the crop\'s Vegetable.storage.methods, so the crop gets no glut ' +
        'nudge and falls outside the coverage test. Back-fill storage.methods in ' +
        'src/lib/vegetables/data/ or drop the method from the guide.'
    ).toEqual([])
  })

  it('the consistency check is non-vacuous', () => {
    const checkedMethods = preservationGuides
      .filter(g => vegetableById.has(g.plantId))
      .flatMap(g => g.methods)
      .filter(m => preserveMethodSet.has(m.method))
    expect(checkedMethods.length).toBeGreaterThan(100)
  })
})
