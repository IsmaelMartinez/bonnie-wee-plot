/**
 * Companion Planting Utilities
 *
 * Centralized logic for companion plant compatibility calculations.
 * Used by AddPlantingForm, PlantingCard, and PlantSelectionDialog.
 */

import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getVegetableById } from '@/lib/vegetable-database'
import { Planting } from '@/types/unified-allotment'

export interface CompanionStatus {
  goods: string[]
  bads: string[]
}

/**
 * Calculate companion status for a vegetable relative to existing plantings
 */
export function getCompanionStatusForVegetable(
  vegetableId: string,
  existingPlantings: Planting[]
): CompanionStatus {
  const goods: string[] = []
  const bads: string[] = []

  for (const existing of existingPlantings) {
    const compat = checkCompanionCompatibility(vegetableId, existing.vegetableId)
    const existingVeg = getVegetableById(existing.vegetableId)
    if (compat === 'good' && existingVeg) goods.push(existingVeg.name)
    if (compat === 'bad' && existingVeg) bads.push(existingVeg.name)
  }

  return { goods, bads }
}

/**
 * Calculate companion status for a planting relative to other plantings in the same bed
 */
export function getCompanionStatusForPlanting(
  planting: Planting,
  otherPlantings: Planting[]
): CompanionStatus {
  const goods: string[] = []
  const bads: string[] = []

  for (const other of otherPlantings) {
    if (other.id === planting.id) continue
    const compat = checkCompanionCompatibility(planting.vegetableId, other.vegetableId)
    const otherVeg = getVegetableById(other.vegetableId)
    if (compat === 'good' && otherVeg) goods.push(otherVeg.name)
    if (compat === 'bad' && otherVeg) bads.push(otherVeg.name)
  }

  return { goods, bads }
}

/**
 * Get list of vegetables that are good companions for existing plantings
 * Useful for sorting/filtering vegetable selection dropdowns
 */
export function getGoodCompanionsForBed(
  existingPlantings: Planting[],
  allVegetableIds: string[]
): string[] {
  if (existingPlantings.length === 0) return []

  return allVegetableIds.filter(vegId => {
    const status = getCompanionStatusForVegetable(vegId, existingPlantings)
    return status.goods.length > 0 && status.bads.length === 0
  })
}

/**
 * Sort vegetables by companion compatibility (good companions first, bad last)
 */
export function sortByCompanionCompatibility(
  vegetableIds: string[],
  existingPlantings: Planting[]
): string[] {
  if (existingPlantings.length === 0) return vegetableIds

  return [...vegetableIds].sort((a, b) => {
    const statusA = getCompanionStatusForVegetable(a, existingPlantings)
    const statusB = getCompanionStatusForVegetable(b, existingPlantings)

    // Score: positive for good companions, negative for bad
    const scoreA = statusA.goods.length - statusA.bads.length * 2
    const scoreB = statusB.goods.length - statusB.bads.length * 2

    return scoreB - scoreA // Higher score first
  })
}

/**
 * Calculate companion status using just vegetable IDs (simpler than Planting[])
 * Returns status with 'good' | 'neutral' | 'bad' classification
 */
export function getCompanionStatusByIds(
  vegetableId: string,
  plantedVegetableIds: string[]
): { status: 'good' | 'neutral' | 'bad'; goodWith: string[]; badWith: string[] } {
  const goodWith: string[] = []
  const badWith: string[] = []

  for (const plantedId of plantedVegetableIds) {
    const compat = checkCompanionCompatibility(vegetableId, plantedId)
    const plantedVeg = getVegetableById(plantedId)
    if (compat === 'good' && plantedVeg) goodWith.push(plantedVeg.name)
    if (compat === 'bad' && plantedVeg) badWith.push(plantedVeg.name)
  }

  const status = badWith.length > 0 ? 'bad' : goodWith.length > 0 ? 'good' : 'neutral'
  return { status, goodWith, badWith }
}
