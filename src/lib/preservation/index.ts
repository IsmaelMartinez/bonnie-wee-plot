/**
 * Preserving guides — aggregated data and lookups
 *
 * Rich per-crop preservation guidance (how-tos, storage life, free online
 * resources, recipe ideas) for the /preserving section. Data is authored in
 * per-category files under ./data so categories can be filled independently.
 *
 * This module is imported by the /preserving route and by the statically
 * rendered /plants/[id] pages (server-side only, to decide whether to show
 * the cross-link), so the dataset stays out of every other client bundle.
 */

import { StorageMethod } from '@/types/garden-planner'
import { PreservationGuide } from '@/types/preservation'
import { leafyGreensPreservation } from './data/leafy-greens'
import { rootVegetablesPreservation } from './data/root-vegetables'
import { brassicasPreservation } from './data/brassicas'
import { legumesPreservation } from './data/legumes'
import { solanaceaePreservation } from './data/solanaceae'
import { cucurbitsPreservation } from './data/cucurbits'
import { alliumsPreservation } from './data/alliums'
import { herbsPreservation } from './data/herbs'
import { berriesPreservation } from './data/berries'
import { fruitTreesPreservation } from './data/fruit-trees'
import { otherPreservation } from './data/other'
import { mushroomsPreservation } from './data/mushrooms'
import { edibleExtrasPreservation } from './data/edible-extras'

export const preservationGuides: PreservationGuide[] = [
  ...leafyGreensPreservation,
  ...rootVegetablesPreservation,
  ...brassicasPreservation,
  ...legumesPreservation,
  ...solanaceaePreservation,
  ...cucurbitsPreservation,
  ...alliumsPreservation,
  ...herbsPreservation,
  ...berriesPreservation,
  ...fruitTreesPreservation,
  ...otherPreservation,
  ...mushroomsPreservation,
  ...edibleExtrasPreservation,
]

const guideById = new Map(preservationGuides.map(g => [g.plantId, g]))

export function getPreservationGuide(plantId: string): PreservationGuide | undefined {
  return guideById.get(plantId)
}

/** Human labels for each preservation method, shared across the UI */
export const PRESERVATION_METHOD_LABELS: Record<StorageMethod, string> = {
  fresh: 'Best fresh',
  fridge: 'Fridge',
  'store-cool': 'Store cool',
  freeze: 'Freeze',
  dry: 'Dry',
  cure: 'Cure first',
  pickle: 'Pickle',
  jam: 'Jam / chutney',
  ferment: 'Ferment',
}

/** Methods that appear in at least one authored guide, in label order */
export function getMethodsInUse(): StorageMethod[] {
  const inUse = new Set(preservationGuides.flatMap(g => g.methods.map(m => m.method)))
  return (Object.keys(PRESERVATION_METHOD_LABELS) as StorageMethod[]).filter(m => inUse.has(m))
}
