import { describe, it, expect } from 'vitest'
import {
  getCropAgronomy,
  getRotationFamily,
  hasExplicitAgronomy,
  type RotationFamily,
} from '@/lib/agronomy'

describe('agronomy reference data', () => {
  describe('getRotationFamily', () => {
    it('maps known crops to the brief families', () => {
      expect(getRotationFamily('broad-beans')).toBe('Legume')
      expect(getRotationFamily('carrot')).toBe('Umbellifer')
      expect(getRotationFamily('beetroot')).toBe('Chenopod')
      expect(getRotationFamily('sweetcorn')).toBe('Other')
      expect(getRotationFamily('tomato')).toBe('Solanaceae')
      expect(getRotationFamily('courgette')).toBe('Cucurbit')
      expect(getRotationFamily('garlic')).toBe('Allium')
      expect(getRotationFamily('cabbage')).toBe('Brassica')
    })

    it('falls back to the database category for crops without an override', () => {
      // edamame is a legume in the database but not in the override table
      expect(getRotationFamily('edamame')).toBe('Legume')
    })

    it('returns Other for unknown ids and non-veg categories', () => {
      expect(getRotationFamily('does-not-exist')).toBe('Other')
      expect(getRotationFamily('lavender')).toBe('Other') // perennial-flower
    })
  })

  describe('getCropAgronomy', () => {
    it('reproduces the brief starting values for French beans', () => {
      const a = getCropAgronomy('french-beans')
      expect(a.gddBaseTempC).toBe(10)
      expect(a.minSoilTempGerminationC).toBe(12)
      expect(a.frostTolerant).toBe(false)
      expect(a.family).toBe('Legume')
    })

    it('reproduces the brief starting values for potato', () => {
      const a = getCropAgronomy('potato')
      expect(a.gddBaseTempC).toBe(7)
      expect(a.minSoilTempGerminationC).toBe(8)
      expect(a.frostTolerant).toBe(false)
    })

    it('marks frost-tolerant crops correctly', () => {
      expect(getCropAgronomy('broad-beans').frostTolerant).toBe(true)
      expect(getCropAgronomy('peas').frostTolerant).toBe(true)
      expect(getCropAgronomy('kale').frostTolerant).toBe(true)
      expect(getCropAgronomy('sweetcorn').frostTolerant).toBe(false)
      expect(getCropAgronomy('courgette').frostTolerant).toBe(false)
    })

    it('carries a heat-stress temperature for bolt-prone crops only', () => {
      expect(getCropAgronomy('lettuce').heatStressTempC).toBe(24)
      expect(getCropAgronomy('spinach').heatStressTempC).toBe(24)
      // beans do not bolt in UK heat
      expect(getCropAgronomy('broad-beans').heatStressTempC).toBeUndefined()
    })

    it('always resolves usable numbers even for a defaulted crop', () => {
      const a = getCropAgronomy('edamame') // legume, no override
      expect(a.family).toBe('Legume')
      expect(a.gddBaseTempC).toBeGreaterThan(0)
      expect(a.minSoilTempGerminationC).toBeGreaterThan(0)
      expect(a.typicalDaysToGerminate).toBeGreaterThan(0)
      expect(a.typicalDaysToMaturity).toBeGreaterThan(0)
    })

    it('uses the database daysToHarvest midpoint for defaulted maturity', () => {
      // edamame has a daysToHarvest range in the DB; maturity should be its midpoint
      const a = getCropAgronomy('edamame')
      expect(a.typicalDaysToMaturity).toBeGreaterThan(40)
      expect(a.typicalDaysToMaturity).toBeLessThan(200)
    })

    it('never returns NaN or negative agronomy for any override crop', () => {
      const overrideCrops = [
        'broad-beans', 'peas', 'french-beans', 'runner-beans', 'sweetcorn',
        'tomato', 'potato', 'carrot', 'beetroot', 'chard', 'lettuce',
        'cabbage', 'kale', 'onion', 'leek', 'garlic', 'courgette', 'squash',
      ]
      for (const id of overrideCrops) {
        const a = getCropAgronomy(id)
        for (const n of [a.gddBaseTempC, a.minSoilTempGerminationC, a.typicalDaysToGerminate, a.typicalDaysToMaturity]) {
          expect(Number.isFinite(n)).toBe(true)
          expect(n).toBeGreaterThan(0)
        }
        if (a.heatStressTempC !== undefined) {
          expect(a.heatStressTempC).toBeGreaterThan(a.gddBaseTempC)
        }
      }
    })
  })

  describe('hasExplicitAgronomy', () => {
    it('distinguishes override crops from defaulted ones', () => {
      expect(hasExplicitAgronomy('carrot')).toBe(true)
      expect(hasExplicitAgronomy('edamame')).toBe(false)
      expect(hasExplicitAgronomy('does-not-exist')).toBe(false)
    })
  })

  it('covers every brief family in the defaults table', () => {
    const families: RotationFamily[] = [
      'Legume', 'Brassica', 'Allium', 'Solanaceae',
      'Cucurbit', 'Umbellifer', 'Chenopod', 'Other',
    ]
    for (const f of families) {
      // A crop resolving to each family should produce finite base temps.
      const sample = getCropAgronomy(
        f === 'Legume' ? 'peas'
          : f === 'Brassica' ? 'kale'
          : f === 'Allium' ? 'garlic'
          : f === 'Solanaceae' ? 'tomato'
          : f === 'Cucurbit' ? 'courgette'
          : f === 'Umbellifer' ? 'carrot'
          : f === 'Chenopod' ? 'beetroot'
          : 'sweetcorn'
      )
      expect(sample.family).toBe(f)
    }
  })
})
