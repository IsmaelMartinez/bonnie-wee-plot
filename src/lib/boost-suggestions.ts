/**
 * "Boost this bed" — companion suggestions for the plantings in an area.
 *
 * Walks the current plantings, dedupes their `enhancedCompanions`, ranks the
 * results by confidence and seed availability, and returns up to `limit`
 * suggestions with mechanism-derived "why" copy.
 *
 * Pure / synchronous — relies on the bundled vegetable database.
 */

import type {
  CompanionConfidence,
  CompanionMechanism,
  EnhancedCompanion,
} from '@/types/garden-planner'
import type { Planting, StoredVariety } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'

export interface BoostSuggestion {
  plantId: string
  plantName: string
  reason: string
  confidence: CompanionConfidence
  hasSeed: boolean
  /** Names of plantings in the bed that pair well with this suggestion. */
  pairsWith: string[]
}

const CONFIDENCE_RANK: Record<CompanionConfidence, number> = {
  proven: 4,
  likely: 3,
  traditional: 2,
  anecdotal: 1,
}

/**
 * Plain-English copy for each companion mechanism. Falls back to the generic
 * "good companion" line when the mechanism is missing or unknown.
 */
function reasonFor(mechanism: CompanionMechanism | undefined): string {
  switch (mechanism) {
    case 'pest_confusion':
      return 'Confuses pests'
    case 'pest_trap':
      return 'Lures pests away'
    case 'allelopathy':
      return 'Suppresses weeds'
    case 'nitrogen_fixation':
      return 'Fixes nitrogen for the bed'
    case 'physical_support':
      return 'Provides natural support'
    case 'beneficial_attraction':
      return 'Attracts pollinators and predators'
    case 'disease_suppression':
      return 'Reduces disease'
    case 'unknown':
    case undefined:
      return 'Traditional good companion'
    case 'nutrient_competition':
      // Should not appear in companions — only in avoid lists — but be defensive.
      return 'Good companion'
    default:
      return 'Good companion'
  }
}

interface Accumulator {
  companion: EnhancedCompanion
  pairsWith: Set<string>
}

/**
 * Build companion suggestions for a bed.
 *
 * @param plantings  Plantings currently in the bed.
 * @param varieties  All stored varieties (used to flag suggestions where the
 *                   user already has seed for the year).
 * @param year       Year used for seed availability lookup.
 * @param limit      Maximum number of suggestions to return.
 */
export function getBoostSuggestions(
  plantings: Planting[],
  varieties: StoredVariety[],
  year: number,
  limit = 3
): BoostSuggestion[] {
  if (plantings.length === 0) return []

  // Plant IDs already in the bed — never suggest something the user already has.
  const presentIds = new Set(plantings.map((p) => p.plantId))

  // Map of suggestion plantId -> best companion entry plus the names it pairs with.
  const acc = new Map<string, Accumulator>()

  for (const planting of plantings) {
    const veg = getVegetableById(planting.plantId)
    if (!veg) continue
    const sourceName = veg.name

    for (const companion of veg.enhancedCompanions ?? []) {
      if (presentIds.has(companion.plantId)) continue

      const existing = acc.get(companion.plantId)
      if (!existing) {
        acc.set(companion.plantId, {
          companion,
          pairsWith: new Set([sourceName]),
        })
      } else {
        existing.pairsWith.add(sourceName)
        // Keep the higher-confidence record so the displayed reason is the
        // strongest known pairing.
        if (CONFIDENCE_RANK[companion.confidence] > CONFIDENCE_RANK[existing.companion.confidence]) {
          existing.companion = companion
        }
      }
    }
  }

  // Build seed-availability lookup once. A variety counts as "have seed" when
  // its seedsByYear entry for the year is 'have'.
  const haveSeedFor = new Set<string>()
  for (const variety of varieties) {
    if (variety.isArchived) continue
    if (variety.seedsByYear?.[year] === 'have') {
      haveSeedFor.add(variety.plantId)
    }
  }

  const suggestions: BoostSuggestion[] = []
  for (const [plantId, entry] of acc) {
    const veg = getVegetableById(plantId)
    if (!veg) continue
    suggestions.push({
      plantId,
      plantName: veg.name,
      reason: reasonFor(entry.companion.mechanism),
      confidence: entry.companion.confidence,
      hasSeed: haveSeedFor.has(plantId),
      pairsWith: Array.from(entry.pairsWith),
    })
  }

  // Rank: seeds-on-hand first, then by confidence, then by name for stability.
  suggestions.sort((a, b) => {
    if (a.hasSeed !== b.hasSeed) return a.hasSeed ? -1 : 1
    const confDelta = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
    if (confDelta !== 0) return confDelta
    return a.plantName.localeCompare(b.plantName)
  })

  return suggestions.slice(0, limit)
}
