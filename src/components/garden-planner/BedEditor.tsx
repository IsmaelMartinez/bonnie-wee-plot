/**
 * BedEditor Component
 * Editing interface for a single garden bed
 */

'use client'

import { useState, useMemo } from 'react'
import { Trash2, Edit2, Check, X, AlertTriangle, Sparkles } from 'lucide-react'
import { GridPlot, RotationGroup } from '@/types/garden-planner'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getVegetableById } from '@/lib/vegetable-database'
import { getRotationGroup, ROTATION_GROUP_DISPLAY } from '@/lib/rotation'
import GardenGrid from './GardenGrid'
import InlineAIPrompt from '@/components/ai-advisor/InlineAIPrompt'

interface BedEditorProps {
  bed: GridPlot
  canDelete: boolean
  showCalendar: boolean
  onAssign: (cellId: string, vegetableId: string) => void
  onClear: (cellId: string) => void
  onResize: (rows: number, cols: number) => void
  onClearAll: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

export default function BedEditor({
  bed,
  canDelete,
  showCalendar,
  onAssign,
  onClear,
  onResize,
  onClearAll,
  onRename,
  onDelete
}: BedEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState('')

  // Detect rotation conflicts - multiple rotation groups in the same bed
  const rotationConflict = useMemo(() => {
    const plantedCells = bed.cells.filter(c => c.vegetableId)
    if (plantedCells.length === 0) return null

    const rotationGroups = new Map<RotationGroup, string[]>()

    for (const cell of plantedCells) {
      const veg = getVegetableById(cell.vegetableId!)
      if (!veg) continue

      const group = getRotationGroup(cell.vegetableId!)
      if (!group || group === 'permanent') continue

      const existing = rotationGroups.get(group) || []
      existing.push(veg.name)
      rotationGroups.set(group, existing)
    }

    // Only flag as conflict if we have multiple different groups (excluding permanent)
    if (rotationGroups.size > 1) {
      const groups = Array.from(rotationGroups.entries()).map(([group, vegs]) => ({
        group,
        display: ROTATION_GROUP_DISPLAY[group],
        vegetables: vegs
      }))
      return groups
    }

    return null
  }, [bed.cells])

  // Build context for AI about the bed's plantings
  const buildAllotmentContext = (): string => {
    const plantedCells = bed.cells.filter(c => c.vegetableId)
    if (plantedCells.length === 0) return `Bed "${bed.name}" has no plantings yet.`

    const plantNames = plantedCells
      .map(c => getVegetableById(c.vegetableId!)?.name)
      .filter(Boolean)
      .join(', ')

    let context = `Bed "${bed.name}" currently contains: ${plantNames}.`

    if (rotationConflict) {
      context += ` This bed has plants from multiple rotation groups: `
      context += rotationConflict
        .map(g => `${g.display.name} (${g.vegetables.join(', ')})`)
        .join('; ')
      context += '.'
    }

    return context
  }

  // Build the question about rotation conflict
  const buildRotationQuestion = (): string => {
    if (!rotationConflict || rotationConflict.length < 2) {
      return 'Is it okay to mix different vegetable families in the same bed?'
    }

    const groupNames = rotationConflict.map(g => g.display.name).join(' and ')
    return `My garden bed has both ${groupNames} growing together. Should I be concerned about mixing these families, and what are the implications for soil health and next year's rotation?`
  }

  // Get companion tips for the bed
  const getCompanionTips = (): { good: string[], bad: string[] } => {
    const good: string[] = []
    const bad: string[] = []
    const plantedCells = bed.cells.filter(c => c.vegetableId)
    
    for (let i = 0; i < plantedCells.length; i++) {
      for (let j = i + 1; j < plantedCells.length; j++) {
        const veg1 = getVegetableById(plantedCells[i].vegetableId!)
        const veg2 = getVegetableById(plantedCells[j].vegetableId!)
        if (!veg1 || !veg2) continue
        
        const compat = checkCompanionCompatibility(veg1.id, veg2.id)
        if (compat === 'good') {
          good.push(`${veg1.name} + ${veg2.name}`)
        } else if (compat === 'bad') {
          bad.push(`${veg1.name} + ${veg2.name}`)
        }
      }
    }
    
    return { good: good.slice(0, 5), bad: bad.slice(0, 5) }
  }

  const handleStartEdit = () => {
    setEditingName(bed.name)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editingName.trim()) {
      onRename(editingName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingName('')
  }

  const tips = getCompanionTips()

  return (
    <>
      {/* Bed Header */}
      <div className="bg-white rounded-t-xl shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="px-2 py-1 border rounded text-sm font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
              />
              <button 
                onClick={handleSaveEdit} 
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                aria-label="Save name"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={handleCancelEdit} 
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="font-medium text-gray-800">{bed.name}</span>
              <button
                onClick={handleStartEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                aria-label="Edit bed name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete this bed"
            aria-label="Delete this bed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar overlay */}
      {showCalendar && (
        <div className="bg-white shadow-md p-6 mb-0 border-t">
          <h2 className="font-semibold text-gray-800 mb-4">Planting Calendar</h2>
          <div className="grid grid-cols-12 gap-1 text-xs">
            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
              <div key={i} className="text-center text-gray-500 font-medium">{m}</div>
            ))}
          </div>
          {bed.cells.filter(c => c.vegetableId).map(cell => {
            const veg = getVegetableById(cell.vegetableId!)
            if (!veg) return null
            return (
              <div key={cell.id} className="grid grid-cols-12 gap-1 mt-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const canSow = veg.planting.sowOutdoorsMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12) || 
                                 veg.planting.sowIndoorsMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12)
                  const canHarvest = veg.planting.harvestMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12)
                  return (
                    <div 
                      key={i} 
                      className={`h-4 rounded-sm ${canHarvest ? 'bg-amber-400' : canSow ? 'bg-green-400' : 'bg-gray-100'}`}
                      title={`${veg.name}: ${canSow ? 'Sow' : ''} ${canHarvest ? 'Harvest' : ''}`}
                    />
                  )
                })}
                <span className="col-span-12 text-xs text-gray-600 mt-0.5">{veg.name}</span>
              </div>
            )
          })}
          {bed.cells.filter(c => c.vegetableId).length === 0 && (
            <p className="text-gray-400 text-sm mt-4">Add plants to see their calendar</p>
          )}
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded"></span> Sow</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded"></span> Harvest</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <GardenGrid
        grid={bed}
        onAssign={onAssign}
        onClear={onClear}
        onResize={onResize}
        onClearAll={onClearAll}
      />

      {/* Rotation Conflict Warning with Ask Aitor */}
      {rotationConflict && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Mixed Rotation Groups</h3>
              <p className="text-sm text-amber-700 mb-2">
                This bed contains vegetables from different rotation families:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {rotationConflict.map((group, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-amber-200"
                  >
                    <span>{group.display.emoji}</span>
                    <span>{group.display.name}</span>
                    <span className="text-gray-400">({group.vegetables.length})</span>
                  </span>
                ))}
              </div>
              <InlineAIPrompt
                contextQuestion={buildRotationQuestion()}
                allotmentContext={buildAllotmentContext()}
                trigger={
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    Ask Aitor about this
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Companion Tips */}
      {(tips.good.length > 0 || tips.bad.length > 0) && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Companion Tips</h3>
          <div className="space-y-3">
            {tips.bad.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Avoid together:</p>
                <div className="space-y-1">
                  {tips.bad.map((tip, i) => (
                    <p key={i} className="text-sm text-red-600 pl-4">{tip}</p>
                  ))}
                </div>
              </div>
            )}
            {tips.good.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Great companions:</p>
                <div className="space-y-1">
                  {tips.good.map((tip, i) => (
                    <p key={i} className="text-sm text-green-600 pl-4">{tip}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}




