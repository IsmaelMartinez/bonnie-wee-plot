/**
 * Companion planting validation logic for the grid planner
 * Checks adjacent cells for compatible/incompatible plant combinations
 */

import { PlotCell, GridPlot, PlacementValidation, PlacementWarning } from '@/types/garden-planner'
import { getVegetableById, vegetables } from '@/lib/vegetable-database'
import { normalizeCompanionName } from '@/lib/companion-normalization'

// Cache for name-to-ID lookups (populated on first use)
let nameToIdCache: Map<string, string> | null = null

/**
 * Build cache mapping normalized plant names to vegetable IDs
 */
function buildNameToIdCache(): Map<string, string> {
  const cache = new Map<string, string>()
  for (const veg of vegetables) {
    // Store both exact name and lowercase for flexible matching
    cache.set(veg.name, veg.id)
    cache.set(veg.name.toLowerCase(), veg.id)
  }
  return cache
}

/**
 * Resolve a companion plant name to a vegetable ID
 * Uses normalization to handle plurals, synonyms, etc.
 */
export function resolveCompanionToId(companionName: string): string | null {
  if (!nameToIdCache) {
    nameToIdCache = buildNameToIdCache()
  }

  // First try exact match
  const exactMatch = nameToIdCache.get(companionName)
  if (exactMatch) return exactMatch

  // Try lowercase match
  const lowerMatch = nameToIdCache.get(companionName.toLowerCase())
  if (lowerMatch) return lowerMatch

  // Try normalizing the name
  const normalized = normalizeCompanionName(companionName)
  if (normalized === null) return null // Vague reference, no match
  if (Array.isArray(normalized)) {
    // Category expansion - return first match (could be improved to return all)
    for (const name of normalized) {
      const id = nameToIdCache.get(name) || nameToIdCache.get(name.toLowerCase())
      if (id) return id
    }
    return null
  }

  // Try normalized name
  return nameToIdCache.get(normalized) || nameToIdCache.get(normalized.toLowerCase()) || null
}

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
 * Check if a vegetable ID matches any name in a companion/avoid list
 * Uses ID-based matching with normalization for accuracy
 */
function matchesCompanionList(targetId: string, targetName: string, list: string[]): boolean {
  for (const name of list) {
    // Try resolving the companion name to an ID
    const resolvedId = resolveCompanionToId(name)
    if (resolvedId === targetId) return true

    // Fallback: exact name match (case-insensitive)
    if (name.toLowerCase() === targetName.toLowerCase()) return true
  }
  return false
}

/**
 * Check compatibility between two vegetables
 * Returns 'good' if companion, 'bad' if avoid, 'neutral' otherwise
 * Uses ID-based matching with normalization for accuracy
 */
export function checkCompanionCompatibility(
  vegAId: string,
  vegBId: string
): 'good' | 'neutral' | 'bad' {
  const vegA = getVegetableById(vegAId)
  const vegB = getVegetableById(vegBId)

  if (!vegA || !vegB) return 'neutral'

  // Check if vegA avoids vegB or vice versa (bidirectional check)
  const vegAAvoids = matchesCompanionList(vegBId, vegB.name, vegA.avoidPlants)
  const vegBAvoids = matchesCompanionList(vegAId, vegA.name, vegB.avoidPlants)

  if (vegAAvoids || vegBAvoids) return 'bad'

  // Check if they are companions (bidirectional check)
  const vegACompanion = matchesCompanionList(vegBId, vegB.name, vegA.companionPlants)
  const vegBCompanion = matchesCompanionList(vegAId, vegA.name, vegB.companionPlants)

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
    suggestions.push(`No neighbors yet. Consider planting companions nearby: ${vegetable.companionPlants.slice(0, 3).join(', ')}`)
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
 * Returns vegetable IDs that are listed as companions
 */
export function getSuggestedCompanions(plantId: string): string[] {
  const vegetable = getVegetableById(plantId)
  if (!vegetable) return []

  const companionIds = new Set<string>()

  // Resolve each companion name to an ID
  for (const name of vegetable.companionPlants) {
    const id = resolveCompanionToId(name)
    if (id) companionIds.add(id)
  }

  return [...companionIds]
}

/**
 * Get plants that should be avoided near a vegetable
 * Returns vegetable IDs that are listed as avoid plants
 */
export function getAvoidedPlants(plantId: string): string[] {
  const vegetable = getVegetableById(plantId)
  if (!vegetable) return []

  const avoidIds = new Set<string>()

  // Resolve each avoid name to an ID
  for (const name of vegetable.avoidPlants) {
    const id = resolveCompanionToId(name)
    if (id) avoidIds.add(id)
  }

  return [...avoidIds]
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

