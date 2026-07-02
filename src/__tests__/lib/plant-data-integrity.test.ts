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

  describe('Storage data (Milestone C)', () => {
    const VALID_METHODS = new Set([
      'fresh', 'fridge', 'store-cool', 'freeze', 'dry', 'cure', 'pickle', 'jam', 'ferment',
    ])

    it('every storage entry has at least one valid method', () => {
      for (const veg of vegetables) {
        if (!veg.storage) continue
        expect(veg.storage.methods.length).toBeGreaterThan(0)
        for (const method of veg.storage.methods) {
          expect(VALID_METHODS.has(method)).toBe(true)
        }
      }
    })

    it('freshDays, when set, is a positive number', () => {
      for (const veg of vegetables) {
        const freshDays = veg.storage?.freshDays
        if (freshDays === undefined) continue
        expect(freshDays).toBeGreaterThan(0)
      }
    })

    it('populates staple keeper and glut crops with storage data', () => {
      const expected = [
        // Headline glut crops populated in the original Milestone C pass
        'courgette', 'runner-beans', 'cherry-tomato', 'apple-tree', 'rhubarb', 'onion',
        // All staple keepers / glut crops added in the storage QA pass
        'leek', 'shallot',
        'swede', 'turnip', 'cauliflower', 'broccoli', 'purple-sprouting-broccoli',
        'brussels-sprouts', 'savoy-cabbage',
        'parsnip', 'celeriac',
        'sweetcorn', 'jerusalem-artichoke',
        'gooseberry', 'redcurrant', 'blueberry',
        'pear-tree', 'cherry-tree', 'damson-tree', 'greengage-tree',
        'patty-pan-squash', 'spaghetti-squash', 'acorn-squash',
        'blight-resistant-tomato',
        'kale', 'cavolo-nero', 'chard', 'spinach',
        'borlotti-beans', 'black-turtle-beans', 'edamame', 'mangetout', 'sugar-snap-peas',
      ]
      for (const id of expected) {
        expect(getVegetableById(id)?.storage).toBeDefined()
      }
    })
  })

  describe('Care tips (perennial advice)', () => {
    // Enum members of CareTipCategory (src/types/garden-planner.ts).
    const VALID_CATEGORIES = new Set(['care', 'harvest', 'propagate', 'protect', 'plant'])
    // Lifecycle stages that calculatePerennialStatus() can actually return and
    // that generateCareTipTasks() can match against. 'removed' is a stored
    // PrimaryPlant status, never a computed lifecycle stage, so a care tip
    // tagged with it would be dead data — exclude it from the valid set.
    const VALID_STAGES = new Set(['establishing', 'productive', 'declining'])

    it('every care tip has non-empty integer months in range 1-12', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!veg.careTips) continue
        veg.careTips.forEach((tip, i) => {
          if (!Array.isArray(tip.months) || tip.months.length === 0) {
            offenders.push(`${veg.id}[${i}]: empty months`)
            return
          }
          for (const m of tip.months) {
            if (!Number.isInteger(m) || m < 1 || m > 12) {
              offenders.push(`${veg.id}[${i}]: invalid month ${m}`)
            }
          }
        })
      }
      expect(offenders).toEqual([])
    })

    it('every care tip has a valid category', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!veg.careTips) continue
        veg.careTips.forEach((tip, i) => {
          if (!VALID_CATEGORIES.has(tip.category)) {
            offenders.push(`${veg.id}[${i}]: category "${tip.category}"`)
          }
        })
      }
      expect(offenders).toEqual([])
    })

    it('every care tip stage, when set, is a valid lifecycle stage', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!veg.careTips) continue
        veg.careTips.forEach((tip, i) => {
          if (tip.stage !== undefined && !VALID_STAGES.has(tip.stage)) {
            offenders.push(`${veg.id}[${i}]: stage "${tip.stage}"`)
          }
        })
      }
      expect(offenders).toEqual([])
    })

    it('stage-tagged tips only appear on plants with perennialInfo', () => {
      // generateCareTipTasks() can only resolve a lifecycle stage when the
      // plant has perennialInfo; a stage on any other plant never fires and is
      // therefore dead data.
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!veg.careTips) continue
        const hasStage = veg.careTips.some(tip => tip.stage !== undefined)
        if (hasStage && !veg.perennialInfo) {
          offenders.push(veg.id)
        }
      }
      expect(offenders).toEqual([])
    })

    it('no duplicate tip strings within a single plant', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!veg.careTips) continue
        const tips = veg.careTips.map(t => t.tip)
        const seen = new Set<string>()
        for (const t of tips) {
          if (seen.has(t)) offenders.push(`${veg.id}: "${t}"`)
          seen.add(t)
        }
      }
      expect(offenders).toEqual([])
    })
  })

  describe('Pruning-season consistency', () => {
    const inSeason = (month: number, season: 'winter' | 'spring' | 'summer' | 'autumn'): boolean => {
      switch (season) {
        case 'winter': return month === 12 || month === 1 || month === 2
        case 'spring': return month >= 3 && month <= 5
        case 'summer': return month >= 6 && month <= 8
        case 'autumn': return month >= 9 && month <= 11
      }
    }
    const seasonsOf = (months: number[]): Set<string> => {
      const seasons = new Set<string>()
      for (const m of months) {
        for (const s of ['winter', 'spring', 'summer', 'autumn'] as const) {
          if (inSeason(m, s)) seasons.add(s)
        }
      }
      return seasons
    }
    const mentionsPruning = (tip: string): boolean => /prune|pruning/i.test(tip)

    // Prunus stone fruit — cherry, plum, damson, greengage (and any future
    // Prunus). These must be summer-pruned to avoid silver leaf; winter cuts
    // are the unsafe case. Damson lacks a botanicalName, so match by id too.
    const STONE_FRUIT_IDS = new Set(['cherry-tree', 'plum-tree', 'damson-tree', 'greengage-tree'])
    const isStoneFruit = (veg: { id: string; botanicalName?: string }): boolean =>
      STONE_FRUIT_IDS.has(veg.id) || (veg.botanicalName?.startsWith('Prunus') ?? false)

    // The stone-fruit "unsafe to prune" window is deliberately WIDER than
    // meteorological winter: silver-leaf spores are airborne from autumn into
    // spring, so the safe rule is summer-only and an autumn cut already carries
    // risk. It is derived from the shared season helper (Dec-Feb) plus November
    // so the two definitions cannot silently drift where they agree.
    const isStoneFruitUnsafePruneMonth = (m: number): boolean => inSeason(m, 'winter') || m === 11

    it('stone fruit (Prunus) are never scheduled to prune in winter (Nov-Feb)', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        if (!isStoneFruit(veg)) continue
        const pruneMonths = veg.maintenance?.pruneMonths ?? []
        const unsafePrune = pruneMonths.filter(isStoneFruitUnsafePruneMonth)
        if (unsafePrune.length > 0) {
          offenders.push(`${veg.id}: pruneMonths include winter ${JSON.stringify(unsafePrune)}`)
        }
        // The prune-mentioning care tips must agree with the summer rule.
        for (const tip of veg.careTips ?? []) {
          if (!mentionsPruning(tip.tip)) continue
          const unsafeTip = tip.months.filter(isStoneFruitUnsafePruneMonth)
          if (unsafeTip.length > 0) {
            offenders.push(`${veg.id}: prune tip months include winter ${JSON.stringify(unsafeTip)}`)
          }
        }
      }
      expect(offenders).toEqual([])
    })

    it('maintenance.pruneMonths agree with prune-mentioning care tips', () => {
      // A perennial that lists both a prune schedule and prune advice should
      // not put them in contradictory seasons. This is an ENDORSEMENT check,
      // not a strict match: it passes as long as at least one prune tip shares
      // a season with the schedule. That deliberately tolerates plants pruned
      // in more than one season (e.g. gooseberry: winter framework + summer
      // sideshoots) rather than false-flagging them; the cost is that a stray
      // extra prune tip in a wrong season is not caught here. The stricter
      // summer-only rule that matters most — stone fruit — is enforced by the
      // test above, which flags any unsafe-window prune tip outright.
      const offenders: string[] = []
      for (const veg of vegetables) {
        const pruneMonths = veg.maintenance?.pruneMonths ?? []
        if (pruneMonths.length === 0) continue
        const pruneTips = (veg.careTips ?? []).filter(t => mentionsPruning(t.tip))
        if (pruneTips.length === 0) continue

        const scheduleSeasons = seasonsOf(pruneMonths)
        const tipSeasons = seasonsOf(pruneTips.flatMap(t => t.months))
        const overlap = [...scheduleSeasons].some(s => tipSeasons.has(s))
        if (!overlap) {
          offenders.push(
            `${veg.id}: pruneMonths ${JSON.stringify([...scheduleSeasons])} vs prune tips ${JSON.stringify([...tipSeasons])}`
          )
        }
      }
      expect(offenders).toEqual([])
    })
  })

  describe('Maintenance schedules', () => {
    it('every maintenance month array is non-empty with valid months in range 1-12', () => {
      // The Month type constrains these at compile time, but a hand-authored
      // empty array (a meaningless schedule) or a value slipped in via a cast
      // would pass the compiler. This mirrors the care-tip months check and
      // guards the pruneMonths the pruning-season tests depend on.
      const offenders: string[] = []
      const check = (months: number[] | undefined, veg: { id: string }, field: string) => {
        if (months === undefined) return
        if (months.length === 0) {
          offenders.push(`${veg.id}.maintenance.${field}: empty array`)
          return
        }
        for (const m of months) {
          if (!Number.isInteger(m) || m < 1 || m > 12) {
            offenders.push(`${veg.id}.maintenance.${field}: invalid month ${m}`)
          }
        }
      }
      for (const veg of vegetables) {
        if (!veg.maintenance) continue
        check(veg.maintenance.pruneMonths, veg, 'pruneMonths')
        check(veg.maintenance.feedMonths, veg, 'feedMonths')
        check(veg.maintenance.mulchMonths, veg, 'mulchMonths')
      }
      expect(offenders).toEqual([])
    })
  })

  describe('Feed & water cadence', () => {
    it('feedFrequencyDays, when set, is a positive number', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        const days = veg.maintenance?.feedFrequencyDays
        if (days === undefined) continue
        if (!Number.isFinite(days) || days <= 0) {
          offenders.push(`${veg.id}: feedFrequencyDays ${days}`)
        }
      }
      expect(offenders).toEqual([])
    })

    it('waterFrequencyDays, when set, is a positive number', () => {
      const offenders: string[] = []
      for (const veg of vegetables) {
        const days = veg.maintenance?.waterFrequencyDays
        if (days === undefined) continue
        if (!Number.isFinite(days) || days <= 0) {
          offenders.push(`${veg.id}: waterFrequencyDays ${days}`)
        }
      }
      expect(offenders).toEqual([])
    })

    it('a feedType is paired with a feed schedule (and vice versa)', () => {
      // feedType names the fertiliser the feed task note surfaces; it is only
      // ever shown by a feed reminder, which the task generator emits from a
      // schedule (feedMonths or feedFrequencyDays). A feedType with no schedule
      // never reaches the user, and a feed schedule with no feedType drops the
      // "what to feed" detail — so the two travel together.
      const offenders: string[] = []
      for (const veg of vegetables) {
        const m = veg.maintenance
        if (!m) continue
        const hasSchedule =
          (m.feedMonths?.length ?? 0) > 0 ||
          (m.feedFrequencyDays !== undefined && m.feedFrequencyDays > 0)
        const hasType = m.feedType !== undefined
        if (hasType && !hasSchedule) {
          offenders.push(`${veg.id}: feedType "${m.feedType}" with no feed schedule`)
        }
        if (hasSchedule && !hasType) {
          offenders.push(`${veg.id}: feed schedule with no feedType`)
        }
      }
      expect(offenders).toEqual([])
    })
  })

  describe('Perennial lifecycle info', () => {
    it('yearsToFirstHarvest / productiveYears have positive min <= max', () => {
      const offenders: string[] = []
      const check = (
        range: { min: number; max: number } | undefined,
        veg: { id: string },
        field: string
      ) => {
        if (range === undefined) return
        if (!Number.isFinite(range.min) || range.min <= 0) {
          offenders.push(`${veg.id}.perennialInfo.${field}: min ${range.min}`)
        }
        if (!Number.isFinite(range.max) || range.max <= 0) {
          offenders.push(`${veg.id}.perennialInfo.${field}: max ${range.max}`)
        }
        if (Number.isFinite(range.min) && Number.isFinite(range.max) && range.min > range.max) {
          offenders.push(`${veg.id}.perennialInfo.${field}: min ${range.min} > max ${range.max}`)
        }
      }
      for (const veg of vegetables) {
        if (!veg.perennialInfo) continue
        check(veg.perennialInfo.yearsToFirstHarvest, veg, 'yearsToFirstHarvest')
        check(veg.perennialInfo.productiveYears, veg, 'productiveYears')
      }
      expect(offenders).toEqual([])
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
