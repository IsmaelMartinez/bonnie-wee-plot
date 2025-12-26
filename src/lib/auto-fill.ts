/**
 * Auto-fill algorithm for grid plots
 * Intelligently populates empty cells based on rotation and companion rules
 */

import { 
  GridPlot, 
  PlotCell,
  RotationHistory,
  AutoFillOptions,
  RotationGroup 
} from '@/types/garden-planner'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { calculateCompanionScore } from './companion-validation'
import { 
  getSuggestedRotation, 
  getRotationGroup, 
  calculateRotationScore,
  ROTATION_GROUPS
} from './crop-rotation'

interface CandidateScore {
  vegetableId: string
  totalScore: number
  companionScore: number
  rotationScore: number
  difficultyMatch: boolean
}

/**
 * Auto-fill a plot with suggested vegetables
 */
export function autoFillPlot(
  plot: GridPlot,
  options: AutoFillOptions,
  history: RotationHistory[],
  year: number
): PlotCell[] {
  const suggestedRotation = getSuggestedRotation(plot.id, year, history)
  
  // Get empty cells
  const emptyCells = plot.cells.filter(c => !c.vegetableId)
  if (emptyCells.length === 0) return plot.cells
  
  // Build candidate list
  const candidates = getVegetableCandidates(suggestedRotation, options)
  
  // Make a mutable copy of the cells for simulation
  const filledCells: PlotCell[] = options.respectExisting 
    ? [...plot.cells]
    : plot.cells.map(c => ({ ...c, vegetableId: undefined, plantedYear: undefined }))
  
  // Create a simulation plot for scoring
  const simulationPlot: GridPlot = { ...plot, cells: filledCells }
  
  // Fill each empty cell with the best candidate
  for (const emptyCell of emptyCells) {
    const cellIndex = filledCells.findIndex(c => c.id === emptyCell.id)
    if (cellIndex === -1) continue
    
    // Score each candidate for this cell
    const scores: CandidateScore[] = candidates.map(vegId => {
      const companionScore = calculateCompanionScore(vegId, filledCells[cellIndex], simulationPlot)
      const rotationScore = calculateRotationScore(vegId, plot.id, year, history)
      
      let totalScore: number
      switch (options.strategy) {
        case 'rotation-first':
          totalScore = rotationScore * 0.7 + companionScore * 0.3
          break
        case 'companion-first':
          totalScore = companionScore * 0.7 + rotationScore * 0.3
          break
        case 'balanced':
        default:
          totalScore = (companionScore + rotationScore) / 2
      }
      
      const veg = getVegetableById(vegId)
      const difficultyMatch = options.difficultyFilter === 'all' || 
        veg?.care.difficulty === 'beginner'
      
      // Boost score for difficulty match
      if (difficultyMatch) totalScore += 5
      
      return {
        vegetableId: vegId,
        totalScore,
        companionScore,
        rotationScore,
        difficultyMatch
      }
    }).filter(s => options.difficultyFilter === 'all' || s.difficultyMatch)
    
    // Sort by total score
    scores.sort((a, b) => b.totalScore - a.totalScore)
    
    // Pick the best candidate (add some variety by picking from top 3 randomly)
    const topCandidates = scores.slice(0, 3)
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]
    
    if (selected) {
      // Update the simulation
      filledCells[cellIndex] = {
        ...filledCells[cellIndex],
        vegetableId: selected.vegetableId,
        plantedYear: year
      }
    }
  }
  
  return filledCells
}

/**
 * Get vegetable candidates based on rotation group and options
 */
function getVegetableCandidates(
  suggestedRotation: RotationGroup,
  options: AutoFillOptions
): string[] {
  // Get vegetables in the suggested rotation group
  const rotationCategories = Object.entries(ROTATION_GROUPS)
    .filter(([, group]) => group === suggestedRotation)
    .map(([category]) => category)
  
  let candidates = vegetables
    .filter(v => rotationCategories.includes(v.category))
    .filter(v => options.difficultyFilter === 'all' || v.care.difficulty === 'beginner')
    .map(v => v.id)
  
  // If no candidates in rotation group, expand to all
  if (candidates.length === 0) {
    candidates = vegetables
      .filter(v => options.difficultyFilter === 'all' || v.care.difficulty === 'beginner')
      .map(v => v.id)
  }
  
  return candidates
}

/**
 * Get auto-fill preview without applying changes
 */
export function previewAutoFill(
  plot: GridPlot,
  options: AutoFillOptions,
  history: RotationHistory[],
  year: number
): Array<{ cellId: string; vegetableId: string; reason: string }> {
  const filledCells = autoFillPlot(plot, options, history, year)
  const previews: Array<{ cellId: string; vegetableId: string; reason: string }> = []
  
  for (const cell of filledCells) {
    // Find original cell
    const originalCell = plot.cells.find(c => c.id === cell.id)
    
    // If this cell was empty and now has a vegetable
    if (!originalCell?.vegetableId && cell.vegetableId) {
      const veg = getVegetableById(cell.vegetableId)
      const group = getRotationGroup(cell.vegetableId)
      const reason = `${veg?.name || 'Plant'} (${group}) - matches rotation suggestion`
      
      previews.push({
        cellId: cell.id,
        vegetableId: cell.vegetableId,
        reason
      })
    }
  }
  
  return previews
}

/**
 * Get statistics about current plot rotation compliance
 */
export function getPlotRotationStats(
  plot: GridPlot,
  history: RotationHistory[],
  year: number
): {
  suggestedGroup: RotationGroup
  compliance: number
  groupCounts: Record<RotationGroup, number>
} {
  const suggestedGroup = getSuggestedRotation(plot.id, year, history)
  
  const groupCounts: Record<RotationGroup, number> = {
    'brassicas': 0,
    'legumes': 0,
    'roots': 0,
    'solanaceae': 0,
    'alliums': 0,
    'cucurbits': 0,
    'permanent': 0
  }
  
  let totalPlanted = 0
  let matchingSuggested = 0
  
  for (const cell of plot.cells) {
    if (cell.vegetableId) {
      totalPlanted++
      const group = getRotationGroup(cell.vegetableId)
      if (group) {
        groupCounts[group]++
        if (group === suggestedGroup) matchingSuggested++
      }
    }
  }
  
  const compliance = totalPlanted > 0 ? Math.round((matchingSuggested / totalPlanted) * 100) : 0
  
  return {
    suggestedGroup,
    compliance,
    groupCounts
  }
}

