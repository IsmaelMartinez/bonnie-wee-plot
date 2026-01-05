'use client'

import { useState, useMemo } from 'react'
import { Zap, Leaf, Calendar, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { GapSuggestion, PlotCell, GridPlot, Month, CATEGORY_INFO } from '@/types/garden-planner'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { checkCompanionCompatibility, getPlantedAdjacentCells } from '@/lib/companion-validation'

interface GapSuggestionsProps {
  selectedCell?: PlotCell
  plot?: GridPlot
  currentMonth?: number
  onQuickPlant: (plantId: string) => void
}

export default function GapSuggestions({
  selectedCell,
  plot,
  currentMonth = new Date().getMonth() + 1,
  onQuickPlant
}: GapSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const suggestions = useMemo(() => {
    if (!selectedCell || !plot || selectedCell.plantId) return []
    
    return suggestGapFillers(selectedCell, plot, currentMonth as Month)
  }, [selectedCell, plot, currentMonth])

  if (!selectedCell || selectedCell.plantId) {
    return null
  }

  const getCategoryColor = (plantId: string) => {
    const veg = getVegetableById(plantId)
    if (!veg) return 'bg-gray-500'
    const cat = CATEGORY_INFO.find(c => c.id === veg.category)
    const colors: Record<string, string> = {
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      lime: 'bg-lime-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500'
    }
    return colors[cat?.color || 'green']
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white
                   flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">Gap Filler Suggestions</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {suggestions.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-4">
          {suggestions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No suggestions available for this cell
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 5).map((suggestion) => {
                const veg = getVegetableById(suggestion.plantId)
                if (!veg) return null

                return (
                  <div
                    key={suggestion.plantId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg
                               border border-gray-200 hover:border-green-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${getCategoryColor(suggestion.plantId)}
                                      flex items-center justify-center`}>
                        <Leaf className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{veg.name}</span>
                          {suggestion.quickGrow && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Quick
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{suggestion.reason}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {veg.planting.daysToHarvest.min}-{veg.planting.daysToHarvest.max} days
                          </span>
                          {suggestion.canPlantNow && (
                            <span className="text-green-600 font-medium">• Plant now</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onQuickPlant(suggestion.plantId)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white
                               text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Plant
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Quick-growing crops like radishes and lettuce are great for filling 
              gaps between slower-growing vegetables, maximizing your harvest.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Generate gap filler suggestions for an empty cell
 */
export function suggestGapFillers(
  emptyCell: PlotCell,
  plot: GridPlot,
  currentMonth: Month
): GapSuggestion[] {
  const suggestions: GapSuggestion[] = []
  const adjacentCells = getPlantedAdjacentCells(emptyCell, plot.cells)
  
  for (const veg of vegetables) {
    // Skip if not suitable for current month
    const canPlantNow = veg.planting.sowOutdoorsMonths.includes(currentMonth) ||
                        veg.planting.transplantMonths.includes(currentMonth)
    
    // Calculate quick grow status
    const quickGrow = veg.planting.daysToHarvest.max <= 60
    
    // Check compatibility with adjacent plants
    let hasConflict = false
    let hasCompanion = false
    
    for (const adjCell of adjacentCells) {
      if (!adjCell.plantId) continue
      const compatibility = checkCompanionCompatibility(veg.id, adjCell.plantId)
      if (compatibility === 'bad') hasConflict = true
      if (compatibility === 'good') hasCompanion = true
    }
    
    // Skip if conflicts with neighbors
    if (hasConflict) continue
    
    // Calculate score
    let score = 50 // Base score
    if (quickGrow) score += 25 // Prefer quick growers
    if (canPlantNow) score += 20 // Prefer plantable now
    if (hasCompanion) score += 15 // Prefer companions
    if (veg.care.difficulty === 'beginner') score += 10 // Prefer easy
    
    // Generate reason
    let reason = ''
    if (quickGrow) {
      reason = `Fast harvest (${veg.planting.daysToHarvest.min}-${veg.planting.daysToHarvest.max} days)`
    } else if (hasCompanion) {
      const companionName = adjacentCells
        .filter(c => c.plantId && checkCompanionCompatibility(veg.id, c.plantId) === 'good')
        .map(c => getVegetableById(c.plantId!)?.name)
        .filter(Boolean)[0]
      reason = companionName ? `Good companion for ${companionName}` : 'Compatible with neighbors'
    } else if (canPlantNow) {
      reason = 'Perfect time to plant'
    } else {
      reason = 'Suitable for this spot'
    }
    
    suggestions.push({
      plantId: veg.id,
      reason,
      score,
      quickGrow,
      canPlantNow
    })
  }
  
  // Sort by score (highest first)
  suggestions.sort((a, b) => b.score - a.score)
  
  // Prioritize quick-growing crops in the top results
  const quickOnes = suggestions.filter(s => s.quickGrow)
  const others = suggestions.filter(s => !s.quickGrow)
  
  return [...quickOnes.slice(0, 3), ...others.slice(0, 2)]
}

