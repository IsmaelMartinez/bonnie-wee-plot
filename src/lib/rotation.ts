/**
 * Crop Rotation Module
 * 
 * Unified crop rotation logic for tracking, suggestions, and planning.
 * Implements a 4-year rotation system for optimal soil health.
 * Handles both grid plots and physical bed layouts.
 */

import { 
  VegetableCategory, 
  RotationGroup, 
  RotationHistory,
  GridPlot,
  PlacementWarning,
  RotationSuggestion, 
  RotationPlan,
  PhysicalBedId,
  SeasonPlan,
  PhysicalBed
} from '@/types/garden-planner'
import { getVegetableById, vegetables } from '@/lib/vegetable-database'
import { getSeasonByYear, getRotationGroupForBed } from '@/data/historical-plans'
import {
  physicalBeds,
  getBedById,
} from '@/data/allotment-layout'
import { AllotmentData } from '@/types/unified-allotment'

// ============ CONSTANTS ============

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
  'leafy-greens': 'roots',         // Often grouped with roots in rotation
  'herbs': 'permanent',             // Perennials, don't need rotation
  'berries': 'permanent',           // Perennials
  'fruit-trees': 'permanent',       // Perennials
  'annual-flowers': 'permanent',    // Flowers don't need rotation
  'perennial-flowers': 'permanent', // Flowers don't need rotation
  'bulbs': 'permanent',             // Flowers don't need rotation
  'climbers': 'permanent',          // Flowers don't need rotation
  'other': 'roots'                  // Sweetcorn etc - treat as roots for rotation
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
 * Standard 4-year rotation sequence
 * Each group should follow a specific pattern to maximize soil health
 */
export const ROTATION_SEQUENCE: Record<RotationGroup, RotationGroup> = {
  'legumes': 'brassicas',      // Brassicas follow legumes (use nitrogen)
  'brassicas': 'roots',        // Roots follow brassicas (break up soil)
  'roots': 'solanaceae',       // Solanaceae follow roots
  'solanaceae': 'alliums',     // Alliums follow solanaceae (clean up)
  'alliums': 'legumes',        // Legumes follow alliums (rest and fix nitrogen)
  'cucurbits': 'legumes',      // Cucurbits treated similarly to solanaceae
  'permanent': 'permanent'     // Permanent plantings don't rotate
}

/**
 * Alternative suggestions when the ideal rotation isn't possible
 */
export const ROTATION_ALTERNATIVES: Record<RotationGroup, RotationGroup[]> = {
  'legumes': ['cucurbits', 'alliums'],
  'brassicas': ['alliums', 'legumes'],
  'roots': ['alliums', 'legumes'],
  'solanaceae': ['roots', 'brassicas'],
  'alliums': ['brassicas', 'roots'],
  'cucurbits': ['roots', 'brassicas'],
  'permanent': []
}

/**
 * Display names for rotation groups (text only)
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
 * Display info for rotation groups (with emoji and color)
 */
export const ROTATION_GROUP_DISPLAY: Record<RotationGroup, { name: string; emoji: string; color: string }> = {
  'legumes': { name: 'Legumes', emoji: '🫛', color: 'green' },
  'brassicas': { name: 'Brassicas', emoji: '🥬', color: 'purple' },
  'roots': { name: 'Roots', emoji: '🥕', color: 'orange' },
  'solanaceae': { name: 'Nightshades', emoji: '🥔', color: 'red' },
  'alliums': { name: 'Alliums', emoji: '🧅', color: 'amber' },
  'cucurbits': { name: 'Cucurbits', emoji: '🎃', color: 'yellow' },
  'permanent': { name: 'Permanent', emoji: '🌳', color: 'emerald' }
}

/**
 * Reasons for rotation choices
 */
const ROTATION_REASONS: Record<string, string> = {
  'legumes->brassicas': 'Brassicas are heavy feeders and benefit from nitrogen fixed by legumes',
  'brassicas->roots': 'Root vegetables help break up soil compacted by brassicas',
  'roots->solanaceae': 'Potatoes and tomatoes do well after root crops',
  'solanaceae->alliums': 'Onion family helps clean soil of potato/tomato diseases',
  'alliums->legumes': 'Legumes rest the soil and fix nitrogen after alliums',
  'cucurbits->legumes': 'Legumes replenish nitrogen depleted by hungry squash family',
  'default': 'Standard crop rotation for soil health and disease prevention'
}

// ============ PROBLEM BED SUGGESTIONS ============

export interface ProblemBedSuggestion {
  bedId: PhysicalBedId
  issue: string
  perennialOptions: string[]
  annualOptions: string[]
  recommendation: string
}

export const PROBLEM_BED_SUGGESTIONS: Record<string, ProblemBedSuggestion> = {
  'C': {
    bedId: 'C',
    issue: 'Shaded by apple tree - most crops struggle',
    perennialOptions: ['asparagus', 'rhubarb', 'strawberries'],
    annualOptions: ['leeks', 'lettuce', 'spinach', 'chard'],
    recommendation: 'Consider perennial asparagus or expand rhubarb. Leeks tolerated shade well in 2025. Could also join strawberry rotation with Bed A.'
  },
  'E': {
    bedId: 'E',
    issue: 'New area - competition issues with sunflowers in 2024/2025',
    perennialOptions: ['artichokes', 'asparagus'],
    annualOptions: ['french-beans', 'runner-beans'],
    recommendation: 'Retry beans alone without sunflower competition. If that fails, consider globe artichokes or Jerusalem artichokes as productive perennials.'
  }
}

// ============ CORE FUNCTIONS ============

/**
 * Get the rotation group for a vegetable
 */
export function getRotationGroup(plantId: string): RotationGroup | undefined {
  const veg = getVegetableById(plantId)
  if (!veg) return undefined
  return ROTATION_GROUPS[veg.category]
}

/**
 * Get vegetables suitable for a specific rotation group
 */
export function getVegetablesForRotationGroup(group: RotationGroup): string[] {
  const categoryMap: Record<RotationGroup, string[]> = {
    'legumes': ['legumes'],
    'brassicas': ['brassicas'],
    'roots': ['root-vegetables', 'leafy-greens'],
    'solanaceae': ['solanaceae'],
    'alliums': ['alliums'],
    'cucurbits': ['cucurbits'],
    'permanent': ['herbs', 'berries', 'fruit-trees']
  }

  const categories = categoryMap[group] || []
  return vegetables
    .filter(v => categories.includes(v.category))
    .map(v => v.id)
}

/**
 * Get the ideal next rotation group
 */
export function getNextRotationGroup(currentGroup: RotationGroup): RotationGroup {
  return ROTATION_SEQUENCE[currentGroup] || 'legumes'
}

/**
 * Get rotation reason text
 */
export function getRotationReason(fromGroup: RotationGroup, toGroup: RotationGroup): string {
  const key = `${fromGroup}->${toGroup}`
  return ROTATION_REASONS[key] || ROTATION_REASONS['default']
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

// ============ VALIDATION FUNCTIONS ============

/**
 * Check if placing a vegetable violates rotation rules (same group within 2 years)
 */
export function checkRotationViolation(
  plantId: string,
  plotId: string,
  year: number,
  history: RotationHistory[]
): PlacementWarning | null {
  const rotationGroup = getRotationGroup(plantId)
  
  // Permanent crops (herbs) don't need rotation
  if (!rotationGroup || rotationGroup === 'permanent') return null
  
  const veg = getVegetableById(plantId)
  
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
 * Check if a planting would break rotation rules for physical beds
 */
export function checkRotationCompatibility(
  bedId: PhysicalBedId,
  proposedGroup: RotationGroup,
  year: number
): { compatible: boolean; warning?: string } {
  const bed = getBedById(bedId)
  
  // Perennial beds don't follow normal rotation
  if (bed?.status === 'perennial') {
    return { compatible: true }
  }

  const previousYear = getRotationGroupForBed(year - 1, bedId) as RotationGroup | undefined
  const twoYearsAgo = getRotationGroupForBed(year - 2, bedId) as RotationGroup | undefined

  // Same group as last year is a problem
  if (previousYear === proposedGroup) {
    return {
      compatible: false,
      warning: `${proposedGroup} was grown in this bed last year. Consider rotating to a different crop family.`
    }
  }

  // Same group as two years ago is less ideal but acceptable
  if (twoYearsAgo === proposedGroup) {
    return {
      compatible: true,
      warning: `${proposedGroup} was grown in this bed 2 years ago. Ideally wait 3-4 years between same family.`
    }
  }

  // Check if this follows good rotation practice
  if (previousYear) {
    const idealNext = getNextRotationGroup(previousYear)
    if (proposedGroup !== idealNext) {
      return {
        compatible: true,
        warning: `After ${previousYear}, ${idealNext} would be ideal, but ${proposedGroup} is acceptable.`
      }
    }
  }

  return { compatible: true }
}

/**
 * Calculate rotation score for a vegetable placement (0-100)
 * Higher score = better follows rotation principles
 */
export function calculateRotationScore(
  plantId: string,
  plotId: string,
  year: number,
  history: RotationHistory[]
): number {
  const rotationGroup = getRotationGroup(plantId)
  
  // Permanent crops always get 75 (neutral-good)
  if (!rotationGroup || rotationGroup === 'permanent') return 75
  
  const suggestedGroup = getSuggestedRotation(plotId, year, history)
  const violation = checkRotationViolation(plantId, plotId, year, history)
  
  // Perfect match with suggested rotation
  if (rotationGroup === suggestedGroup) return 100
  
  // Has violation
  if (violation) {
    return violation.severity === 'error' ? 10 : 30
  }
  
  // Different group but no violation
  return 60
}

// ============ GRID PLOT FUNCTIONS ============

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
    if (cell.plantId) {
      const group = getRotationGroup(cell.plantId)
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
    .filter(c => c.plantId)
    .map(c => c.plantId!)
  
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

// ============ BED PLANNING FUNCTIONS ============

/**
 * Generate rotation suggestion for a single bed (using hardcoded layout)
 */
export function generateBedSuggestion(
  bedId: PhysicalBedId,
  previousYears: { year: number; group: RotationGroup }[]
): RotationSuggestion {
  const bed = getBedById(bedId)
  
  // Handle perennial beds
  if (bed?.status === 'perennial') {
    return {
      bedId,
      previousGroup: 'permanent',
      suggestedGroup: 'permanent',
      reason: 'Perennial bed - maintain existing plantings',
      suggestedVegetables: [],
      isPerennial: true
    }
  }

  // Get the most recent year's rotation group
  const sortedYears = [...previousYears].sort((a, b) => b.year - a.year)
  const mostRecent = sortedYears[0]
  
  if (!mostRecent) {
    // No history - suggest legumes as a good starting point
    return {
      bedId,
      previousGroup: 'legumes',
      suggestedGroup: 'legumes',
      reason: 'No planting history - legumes are a good starting point to fix nitrogen',
      suggestedVegetables: getVegetablesForRotationGroup('legumes')
    }
  }

  const suggestedGroup = getNextRotationGroup(mostRecent.group)
  
  // Check if we've grown this group recently (last 3 years)
  const recentGroups = sortedYears.slice(0, 3).map(y => y.group)
  let finalSuggestion = suggestedGroup
  let reason = getRotationReason(mostRecent.group, suggestedGroup)

  if (recentGroups.includes(suggestedGroup)) {
    // Try alternatives
    const alternatives = ROTATION_ALTERNATIVES[mostRecent.group] || []
    for (const alt of alternatives) {
      if (!recentGroups.includes(alt)) {
        finalSuggestion = alt
        reason = `${suggestedGroup} was grown recently - ${alt} is a good alternative`
        break
      }
    }
  }

  return {
    bedId,
    previousGroup: mostRecent.group,
    suggestedGroup: finalSuggestion,
    reason,
    suggestedVegetables: getVegetablesForRotationGroup(finalSuggestion)
  }
}

/**
 * Generate rotation suggestion for a single bed using unified data
 */
export function generateBedSuggestionFromData(
  bedId: PhysicalBedId,
  beds: PhysicalBed[],
  previousYears: { year: number; group: RotationGroup }[]
): RotationSuggestion {
  const bed = beds.find(b => b.id === bedId)
  
  // Handle perennial beds
  if (bed?.status === 'perennial') {
    return {
      bedId,
      previousGroup: 'permanent',
      suggestedGroup: 'permanent',
      reason: 'Perennial bed - maintain existing plantings',
      suggestedVegetables: [],
      isPerennial: true
    }
  }

  // Get the most recent year's rotation group
  const sortedYears = [...previousYears].sort((a, b) => b.year - a.year)
  const mostRecent = sortedYears[0]
  
  if (!mostRecent) {
    return {
      bedId,
      previousGroup: 'legumes',
      suggestedGroup: 'legumes',
      reason: 'No planting history - legumes are a good starting point to fix nitrogen',
      suggestedVegetables: getVegetablesForRotationGroup('legumes')
    }
  }

  const suggestedGroup = getNextRotationGroup(mostRecent.group)
  
  const recentGroups = sortedYears.slice(0, 3).map(y => y.group)
  let finalSuggestion = suggestedGroup
  let reason = getRotationReason(mostRecent.group, suggestedGroup)

  if (recentGroups.includes(suggestedGroup)) {
    const alternatives = ROTATION_ALTERNATIVES[mostRecent.group] || []
    for (const alt of alternatives) {
      if (!recentGroups.includes(alt)) {
        finalSuggestion = alt
        reason = `${suggestedGroup} was grown recently - ${alt} is a good alternative`
        break
      }
    }
  }

  return {
    bedId,
    previousGroup: mostRecent.group,
    suggestedGroup: finalSuggestion,
    reason,
    suggestedVegetables: getVegetablesForRotationGroup(finalSuggestion)
  }
}

// ============ PLAN GENERATION ============

/**
 * Generate complete rotation plan for a year (using hardcoded layout)
 */
export function generateRotationPlan(
  targetYear: number,
  historicalSeasons: SeasonPlan[]
): RotationPlan {
  // Use all rotation bed IDs plus problem beds
  const allBeds = physicalBeds.map(b => b.id)
  const suggestions: RotationSuggestion[] = []
  const warnings: string[] = []

  // Build history for each bed
  for (const bedId of allBeds) {
    const bedHistory: { year: number; group: RotationGroup }[] = []
    
    for (const season of historicalSeasons) {
      const bedPlan = season.beds.find(b => b.bedId === bedId)
      if (bedPlan) {
        bedHistory.push({
          year: season.year,
          group: bedPlan.rotationGroup
        })
      }
    }

    const suggestion = generateBedSuggestion(bedId, bedHistory)
    suggestions.push(suggestion)

    // Check for rotation warnings (only for rotation beds)
    const bed = getBedById(bedId)
    if (bed?.status === 'rotation' && bedHistory.length >= 2) {
      const lastTwo = bedHistory.slice(-2)
      if (lastTwo[0]?.group === lastTwo[1]?.group) {
        warnings.push(`Bed ${bedId}: Same crop family grown two years in a row - consider rotating`)
      }
    }
  }

  // Check for duplicate suggestions in rotation beds
  const rotationSuggestions = suggestions.filter(s => !s.isPerennial)
  const suggestedGroups = rotationSuggestions.map(s => s.suggestedGroup)
  const duplicates = suggestedGroups.filter((g, i) => suggestedGroups.indexOf(g) !== i)
  if (duplicates.length > 0) {
    warnings.push(`Multiple beds suggested for ${duplicates.join(', ')} - consider adjusting`)
  }

  return {
    year: targetYear,
    suggestions,
    warnings
  }
}

/**
 * Generate rotation plan from unified AllotmentData
 */
export function generateRotationPlanFromData(
  targetYear: number,
  data: AllotmentData
): RotationPlan {
  const beds = data.layout.beds
  const suggestions: RotationSuggestion[] = []
  const warnings: string[] = []

  // Build history for each bed from seasons
  for (const bed of beds) {
    const bedHistory: { year: number; group: RotationGroup }[] = []
    
    for (const season of data.seasons) {
      const bedSeason = season.beds.find(b => b.bedId === bed.id)
      if (bedSeason) {
        bedHistory.push({
          year: season.year,
          group: bedSeason.rotationGroup
        })
      }
    }

    const suggestion = generateBedSuggestionFromData(bed.id, beds, bedHistory)
    suggestions.push(suggestion)

    // Check for rotation warnings (only for rotation beds)
    if (bed.status === 'rotation' && bedHistory.length >= 2) {
      const sorted = bedHistory.sort((a, b) => b.year - a.year)
      if (sorted[0]?.group === sorted[1]?.group) {
        warnings.push(`Bed ${bed.id}: Same crop family grown two years in a row - consider rotating`)
      }
    }
  }

  // Check for duplicate suggestions in rotation beds
  const rotationSuggestions = suggestions.filter(s => !s.isPerennial)
  const suggestedGroups = rotationSuggestions.map(s => s.suggestedGroup)
  const duplicates = suggestedGroups.filter((g, i) => suggestedGroups.indexOf(g) !== i)
  if (duplicates.length > 0) {
    warnings.push(`Multiple beds suggested for ${duplicates.join(', ')} - consider adjusting`)
  }

  return {
    year: targetYear,
    suggestions,
    warnings
  }
}

/**
 * Generate 2026 plan based on 2024/2025 history
 */
export function generate2026Plan(): RotationPlan {
  const season2024 = getSeasonByYear(2024)
  const season2025 = getSeasonByYear(2025)
  
  const historicalSeasons: SeasonPlan[] = []
  if (season2024) historicalSeasons.push(season2024)
  if (season2025) historicalSeasons.push(season2025)

  return generateRotationPlan(2026, historicalSeasons)
}

// ============ HISTORY FUNCTIONS ============

/**
 * Get rotation history summary for a bed
 */
export function getBedRotationHistory(
  bedId: PhysicalBedId,
  years: number[]
): { year: number; group: RotationGroup | undefined }[] {
  return years.map(year => ({
    year,
    group: getRotationGroupForBed(year, bedId) as RotationGroup | undefined
  }))
}

// ============ DISPLAY HELPERS ============

/**
 * Get bed status display
 */
export function getBedStatusDisplay(bedId: PhysicalBedId): { status: string; color: string } {
  const bed = getBedById(bedId)
  switch (bed?.status) {
    case 'rotation':
      return { status: 'In Rotation', color: 'green' }
    case 'perennial':
      return { status: 'Perennial', color: 'blue' }
    default:
      return { status: 'Unknown', color: 'gray' }
  }
}

/**
 * Special suggestion for Bed A transitioning to strawberries
 */
export function getBedATransitionPlan(): {
  currentUse: string
  proposedUse: string
  timeline: string[]
} {
  return {
    currentUse: 'Peas (legumes) in 2025',
    proposedUse: 'Strawberry bed (joining rotation with B1\' strawberries)',
    timeline: [
      '2026 Spring: Final legume harvest',
      '2026 Summer: Prepare bed, add compost',
      '2026 Autumn: Plant strawberry runners from B1\'',
      '2027: First strawberry harvest from Bed A'
    ]
  }
}


