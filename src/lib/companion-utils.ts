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
  plantId: string,
  existingPlantings: Planting[]
): CompanionStatus {
  const goods: string[] = []
  const bads: string[] = []

  for (const existing of existingPlantings) {
    const compat = checkCompanionCompatibility(plantId, existing.plantId)
    const existingVeg = getVegetableById(existing.plantId)
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
    const compat = checkCompanionCompatibility(planting.plantId, other.plantId)
    const otherVeg = getVegetableById(other.plantId)
    if (compat === 'good' && otherVeg) goods.push(otherVeg.name)
    if (compat === 'bad' && otherVeg) bads.push(otherVeg.name)
  }

  return { goods, bads }
}

/**
 * Calculate companion status using just vegetable IDs (simpler than Planting[])
 * Returns status with 'good' | 'neutral' | 'bad' classification
 */
export function getCompanionStatusByIds(
  plantId: string,
  plantedVegetableIds: string[]
): { status: 'good' | 'neutral' | 'bad'; goodWith: string[]; badWith: string[] } {
  const goodWith: string[] = []
  const badWith: string[] = []

  for (const plantedId of plantedVegetableIds) {
    const compat = checkCompanionCompatibility(plantId, plantedId)
    const plantedVeg = getVegetableById(plantedId)
    if (compat === 'good' && plantedVeg) goodWith.push(plantedVeg.name)
    if (compat === 'bad' && plantedVeg) badWith.push(plantedVeg.name)
  }

  const status = badWith.length > 0 ? 'bad' : goodWith.length > 0 ? 'good' : 'neutral'
  return { status, goodWith, badWith }
}
