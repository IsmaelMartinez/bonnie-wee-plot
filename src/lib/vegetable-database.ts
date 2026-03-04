/**
 * Comprehensive vegetable database for the Garden Planner
 * Planting times adjusted for Scotland / Edinburgh climate
 * (Last frost ~late April/early May, first frost ~late September/October)
 *
 * Data is split into per-category files under vegetables/data/.
 * This file re-exports the combined array for backward compatibility.
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'

import { leafyGreens } from '@/lib/vegetables/data/leafy-greens'
import { rootVegetables } from '@/lib/vegetables/data/root-vegetables'
import { brassicas } from '@/lib/vegetables/data/brassicas'
import { legumes } from '@/lib/vegetables/data/legumes'
import { solanaceae } from '@/lib/vegetables/data/solanaceae'
import { cucurbits } from '@/lib/vegetables/data/cucurbits'
import { alliums } from '@/lib/vegetables/data/alliums'
import { herbs } from '@/lib/vegetables/data/herbs'
import { berries } from '@/lib/vegetables/data/berries'
import { fruitTrees } from '@/lib/vegetables/data/fruit-trees'
import { annualFlowers } from '@/lib/vegetables/data/annual-flowers'
import { perennialFlowers } from '@/lib/vegetables/data/perennial-flowers'
import { bulbs } from '@/lib/vegetables/data/bulbs'
import { climbers } from '@/lib/vegetables/data/climbers'
import { greenManures } from '@/lib/vegetables/data/green-manures'
import { mushrooms } from '@/lib/vegetables/data/mushrooms'
import { other } from '@/lib/vegetables/data/other'

export const vegetables: Vegetable[] = [
  ...leafyGreens,
  ...rootVegetables,
  ...brassicas,
  ...legumes,
  ...solanaceae,
  ...cucurbits,
  ...alliums,
  ...herbs,
  ...berries,
  ...fruitTrees,
  ...annualFlowers,
  ...perennialFlowers,
  ...bulbs,
  ...climbers,
  ...greenManures,
  ...mushrooms,
  ...other,
]

// Helper functions for working with vegetable data
export function getVegetableById(id: string): Vegetable | undefined {
  return vegetables.find(v => v.id === id)
}

export function getVegetablesByCategory(category: VegetableCategory): Vegetable[] {
  return vegetables.filter(v => v.category === category)
}

export function searchVegetables(query: string): Vegetable[] {
  const lowerQuery = query.toLowerCase()
  return vegetables.filter(v =>
    v.name.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery)
  )
}

export function getVegetablesForMonth(month: number, type: 'sow' | 'harvest'): Vegetable[] {
  return vegetables.filter(v => {
    if (type === 'sow') {
      return v.planting.sowOutdoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) ||
             v.planting.sowIndoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
    }
    return v.planting.harvestMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
  })
}

export function getAllCategories(): VegetableCategory[] {
  return [...new Set(vegetables.map(v => v.category))]
}

// ============ MAINTENANCE HELPERS ============

export type MaintenanceType = 'prune' | 'feed' | 'mulch'

export interface MaintenanceTask {
  vegetable: Vegetable
  type: MaintenanceType
  notes?: string[]
}

/**
 * Get all vegetables with maintenance tasks for a given month
 */
export function getMaintenanceForMonth(month: number): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = []
  const m = month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

  vegetables.forEach(v => {
    if (!v.maintenance) return

    if (v.maintenance.pruneMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'prune', notes: v.maintenance.notes })
    }
    if (v.maintenance.feedMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'feed', notes: v.maintenance.notes })
    }
    if (v.maintenance.mulchMonths?.includes(m)) {
      tasks.push({ vegetable: v, type: 'mulch', notes: v.maintenance.notes })
    }
  })

  return tasks
}

/**
 * Get all vegetables with any maintenance data (trees, shrubs, perennials)
 */
export function getPerennialsWithMaintenance(): Vegetable[] {
  return vegetables.filter(v => v.maintenance !== undefined)
}
