/**
 * Crop rotation tracking and suggestion logic
 * Implements a 3-year rotation system for optimal soil health
 */

import { 
  VegetableCategory, 
  RotationGroup, 
  RotationHistory,
  GridPlot,
  PlacementWarning
} from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

/**
 * Map vegetable categories to rotation groups
 */
export const ROTATION_GROUPS: Record<VegetableCategory, RotationGroup> = {
  'brassicas': 'brassicas',
  'legumes': 'legumes',
  'root-vegetables': 'roots',
  'solanaceae': 'solanaceae',
  'alliums': 'alliums',
  'cucurbits': 'cucurbits',
  'leafy-greens': 'roots',     // Often grouped with roots in rotation
  'herbs': 'permanent',         // Perennials, don't need rotation
  'berries': 'permanent',       // Perennials
  'fruit-trees': 'permanent',   // Perennials
  'other': 'roots'              // Sweetcorn etc - treat as roots for rotation
}

/**
 * Simple 3-year rotation order
 * Legumes first (fix nitrogen), then brassicas (heavy feeders), then roots (light feeders)
 */
export const ROTATION_ORDER: RotationGroup[] = [
  'legumes',      // Year 1: Fix nitrogen in soil
  'brassicas',    // Year 2: Heavy feeders use the nitrogen
  'roots'         // Year 3: Light feeders, break pest cycles
]

/**
 * Extended rotation including all groups
 */
export const EXTENDED_ROTATION: RotationGroup[][] = [
  ['legumes'],
  ['brassicas', 'solanaceae'],
  ['roots', 'alliums'],
  ['cucurbits']
]

/**
 * Display names for rotation groups
 */
export const ROTATION_GROUP_NAMES: Record<RotationGroup, string> = {
  'brassicas': 'Brassicas (Cabbage Family)',
  'legumes': 'Legumes (Beans & Peas)',
  'roots': 'Roots & Leafy Greens',
  'solanaceae': 'Nightshades (Tomato Family)',
  'alliums': 'Alliums (Onion Family)',
  'cucurbits': 'Cucurbits (Squash Family)',
  'permanent': 'Perennial Herbs'
}

/**
 * Get the rotation group for a vegetable
 */
export function getRotationGroup(vegetableId: string): RotationGroup | undefined {
  const veg = getVegetableById(vegetableId)
  if (!veg) return undefined
  return ROTATION_GROUPS[veg.category]
}

/**
 * Get suggested rotation group for a plot based on history
 */
export function getSuggestedRotation(
  plotId: string,
  _year: number,
  history: RotationHistory[]
): RotationGroup {
  const plotHistory = history
    .filter(h => h.plotId === plotId)
    .sort((a, b) => b.year - a.year)
  
  const lastEntry = plotHistory[0]
  
  // No history? Start with legumes
  if (!lastEntry) return 'legumes'
  
  // Find where we are in the basic rotation
  const lastGroup = lastEntry.rotationGroup
  const lastIndex = ROTATION_ORDER.indexOf(lastGroup)
  
  // If not in basic rotation (e.g., alliums, cucurbits), suggest legumes
  if (lastIndex === -1) return 'legumes'
  
  // Move to next in rotation
  const nextIndex = (lastIndex + 1) % ROTATION_ORDER.length
  return ROTATION_ORDER[nextIndex]
}

/**
 * Check if placing a vegetable violates rotation rules (same group within 2 years)
 */
export function checkRotationViolation(
  vegetableId: string,
  plotId: string,
  year: number,
  history: RotationHistory[]
): PlacementWarning | null {
  const rotationGroup = getRotationGroup(vegetableId)
  
  // Permanent crops (herbs) don't need rotation
  if (!rotationGroup || rotationGroup === 'permanent') return null
  
  const veg = getVegetableById(vegetableId)
  
  // Check history for this plot within last 2 years
  const recentHistory = history
    .filter(h => h.plotId === plotId && h.year >= year - 2 && h.year < year)
  
  for (const entry of recentHistory) {
    if (entry.rotationGroup === rotationGroup) {
      const yearsAgo = year - entry.year
      return {
        type: 'rotation',
        severity: yearsAgo === 1 ? 'error' : 'warning',
        message: `${veg?.name || 'This crop'} (${ROTATION_GROUP_NAMES[rotationGroup]}) was planted here ${yearsAgo === 1 ? 'last year' : '2 years ago'}. Consider rotating to a different family.`
      }
    }
  }
  
  return null
}

/**
 * Get the dominant rotation group for a plot based on current plantings
 */
export function getDominantRotationGroup(plot: GridPlot): RotationGroup | null {
  const groupCounts: Record<RotationGroup, number> = {
    'brassicas': 0,
    'legumes': 0,
    'roots': 0,
    'solanaceae': 0,
    'alliums': 0,
    'cucurbits': 0,
    'permanent': 0
  }
  
  for (const cell of plot.cells) {
    if (cell.vegetableId) {
      const group = getRotationGroup(cell.vegetableId)
      if (group) groupCounts[group]++
    }
  }
  
  // Find the group with most plants (excluding permanent)
  let maxCount = 0
  let dominantGroup: RotationGroup | null = null
  
  for (const [group, count] of Object.entries(groupCounts)) {
    if (group !== 'permanent' && count > maxCount) {
      maxCount = count
      dominantGroup = group as RotationGroup
    }
  }
  
  return dominantGroup
}

/**
 * Build rotation history entry from current plot state
 */
export function buildRotationHistoryEntry(
  plot: GridPlot,
  year: number
): RotationHistory | null {
  const dominantGroup = getDominantRotationGroup(plot)
  if (!dominantGroup) return null
  
  const vegetables = plot.cells
    .filter(c => c.vegetableId)
    .map(c => c.vegetableId!)
  
  return {
    plotId: plot.id,
    year,
    rotationGroup: dominantGroup,
    vegetables
  }
}

/**
 * Get rotation summary for display
 */
export function getRotationSummary(
  plotId: string,
  history: RotationHistory[],
  yearsToShow: number = 3
): Array<{ year: number; group: RotationGroup; vegetables: string[] }> {
  return history
    .filter(h => h.plotId === plotId)
    .sort((a, b) => b.year - a.year)
    .slice(0, yearsToShow)
    .map(h => ({
      year: h.year,
      group: h.rotationGroup,
      vegetables: h.vegetables
    }))
}

/**
 * Get vegetables suitable for a specific rotation group
 */
export function getVegetablesForRotationGroup(rotationGroup: RotationGroup): string[] {
  const categories = Object.entries(ROTATION_GROUPS)
    .filter(([, group]) => group === rotationGroup)
    .map(([category]) => category as VegetableCategory)
  
  // Import vegetables dynamically to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { vegetables } = require('@/lib/vegetable-database')
  return vegetables
    .filter((v: { category: VegetableCategory }) => categories.includes(v.category))
    .map((v: { id: string }) => v.id)
}

/**
 * Calculate rotation score for a vegetable placement (0-100)
 * Higher score = better follows rotation principles
 */
export function calculateRotationScore(
  vegetableId: string,
  plotId: string,
  year: number,
  history: RotationHistory[]
): number {
  const rotationGroup = getRotationGroup(vegetableId)
  
  // Permanent crops always get 75 (neutral-good)
  if (!rotationGroup || rotationGroup === 'permanent') return 75
  
  const suggestedGroup = getSuggestedRotation(plotId, year, history)
  const violation = checkRotationViolation(vegetableId, plotId, year, history)
  
  // Perfect match with suggested rotation
  if (rotationGroup === suggestedGroup) return 100
  
  // Has violation
  if (violation) {
    return violation.severity === 'error' ? 10 : 30
  }
  
  // Different group but no violation
  return 60
}

