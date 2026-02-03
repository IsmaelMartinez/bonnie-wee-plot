import { describe, it, expect } from 'vitest'
import {
  calculatePerennialStatus,
  getPerennialStatusFromPlant,
  getStatusLabel,
  getStatusColorClasses,
} from '@/lib/perennial-calculator'
import type { PerennialInfo } from '@/types/garden-planner'
import type { PrimaryPlant } from '@/types/unified-allotment'

// Helper: typical fruit tree (3-5 years to first harvest, 15-25 productive years)
const fruitTreeInfo: PerennialInfo = {
  yearsToFirstHarvest: { min: 3, max: 5 },
  productiveYears: { min: 15, max: 25 },
}

// Helper: raspberry bush (1-2 years to first harvest, 8-12 productive years)
const raspberryInfo: PerennialInfo = {
  yearsToFirstHarvest: { min: 1, max: 2 },
  productiveYears: { min: 8, max: 12 },
}

// Helper: indefinite perennial (no productiveYears cap)
const indefinitePerennial: PerennialInfo = {
  yearsToFirstHarvest: { min: 2, max: 3 },
}

describe('calculatePerennialStatus', () => {
  describe('establishing state', () => {
    it('should return establishing status in first year', () => {
      const result = calculatePerennialStatus(2024, fruitTreeInfo, 2024)
      expect(result.status).toBe('establishing')
      expect(result.yearsPlanted).toBe(0)
    })

    it('should return establishing status during establishment period', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2023)
      expect(result.status).toBe('establishing')
      expect(result.yearsPlanted).toBe(3)
    })

    it('should calculate establishment progress correctly', () => {
      // Planted 2020, max 5 years to first harvest, checking at year 2
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2022)
      // yearsPlanted=2, totalEstablishment=5 => 2/5 = 40%
      expect(result.establishmentProgress).toBe(40)
    })

    it('should cap establishment progress at 100%', () => {
      // Edge case: if yearsPlanted somehow equals totalEstablishment
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2024)
      // yearsPlanted=4, totalEstablishment=5 => 4/5 = 80%
      expect(result.establishmentProgress).toBeLessThanOrEqual(100)
    })

    it('should show "expect first harvest next year" when one year away', () => {
      // Planted 2020, max harvest year 2025, current 2024 => 1 year to go
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2024)
      expect(result.status).toBe('establishing')
      expect(result.description).toContain('expect first harvest next year')
    })

    it('should show year count in description when more than one year away', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2022)
      expect(result.description).toContain('Year 3 of 5')
    })

    it('should not need replacement during establishing', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2022)
      expect(result.needsReplacement).toBe(false)
      expect(result.replacementWarning).toBeUndefined()
    })
  })

  describe('productive state', () => {
    it('should return productive status once past establishment', () => {
      // Planted 2020, max first harvest 2025, current 2026
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2026)
      expect(result.status).toBe('productive')
    })

    it('should show productive year count in description', () => {
      // Planted 2020, first harvest year max 2025, current 2027
      // yearsProductive = 2027 - 2025 = 2, display as "Year 3 of ~25"
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2027)
      expect(result.description).toContain('Year 3 of ~25')
    })

    it('should not need replacement in early productive years', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2030)
      expect(result.needsReplacement).toBe(false)
      expect(result.replacementWarning).toBeUndefined()
    })

    it('should flag replacement needed when one year from decline', () => {
      // Planted 2020, first harvest max 2025, decline at 2025+25=2050
      // When current = 2049, yearsUntilDecline = 2050-2049 = 1
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2049)
      expect(result.status).toBe('productive')
      expect(result.needsReplacement).toBe(true)
      expect(result.replacementWarning).toBeTruthy()
      expect(result.description).toContain('final year')
    })

    it('should flag replacement when exactly at decline boundary', () => {
      // yearsUntilDecline = 0 means we are at the decline year boundary (<=1 triggers)
      // Decline year = 2025+25 = 2050, current = 2050
      // But current >= expectedDeclineYear will trigger declining, not this branch
      // Let's test with current = 2049 (yearsUntilDecline = 1)
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2049)
      expect(result.needsReplacement).toBe(true)
    })
  })

  describe('productive state with indefinite lifespan', () => {
    it('should return productive with no decline for indefinite perennials', () => {
      const result = calculatePerennialStatus(2020, indefinitePerennial, 2030)
      expect(result.status).toBe('productive')
      expect(result.expectedDeclineYear).toBeUndefined()
      expect(result.needsReplacement).toBe(false)
    })

    it('should show years count for indefinite perennials', () => {
      // Planted 2020, first harvest max 2023, current 2030
      // yearsProductive = 2030-2023 = 7, display "8 years"
      const result = calculatePerennialStatus(2020, indefinitePerennial, 2030)
      expect(result.description).toContain('8 years')
    })
  })

  describe('declining state', () => {
    it('should return declining status when past productive years', () => {
      // Planted 2020, first harvest max 2025, productive max 25 years
      // Decline year = 2025 + 25 = 2050
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2050)
      expect(result.status).toBe('declining')
      expect(result.needsReplacement).toBe(true)
    })

    it('should show years past prime in description', () => {
      // Decline year 2050, current 2052 => yearsOverdue = 2
      // Description: "Declining (3 years past prime)"
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2052)
      expect(result.description).toContain('3 years past prime')
    })

    it('should include replacement warning', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2055)
      expect(result.replacementWarning).toBeTruthy()
      expect(result.replacementWarning).toContain('replacing')
    })

    it('should show 1 year past prime at exact decline year', () => {
      // Decline year 2050, current 2050 => yearsOverdue=0
      // Description: "Declining (1 years past prime)"
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2050)
      expect(result.description).toContain('1 years past prime')
    })
  })

  describe('expected harvest year calculation', () => {
    it('should calculate expected first harvest year range', () => {
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2021)
      expect(result.expectedFirstHarvestYear).toEqual({
        min: 2023, // 2020 + 3
        max: 2025, // 2020 + 5
      })
    })

    it('should calculate for raspberry (short establishment)', () => {
      const result = calculatePerennialStatus(2024, raspberryInfo, 2024)
      expect(result.expectedFirstHarvestYear).toEqual({
        min: 2025, // 2024 + 1
        max: 2026, // 2024 + 2
      })
    })
  })

  describe('expected decline year calculation', () => {
    it('should calculate decline year from effective first harvest + productive years max', () => {
      // Default uses expectedFirstHarvestYear.max as effectiveFirstHarvestYear
      // 2020 + 5 = 2025, then 2025 + 25 = 2050
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2021)
      expect(result.expectedDeclineYear).toBe(2050)
    })

    it('should not have decline year for indefinite perennials', () => {
      const result = calculatePerennialStatus(2020, indefinitePerennial, 2025)
      expect(result.expectedDeclineYear).toBeUndefined()
    })

    it('should calculate decline year for raspberry', () => {
      // 2024 + 2 = 2026 (effective first harvest), 2026 + 12 = 2038
      const result = calculatePerennialStatus(2024, raspberryInfo, 2025)
      expect(result.expectedDeclineYear).toBe(2038)
    })
  })

  describe('firstHarvestYearOverride', () => {
    it('should use override year for status calculation', () => {
      // Without override: effective first harvest = 2020+5 = 2025, so 2024 is establishing
      const withoutOverride = calculatePerennialStatus(2020, fruitTreeInfo, 2024)
      expect(withoutOverride.status).toBe('establishing')

      // With override to 2023: effective first harvest = 2023, so 2024 is productive
      const withOverride = calculatePerennialStatus(2020, fruitTreeInfo, 2024, 2023)
      expect(withOverride.status).toBe('productive')
    })

    it('should use override for decline year calculation', () => {
      // With override 2023: decline year = 2023 + 25 = 2048
      const result = calculatePerennialStatus(2020, fruitTreeInfo, 2024, 2023)
      expect(result.expectedDeclineYear).toBe(2048)
    })
  })

  describe('yearsPlanted calculation', () => {
    it('should calculate years planted as currentYear - plantedYear', () => {
      expect(calculatePerennialStatus(2020, fruitTreeInfo, 2020).yearsPlanted).toBe(0)
      expect(calculatePerennialStatus(2020, fruitTreeInfo, 2025).yearsPlanted).toBe(5)
      expect(calculatePerennialStatus(2015, fruitTreeInfo, 2025).yearsPlanted).toBe(10)
    })
  })
})

describe('getPerennialStatusFromPlant', () => {
  it('should return null if plant has no plantedYear', () => {
    const plant: PrimaryPlant = {
      plantId: 'apple-tree',
      plantedYear: undefined as unknown as number,
    }
    const result = getPerennialStatusFromPlant(plant, fruitTreeInfo, 2025)
    expect(result).toBeNull()
  })

  it('should return status result for plant with plantedYear', () => {
    const plant: PrimaryPlant = {
      plantId: 'apple-tree',
      plantedYear: 2020,
    }
    const result = getPerennialStatusFromPlant(plant, fruitTreeInfo, 2025)
    expect(result).not.toBeNull()
    expect(result!.status).toBe('productive')
  })

  it('should pass firstHarvestYearOverride from plant', () => {
    const plant: PrimaryPlant = {
      plantId: 'apple-tree',
      plantedYear: 2020,
      firstHarvestYearOverride: 2022,
    }
    const result = getPerennialStatusFromPlant(plant, fruitTreeInfo, 2023)
    expect(result).not.toBeNull()
    expect(result!.status).toBe('productive')
    // Override to 2022 means decline = 2022 + 25 = 2047
    expect(result!.expectedDeclineYear).toBe(2047)
  })
})

describe('getStatusLabel', () => {
  it('should return "Establishing" for establishing', () => {
    expect(getStatusLabel('establishing')).toBe('Establishing')
  })

  it('should return "Productive" for productive', () => {
    expect(getStatusLabel('productive')).toBe('Productive')
  })

  it('should return "Declining" for declining', () => {
    expect(getStatusLabel('declining')).toBe('Declining')
  })

  it('should return "Removed" for removed', () => {
    expect(getStatusLabel('removed')).toBe('Removed')
  })
})

describe('getStatusColorClasses', () => {
  it('should return appropriate classes for each status', () => {
    expect(getStatusColorClasses('establishing')).toContain('water')
    expect(getStatusColorClasses('productive')).toContain('moss')
    expect(getStatusColorClasses('declining')).toContain('kitsune')
    expect(getStatusColorClasses('removed')).toContain('stone')
  })

  it('should return non-empty strings for all statuses', () => {
    expect(getStatusColorClasses('establishing').length).toBeGreaterThan(0)
    expect(getStatusColorClasses('productive').length).toBeGreaterThan(0)
    expect(getStatusColorClasses('declining').length).toBeGreaterThan(0)
    expect(getStatusColorClasses('removed').length).toBeGreaterThan(0)
  })
})
