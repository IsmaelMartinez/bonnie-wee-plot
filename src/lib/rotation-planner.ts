/**
 * Crop rotation planning logic
 * Updated to handle 9-area bed structure including problem beds
 */

import { 
  RotationGroup, 
  RotationSuggestion, 
  RotationPlan,
  PhysicalBedId,
  SeasonPlan
} from '@/types/garden-planner'
import { getSeasonByYear, getRotationGroupForBed } from '@/data/historical-plans'
import { 
  physicalBeds, 
  getBedById, 
  getProblemBeds
} from '@/data/allotment-layout'
import { vegetables } from '@/lib/vegetable-database'

// Standard 4-year rotation sequence
// Each group should follow a specific pattern to maximize soil health
const ROTATION_SEQUENCE: Record<RotationGroup, RotationGroup> = {
  'legumes': 'brassicas',      // Brassicas follow legumes (use nitrogen)
  'brassicas': 'roots',        // Roots follow brassicas (break up soil)
  'roots': 'solanaceae',       // Solanaceae follow roots
  'solanaceae': 'alliums',     // Alliums follow solanaceae (clean up)
  'alliums': 'legumes',        // Legumes follow alliums (rest and fix nitrogen)
  'cucurbits': 'legumes',      // Cucurbits treated similarly to solanaceae
  'permanent': 'permanent'     // Permanent plantings don't rotate
}

// Alternative suggestions when the ideal rotation isn't possible
const ROTATION_ALTERNATIVES: Record<RotationGroup, RotationGroup[]> = {
  'legumes': ['cucurbits', 'alliums'],
  'brassicas': ['alliums', 'legumes'],
  'roots': ['alliums', 'legumes'],
  'solanaceae': ['roots', 'brassicas'],
  'alliums': ['brassicas', 'roots'],
  'cucurbits': ['roots', 'brassicas'],
  'permanent': []
}

// Reasons for rotation choices
const ROTATION_REASONS: Record<string, string> = {
  'legumes->brassicas': 'Brassicas are heavy feeders and benefit from nitrogen fixed by legumes',
  'brassicas->roots': 'Root vegetables help break up soil compacted by brassicas',
  'roots->solanaceae': 'Potatoes and tomatoes do well after root crops',
  'solanaceae->alliums': 'Onion family helps clean soil of potato/tomato diseases',
  'alliums->legumes': 'Legumes rest the soil and fix nitrogen after alliums',
  'cucurbits->legumes': 'Legumes replenish nitrogen depleted by hungry squash family',
  'default': 'Standard crop rotation for soil health and disease prevention'
}

// Suggestions for problem beds
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

// Get vegetables that belong to a rotation group
export function getVegetablesForRotationGroup(group: RotationGroup): string[] {
  const categoryMap: Record<RotationGroup, string[]> = {
    'legumes': ['legumes'],
    'brassicas': ['brassicas'],
    'roots': ['root-vegetables'],
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

// Get the ideal next rotation group
export function getNextRotationGroup(currentGroup: RotationGroup): RotationGroup {
  return ROTATION_SEQUENCE[currentGroup] || 'legumes'
}

// Get rotation reason text
function getRotationReason(fromGroup: RotationGroup, toGroup: RotationGroup): string {
  const key = `${fromGroup}->${toGroup}`
  return ROTATION_REASONS[key] || ROTATION_REASONS['default']
}

// Generate rotation suggestion for a single bed
export function generateBedSuggestion(
  bedId: PhysicalBedId,
  previousYears: { year: number; group: RotationGroup }[]
): RotationSuggestion {
  const bed = getBedById(bedId)
  
  // Handle problem beds differently
  if (bed?.status === 'problem') {
    const problemSuggestion = PROBLEM_BED_SUGGESTIONS[bedId]
    return {
      bedId,
      previousGroup: previousYears[0]?.group || 'legumes',
      suggestedGroup: 'permanent', // Suggest perennials for problem beds
      reason: problemSuggestion?.recommendation || 'Problem bed - consider perennial plantings',
      suggestedVegetables: problemSuggestion?.perennialOptions || [],
      isProblemBed: true,
      problemNote: problemSuggestion?.issue
    }
  }

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

// Generate complete rotation plan for a year
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
  const rotationSuggestions = suggestions.filter(s => !s.isProblemBed && !s.isPerennial)
  const suggestedGroups = rotationSuggestions.map(s => s.suggestedGroup)
  const duplicates = suggestedGroups.filter((g, i) => suggestedGroups.indexOf(g) !== i)
  if (duplicates.length > 0) {
    warnings.push(`Multiple beds suggested for ${duplicates.join(', ')} - consider adjusting`)
  }

  // Add problem bed warnings
  const problemBeds = getProblemBeds()
  for (const bed of problemBeds) {
    warnings.push(`${bed.name} needs attention: ${bed.problemNotes}`)
  }

  return {
    year: targetYear,
    suggestions,
    warnings
  }
}

// Generate 2026 plan based on 2024/2025 history
export function generate2026Plan(): RotationPlan {
  const season2024 = getSeasonByYear(2024)
  const season2025 = getSeasonByYear(2025)
  
  const historicalSeasons: SeasonPlan[] = []
  if (season2024) historicalSeasons.push(season2024)
  if (season2025) historicalSeasons.push(season2025)

  return generateRotationPlan(2026, historicalSeasons)
}

// Get rotation history summary for a bed
export function getBedRotationHistory(
  bedId: PhysicalBedId,
  years: number[]
): { year: number; group: RotationGroup | undefined }[] {
  return years.map(year => ({
    year,
    group: getRotationGroupForBed(year, bedId) as RotationGroup | undefined
  }))
}

// Check if a planting would break rotation rules
export function checkRotationCompatibility(
  bedId: PhysicalBedId,
  proposedGroup: RotationGroup,
  year: number
): { compatible: boolean; warning?: string } {
  const bed = getBedById(bedId)
  
  // Problem and perennial beds don't follow normal rotation
  if (bed?.status === 'problem' || bed?.status === 'perennial') {
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

// Display names for rotation groups
export const ROTATION_GROUP_DISPLAY: Record<RotationGroup, { name: string; emoji: string; color: string }> = {
  'legumes': { name: 'Legumes', emoji: '🫛', color: 'green' },
  'brassicas': { name: 'Brassicas', emoji: '🥬', color: 'purple' },
  'roots': { name: 'Roots', emoji: '🥕', color: 'orange' },
  'solanaceae': { name: 'Nightshades', emoji: '🥔', color: 'red' },
  'alliums': { name: 'Alliums', emoji: '🧅', color: 'amber' },
  'cucurbits': { name: 'Cucurbits', emoji: '🎃', color: 'yellow' },
  'permanent': { name: 'Permanent', emoji: '🌳', color: 'emerald' }
}

// Get bed status display
export function getBedStatusDisplay(bedId: PhysicalBedId): { status: string; color: string } {
  const bed = getBedById(bedId)
  switch (bed?.status) {
    case 'rotation':
      return { status: 'In Rotation', color: 'green' }
    case 'problem':
      return { status: 'Needs Attention', color: 'red' }
    case 'perennial':
      return { status: 'Perennial', color: 'blue' }
    default:
      return { status: 'Unknown', color: 'gray' }
  }
}

// Special suggestion for Bed A transitioning to strawberries
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
