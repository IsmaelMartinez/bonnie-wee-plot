/**
 * Companion planting validation logic for the grid planner
 * Checks adjacent cells for compatible/incompatible plant combinations
 * Uses enhancedCompanions/enhancedAvoid arrays for direct ID-based lookups
 */

import { PlotCell, GridPlot, PlacementValidation, PlacementWarning } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

/**
 * Get all adjacent cells (8-way: horizontal, vertical, diagonal)
 */
export function getAdjacentCells(cell: PlotCell, cells: PlotCell[]): PlotCell[] {
  const adjacent: PlotCell[] = []

  for (const c of cells) {
    if (c.id === cell.id) continue

    const rowDiff = Math.abs(c.row - cell.row)
    const colDiff = Math.abs(c.col - cell.col)

    // Adjacent if within 1 cell in any direction
    if (rowDiff <= 1 && colDiff <= 1) {
      adjacent.push(c)
    }
  }

  return adjacent
}

/**
 * Get adjacent cells that have vegetables planted
 */
export function getPlantedAdjacentCells(cell: PlotCell, cells: PlotCell[]): PlotCell[] {
  return getAdjacentCells(cell, cells).filter(c => c.plantId)
}

/**
 * Check compatibility between two vegetables
 * Returns 'good' if companion, 'bad' if avoid, 'neutral' otherwise
 * Uses direct plantId lookups on enhancedCompanions/enhancedAvoid arrays
 */
export function checkCompanionCompatibility(
  vegAId: string,
  vegBId: string
): 'good' | 'neutral' | 'bad' {
  const vegA = getVegetableById(vegAId)
  const vegB = getVegetableById(vegBId)

  if (!vegA || !vegB) return 'neutral'

  // Check if vegA avoids vegB or vice versa (bidirectional check)
  const vegAAvoids = vegA.enhancedAvoid.some(e => e.plantId === vegBId)
  const vegBAvoids = vegB.enhancedAvoid.some(e => e.plantId === vegAId)

  if (vegAAvoids || vegBAvoids) return 'bad'

  // Check if they are companions (bidirectional check)
  const vegACompanion = vegA.enhancedCompanions.some(e => e.plantId === vegBId)
  const vegBCompanion = vegB.enhancedCompanions.some(e => e.plantId === vegAId)

  if (vegACompanion || vegBCompanion) return 'good'

  return 'neutral'
}

/**
 * Validate placement of a vegetable in a target cell
 */
export function validatePlacement(
  plantId: string,
  targetCell: PlotCell,
  plot: GridPlot
): PlacementValidation {
  const warnings: PlacementWarning[] = []
  const suggestions: string[] = []
  let overallCompatibility: 'good' | 'neutral' | 'bad' = 'neutral'

  const vegetable = getVegetableById(plantId)
  if (!vegetable) {
    return {
      isValid: false,
      warnings: [{ type: 'avoid', severity: 'error', message: 'Vegetable not found' }],
      suggestions: [],
      compatibility: 'neutral'
    }
  }

  // Get adjacent planted cells
  const adjacentCells = getPlantedAdjacentCells(targetCell, plot.cells)

  let hasGoodCompanion = false
  let hasBadCompanion = false
  const goodCompanions: string[] = []
  const badCompanions: string[] = []

  for (const adjCell of adjacentCells) {
    if (!adjCell.plantId) continue

    const compatibility = checkCompanionCompatibility(plantId, adjCell.plantId)
    const adjVeg = getVegetableById(adjCell.plantId)
    const adjName = adjVeg?.name || 'Unknown plant'

    if (compatibility === 'bad') {
      hasBadCompanion = true
      badCompanions.push(adjName)
      warnings.push({
        type: 'avoid',
        severity: 'warning',
        message: `${vegetable.name} should not be planted near ${adjName}`,
        conflictingPlant: adjCell.plantId,
        affectedCells: [adjCell.id]
      })
    } else if (compatibility === 'good') {
      hasGoodCompanion = true
      goodCompanions.push(adjName)
    }
  }

  // Determine overall compatibility
  if (hasBadCompanion) {
    overallCompatibility = 'bad'
  } else if (hasGoodCompanion) {
    overallCompatibility = 'good'
    suggestions.push(`Great choice! ${vegetable.name} grows well with ${goodCompanions.join(', ')}`)
  } else if (adjacentCells.length === 0) {
    const companionNames = vegetable.enhancedCompanions
      .slice(0, 3)
      .map(c => getVegetableById(c.plantId)?.name)
      .filter(Boolean)
      .join(', ')
    if (companionNames) {
      suggestions.push(`No neighbors yet. Consider planting companions nearby: ${companionNames}`)
    }
  }

  return {
    isValid: !hasBadCompanion || true, // Allow placement with warning
    warnings,
    suggestions,
    compatibility: overallCompatibility
  }
}

/**
 * Get suggested companions for a vegetable
 * Returns vegetable IDs from the enhancedCompanions array
 */
export function getSuggestedCompanions(plantId: string): string[] {
  const vegetable = getVegetableById(plantId)
  if (!vegetable) return []

  return vegetable.enhancedCompanions.map(c => c.plantId)
}

/**
 * Get plants that should be avoided near a vegetable
 * Returns vegetable IDs from the enhancedAvoid array
 */
export function getAvoidedPlants(plantId: string): string[] {
  const vegetable = getVegetableById(plantId)
  if (!vegetable) return []

  return vegetable.enhancedAvoid.map(c => c.plantId)
}

/**
 * Calculate companion score for a cell placement (0-100)
 * Higher score = better placement
 */
export function calculateCompanionScore(
  plantId: string,
  targetCell: PlotCell,
  plot: GridPlot
): number {
  const adjacentCells = getPlantedAdjacentCells(targetCell, plot.cells)

  if (adjacentCells.length === 0) return 50 // Neutral

  let goodCount = 0
  let badCount = 0

  for (const adjCell of adjacentCells) {
    if (!adjCell.plantId) continue

    const compatibility = checkCompanionCompatibility(plantId, adjCell.plantId)
    if (compatibility === 'good') goodCount++
    if (compatibility === 'bad') badCount++
  }

  // Score: 50 base + 15 per good - 25 per bad, clamped to 0-100
  const score = 50 + (goodCount * 15) - (badCount * 25)
  return Math.max(0, Math.min(100, score))
}
