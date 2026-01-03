/**
 * AI Suggestions Library
 *
 * Generates contextual AI question suggestions based on the current
 * state of the allotment - seasonal phase, problem beds, plantings, etc.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Leaf,
  Bug,
  Sprout,
  Calendar,
  AlertTriangle,
  Carrot,
  Scissors,
  Recycle,
  HelpCircle,
} from 'lucide-react'
import { SeasonalPhase } from '@/lib/seasons'
import { MaintenanceTask, Planting } from '@/types/unified-allotment'
import { PhysicalBed } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

export interface AISuggestion {
  icon: LucideIcon
  title: string
  query: string
  priority: number // Higher = more relevant
  category: 'seasonal' | 'problem' | 'harvest' | 'planting' | 'maintenance' | 'general'
}

// Static fallback topics for when there's no personalized data
const FALLBACK_TOPICS: AISuggestion[] = [
  {
    icon: Sprout,
    title: 'Planting Guide',
    query: 'What should I plant in my allotment this month?',
    priority: 50,
    category: 'general',
  },
  {
    icon: Bug,
    title: 'Pest Control',
    query: 'How do I deal with common garden pests naturally?',
    priority: 40,
    category: 'general',
  },
  {
    icon: Recycle,
    title: 'Composting Help',
    query: 'How do I start composting? What materials should I use?',
    priority: 30,
    category: 'general',
  },
  {
    icon: Leaf,
    title: 'Plant Health',
    query: 'My tomato leaves are turning yellow, what could be wrong?',
    priority: 20,
    category: 'general',
  },
]

/**
 * Generate seasonal suggestions based on current phase
 */
function getSeasonalSuggestions(phase: SeasonalPhase, month: number): AISuggestion[] {
  const suggestions: AISuggestion[] = []

  // Month-specific seasonal question
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const monthName = monthNames[month - 1] || 'this month'

  suggestions.push({
    icon: Calendar,
    title: `${phase.name} Tasks`,
    query: `What are the most important gardening tasks for ${monthName} in a Scottish allotment?`,
    priority: 80,
    category: 'seasonal',
  })

  // Action-specific question based on seasonal phase action
  if (phase.action.toLowerCase().includes('seed')) {
    suggestions.push({
      icon: Sprout,
      title: 'Seed Starting',
      query: `What seeds should I start in ${monthName}? Should I sow indoors or outdoors?`,
      priority: 75,
      category: 'seasonal',
    })
  }

  if (phase.action.toLowerCase().includes('harvest')) {
    suggestions.push({
      icon: Carrot,
      title: 'Harvest Guide',
      query: `What crops are ready to harvest in ${monthName}? How do I know when they're ready?`,
      priority: 75,
      category: 'seasonal',
    })
  }

  if (phase.action.toLowerCase().includes('plant') || phase.action.toLowerCase().includes('transplant')) {
    suggestions.push({
      icon: Sprout,
      title: 'Transplanting Tips',
      query: 'What seedlings can I transplant outdoors now? How do I harden them off?',
      priority: 70,
      category: 'seasonal',
    })
  }

  return suggestions
}

/**
 * Generate suggestions based on problem beds
 */
function getProblemBedSuggestions(problemBeds: PhysicalBed[]): AISuggestion[] {
  if (problemBeds.length === 0) return []

  const suggestions: AISuggestion[] = []

  // General problem bed question
  suggestions.push({
    icon: AlertTriangle,
    title: 'Problem Beds',
    query: `I have ${problemBeds.length} problem bed${problemBeds.length > 1 ? 's' : ''} in my allotment. What perennials or shade-tolerant crops could work in difficult areas?`,
    priority: 85,
    category: 'problem',
  })

  // Specific problem bed if notes available
  const bedWithNotes = problemBeds.find(b => b.problemNotes)
  if (bedWithNotes) {
    suggestions.push({
      icon: HelpCircle,
      title: `Bed ${bedWithNotes.id} Help`,
      query: `My ${bedWithNotes.name} has issues: ${bedWithNotes.problemNotes}. What would you suggest I grow there?`,
      priority: 90,
      category: 'problem',
    })
  }

  return suggestions
}

/**
 * Generate suggestions based on harvest-ready plantings
 */
function getHarvestSuggestions(harvestReady: Planting[]): AISuggestion[] {
  if (harvestReady.length === 0) return []

  const suggestions: AISuggestion[] = []

  // Get unique vegetable names
  const veggies = harvestReady
    .map(p => getVegetableById(p.vegetableId)?.name)
    .filter((name): name is string => !!name)
  const uniqueVeggies = [...new Set(veggies)]

  if (uniqueVeggies.length > 0) {
    const vegList = uniqueVeggies.slice(0, 3).join(', ')
    suggestions.push({
      icon: Carrot,
      title: 'Harvest Tips',
      query: `I have ${vegList} ready to harvest. How do I know when they're at peak ripeness and how should I store them?`,
      priority: 85,
      category: 'harvest',
    })
  }

  if (uniqueVeggies.length > 2) {
    suggestions.push({
      icon: Recycle,
      title: 'Preserving Harvest',
      query: `I'm harvesting lots of vegetables. What are the best ways to preserve ${uniqueVeggies[0]} and ${uniqueVeggies[1]}?`,
      priority: 70,
      category: 'harvest',
    })
  }

  return suggestions
}

/**
 * Generate suggestions based on plantings needing attention
 */
function getPlantingSuggestions(needsAttention: Planting[]): AISuggestion[] {
  if (needsAttention.length === 0) return []

  const suggestions: AISuggestion[] = []

  // Get unique vegetable names
  const veggies = needsAttention
    .map(p => getVegetableById(p.vegetableId)?.name)
    .filter((name): name is string => !!name)
  const uniqueVeggies = [...new Set(veggies)]

  if (uniqueVeggies.length > 0) {
    const vegList = uniqueVeggies.slice(0, 2).join(' and ')
    suggestions.push({
      icon: Sprout,
      title: 'Sowing Window',
      query: `The sowing window is open for ${vegList}. What's the best technique for starting them?`,
      priority: 80,
      category: 'planting',
    })
  }

  return suggestions
}

/**
 * Generate suggestions based on maintenance tasks
 */
function getMaintenanceSuggestions(tasks: MaintenanceTask[]): AISuggestion[] {
  if (tasks.length === 0) return []

  const suggestions: AISuggestion[] = []

  // Group by type
  const pruneTasks = tasks.filter(t => t.type === 'prune')
  const feedTasks = tasks.filter(t => t.type === 'feed')

  if (pruneTasks.length > 0) {
    suggestions.push({
      icon: Scissors,
      title: 'Pruning Help',
      query: `I have ${pruneTasks.length} pruning task${pruneTasks.length > 1 ? 's' : ''} this month. What's the best technique for pruning fruit trees and bushes?`,
      priority: 75,
      category: 'maintenance',
    })
  }

  if (feedTasks.length > 0) {
    suggestions.push({
      icon: Leaf,
      title: 'Feeding Schedule',
      query: 'What organic fertilizers should I use for fruit trees and when is the best time to apply them?',
      priority: 65,
      category: 'maintenance',
    })
  }

  return suggestions
}

export interface GenerateSuggestionsInput {
  seasonalPhase: SeasonalPhase
  currentMonth: number
  problemBeds: PhysicalBed[]
  harvestReady: Planting[]
  needsAttention: Planting[]
  maintenanceTasks: MaintenanceTask[]
}

/**
 * Generate contextual AI suggestions based on allotment state
 * Returns suggestions sorted by priority, limited to maxCount
 */
export function generateAISuggestions(
  input: GenerateSuggestionsInput,
  maxCount: number = 6
): AISuggestion[] {
  const allSuggestions: AISuggestion[] = [
    ...getSeasonalSuggestions(input.seasonalPhase, input.currentMonth),
    ...getProblemBedSuggestions(input.problemBeds),
    ...getHarvestSuggestions(input.harvestReady),
    ...getPlantingSuggestions(input.needsAttention),
    ...getMaintenanceSuggestions(input.maintenanceTasks),
  ]

  // If we have personalized suggestions, use them
  if (allSuggestions.length > 0) {
    // Sort by priority (highest first) and take top N
    return allSuggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxCount)
  }

  // Fall back to static topics
  return FALLBACK_TOPICS.slice(0, maxCount)
}

/**
 * Check if we have enough personalized data to show dynamic suggestions
 */
export function hasPersonalizedData(input: GenerateSuggestionsInput): boolean {
  return (
    input.problemBeds.length > 0 ||
    input.harvestReady.length > 0 ||
    input.needsAttention.length > 0 ||
    input.maintenanceTasks.length > 0
  )
}
