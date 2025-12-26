/**
 * BedEditor Component
 * Editing interface for a single garden bed
 */

'use client'

import { useState } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { GridPlot } from '@/types/garden-planner'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getVegetableById } from '@/lib/vegetable-database'
import GardenGrid from './GardenGrid'

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

      {/* Companion Tips */}
      {(tips.good.length > 0 || tips.bad.length > 0) && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Companion Tips</h3>
          <div className="space-y-3">
            {tips.bad.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">⚠️ Avoid together:</p>
                <div className="space-y-1">
                  {tips.bad.map((tip, i) => (
                    <p key={i} className="text-sm text-red-600 pl-4">{tip}</p>
                  ))}
                </div>
              </div>
            )}
            {tips.good.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">✓ Great companions:</p>
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



