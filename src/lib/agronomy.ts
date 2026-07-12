/**
 * Crop agronomy reference data (Season Observer).
 *
 * This is the deterministic backbone the end-of-season report reasons over.
 * It answers "what should this crop have needed?" so the rules engine can
 * compare it against what the plot actually gave (logged dates + backfilled
 * weather). Numbers come from common UK gardening guidance (RHS, Garden
 * Organic) and the build brief's starting table — starting values, refined
 * per plot over multiple seasons.
 *
 * Design mirrors `sowing-thresholds.ts`: a small, well-tested lookup keyed by
 * the vegetable database's plant id, with sensible per-family defaults so a
 * crop with no explicit entry still resolves to usable numbers. Nothing here
 * touches storage or the network — it is pure data + pure functions, so the
 * report's numbers are traceable and testable.
 *
 * GDD base temperature: the temperature below which the crop makes no growth,
 * used to accumulate Growing Degree Days from the sow/transplant date.
 * Min soil temp: the 0-7cm soil temperature below which outdoor germination
 * stalls or chilling damage sets in.
 */

import type { VegetableCategory } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

/**
 * Rotation family, as used by the Season Observer's rotation planning and
 * agronomy defaults. This is the brief's family list (which is finer-grained
 * than the app's `RotationGroup` — it splits roots into Umbellifer/Chenopod).
 */
export type RotationFamily =
  | 'Legume'
  | 'Brassica'
  | 'Allium'
  | 'Solanaceae'
  | 'Cucurbit'
  | 'Umbellifer'
  | 'Chenopod'
  | 'Other'

/**
 * Resolved agronomy for a single crop. All temperatures in °C, all durations
 * in days. `heatStressTempC` is undefined for crops that don't bolt/suffer in
 * UK heat.
 */
export interface CropAgronomy {
  plantId: string
  family: RotationFamily
  /** GDD base temperature (°C) — no growth below this. */
  gddBaseTempC: number
  /** Minimum 0-7cm soil temperature (°C) for reliable outdoor germination. */
  minSoilTempGerminationC: number
  /** Typical days from sowing to visible germination in good conditions. */
  typicalDaysToGerminate: number
  /** Typical days from sowing/planting to first harvest. */
  typicalDaysToMaturity: number
  /** Hard frost (Tmin ≤ 0°C) survivable by the growing crop. */
  frostTolerant: boolean
  /** Daytime max (°C) above which the crop suffers heat/bolting stress. */
  heatStressTempC?: number
}

interface FamilyDefaults {
  gddBaseTempC: number
  minSoilTempGerminationC: number
  typicalDaysToGerminate: number
  typicalDaysToMaturity: number
  frostTolerant: boolean
  heatStressTempC?: number
}

/**
 * Per-family fallback agronomy. Used when a crop has no explicit override so
 * that every crop resolves to a usable (if approximate) set of numbers.
 */
const FAMILY_DEFAULTS: Readonly<Record<RotationFamily, FamilyDefaults>> = {
  Legume: { gddBaseTempC: 5, minSoilTempGerminationC: 8, typicalDaysToGerminate: 10, typicalDaysToMaturity: 75, frostTolerant: false },
  Brassica: { gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 90, frostTolerant: true },
  Allium: { gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 12, typicalDaysToMaturity: 120, frostTolerant: true },
  Solanaceae: { gddBaseTempC: 10, minSoilTempGerminationC: 12, typicalDaysToGerminate: 10, typicalDaysToMaturity: 100, frostTolerant: false, heatStressTempC: 30 },
  Cucurbit: { gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 7, typicalDaysToMaturity: 60, frostTolerant: false },
  Umbellifer: { gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 14, typicalDaysToMaturity: 80, frostTolerant: true },
  Chenopod: { gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 10, typicalDaysToMaturity: 60, frostTolerant: true, heatStressTempC: 24 },
  Other: { gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 10, typicalDaysToMaturity: 70, frostTolerant: false },
}

/**
 * Map the vegetable database's category to a rotation family. This gives every
 * crop a family (and therefore default agronomy) without an explicit entry.
 * Categories that don't map cleanly (herbs, flowers, trees, mushrooms) fall
 * through to 'Other' — the Season Observer focuses on annual veg beds.
 */
const CATEGORY_TO_FAMILY: Readonly<Partial<Record<VegetableCategory, RotationFamily>>> = {
  legumes: 'Legume',
  brassicas: 'Brassica',
  alliums: 'Allium',
  solanaceae: 'Solanaceae',
  cucurbits: 'Cucurbit',
}

/**
 * Per-crop overrides. Keys are vegetable database plant ids. Only fields that
 * differ from the family default need to be listed — the rest inherit. These
 * carry the brief's starting table plus the plot's core crops.
 */
const CROP_OVERRIDES: Readonly<Record<string, Partial<FamilyDefaults> & { family: RotationFamily }>> = {
  // Legumes
  'broad-beans': { family: 'Legume', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 14, typicalDaysToMaturity: 90, frostTolerant: true },
  'winter-field-beans': { family: 'Legume', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 14, typicalDaysToMaturity: 200, frostTolerant: true },
  peas: { family: 'Legume', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 10, typicalDaysToMaturity: 70, frostTolerant: true },
  'sugar-snap-peas': { family: 'Legume', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 10, typicalDaysToMaturity: 70, frostTolerant: true },
  mangetout: { family: 'Legume', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 10, typicalDaysToMaturity: 65, frostTolerant: true },
  'french-beans': { family: 'Legume', gddBaseTempC: 10, minSoilTempGerminationC: 12, typicalDaysToGerminate: 8, typicalDaysToMaturity: 60, frostTolerant: false },
  'climbing-french-beans': { family: 'Legume', gddBaseTempC: 10, minSoilTempGerminationC: 12, typicalDaysToGerminate: 8, typicalDaysToMaturity: 65, frostTolerant: false },
  'borlotti-beans': { family: 'Legume', gddBaseTempC: 10, minSoilTempGerminationC: 12, typicalDaysToGerminate: 8, typicalDaysToMaturity: 80, frostTolerant: false },
  'runner-beans': { family: 'Legume', gddBaseTempC: 10, minSoilTempGerminationC: 12, typicalDaysToGerminate: 8, typicalDaysToMaturity: 70, frostTolerant: false },

  // Cucurbits
  courgette: { family: 'Cucurbit', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 7, typicalDaysToMaturity: 55, frostTolerant: false },
  squash: { family: 'Cucurbit', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 7, typicalDaysToMaturity: 100, frostTolerant: false },
  pumpkin: { family: 'Cucurbit', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 7, typicalDaysToMaturity: 110, frostTolerant: false },
  'butternut-squash': { family: 'Cucurbit', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 7, typicalDaysToMaturity: 110, frostTolerant: false },

  // Other / Poaceae
  sweetcorn: { family: 'Other', gddBaseTempC: 10, minSoilTempGerminationC: 13, typicalDaysToGerminate: 10, typicalDaysToMaturity: 90, frostTolerant: false },

  // Solanaceae
  tomato: { family: 'Solanaceae', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 8, typicalDaysToMaturity: 100, frostTolerant: false, heatStressTempC: 30 },
  'cherry-tomato': { family: 'Solanaceae', gddBaseTempC: 10, minSoilTempGerminationC: 15, typicalDaysToGerminate: 8, typicalDaysToMaturity: 90, frostTolerant: false, heatStressTempC: 30 },
  potato: { family: 'Solanaceae', gddBaseTempC: 7, minSoilTempGerminationC: 8, typicalDaysToGerminate: 18, typicalDaysToMaturity: 100, frostTolerant: false },
  'early-potato': { family: 'Solanaceae', gddBaseTempC: 7, minSoilTempGerminationC: 8, typicalDaysToGerminate: 18, typicalDaysToMaturity: 75, frostTolerant: false },
  'maincrop-potato': { family: 'Solanaceae', gddBaseTempC: 7, minSoilTempGerminationC: 8, typicalDaysToGerminate: 18, typicalDaysToMaturity: 130, frostTolerant: false },

  // Umbellifer
  carrot: { family: 'Umbellifer', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 16, typicalDaysToMaturity: 80, frostTolerant: true },
  parsnip: { family: 'Umbellifer', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 21, typicalDaysToMaturity: 160, frostTolerant: true },

  // Chenopod
  beetroot: { family: 'Chenopod', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 12, typicalDaysToMaturity: 70, frostTolerant: true },
  chard: { family: 'Chenopod', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 12, typicalDaysToMaturity: 60, frostTolerant: true, heatStressTempC: 26 },
  spinach: { family: 'Chenopod', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 10, typicalDaysToMaturity: 45, frostTolerant: true, heatStressTempC: 24 },
  'perpetual-spinach': { family: 'Chenopod', gddBaseTempC: 5, minSoilTempGerminationC: 5, typicalDaysToGerminate: 12, typicalDaysToMaturity: 55, frostTolerant: true, heatStressTempC: 26 },

  // Other leafy
  lettuce: { family: 'Other', gddBaseTempC: 4, minSoilTempGerminationC: 4, typicalDaysToGerminate: 8, typicalDaysToMaturity: 60, frostTolerant: false, heatStressTempC: 24 },

  // Brassicas (kale/sprouts live under leafy-greens in the DB, so declare family here)
  cabbage: { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 120, frostTolerant: true },
  kale: { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 90, frostTolerant: true },
  'brussels-sprouts': { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 180, frostTolerant: true },
  broccoli: { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 100, frostTolerant: true },
  'purple-sprouting-broccoli': { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 220, frostTolerant: true },
  cauliflower: { family: 'Brassica', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 8, typicalDaysToMaturity: 100, frostTolerant: true },

  // Alliums
  onion: { family: 'Allium', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 12, typicalDaysToMaturity: 150, frostTolerant: true },
  leek: { family: 'Allium', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 14, typicalDaysToMaturity: 150, frostTolerant: true },
  garlic: { family: 'Allium', gddBaseTempC: 5, minSoilTempGerminationC: 7, typicalDaysToGerminate: 14, typicalDaysToMaturity: 240, frostTolerant: true },
}

/**
 * Resolve the rotation family for a plant id. Prefers an explicit override,
 * then the crop's database category, then 'Other'.
 */
export function getRotationFamily(plantId: string): RotationFamily {
  const override = CROP_OVERRIDES[plantId]
  if (override?.family) return override.family
  const veg = getVegetableById(plantId)
  if (veg) {
    const mapped = CATEGORY_TO_FAMILY[veg.category]
    if (mapped) return mapped
  }
  return 'Other'
}

/**
 * Resolve full agronomy for a crop by plant id. Always returns a value:
 * family defaults fill any gap so the rules engine never has to null-check.
 * When the vegetable database carries a daysToHarvest range, its midpoint
 * overrides the family default for maturity (the database is Scotland-tuned).
 */
export function getCropAgronomy(plantId: string): CropAgronomy {
  const family = getRotationFamily(plantId)
  const base = FAMILY_DEFAULTS[family]
  const override = CROP_OVERRIDES[plantId]

  // Prefer the Scotland-tuned database maturity when no explicit override.
  let typicalDaysToMaturity = override?.typicalDaysToMaturity ?? base.typicalDaysToMaturity
  if (override?.typicalDaysToMaturity === undefined) {
    const veg = getVegetableById(plantId)
    const range = veg?.planting?.daysToHarvest
    if (range && typeof range.min === 'number' && typeof range.max === 'number') {
      typicalDaysToMaturity = Math.round((range.min + range.max) / 2)
    }
  }

  return {
    plantId,
    family,
    gddBaseTempC: override?.gddBaseTempC ?? base.gddBaseTempC,
    minSoilTempGerminationC: override?.minSoilTempGerminationC ?? base.minSoilTempGerminationC,
    typicalDaysToGerminate: override?.typicalDaysToGerminate ?? base.typicalDaysToGerminate,
    typicalDaysToMaturity,
    frostTolerant: override?.frostTolerant ?? base.frostTolerant,
    heatStressTempC: override?.heatStressTempC ?? base.heatStressTempC,
  }
}

/** True when we hold explicit (non-defaulted) agronomy for this crop. */
export function hasExplicitAgronomy(plantId: string): boolean {
  return plantId in CROP_OVERRIDES
}
