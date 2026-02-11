'use client'

import { useState } from 'react'
import { Plus, Layers, Leaf, X, Check } from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { NewPlanting, Planting } from '@/types/unified-allotment'
import { VegetableCategory } from '@/types/garden-planner'
import { getVegetableIndexById } from '@/lib/vegetables/index'
import PlantCombobox from '@/components/allotment/PlantCombobox'

interface UnderplantingsListProps {
  parentAreaId: string
  parentAreaName: string
}

/**
 * UnderplantingsList - Shows plantings for a non-rotation area
 *
 * In v10, all areas can have plantings. This component displays
 * and manages plantings for permanent areas (trees, berries, etc.)
 * where you might plant things underneath (strawberries under apple tree,
 * herbs around berries, etc.)
 */
export default function UnderplantingsList({ parentAreaId, parentAreaName }: UnderplantingsListProps) {
  const {
    getPlantings,
    addPlanting,
    removePlanting,
    selectedYear,
  } = useAllotment()

  const [isAdding, setIsAdding] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState('')
  const [variety, setVariety] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')

  const plantings = getPlantings(parentAreaId)

  const handleAdd = () => {
    if (!selectedPlantId) return

    const newPlanting: NewPlanting = {
      plantId: selectedPlantId,
      varietyName: variety || undefined,
    }
    addPlanting(parentAreaId, newPlanting)

    setSelectedPlantId('')
    setVariety('')
    setCategoryFilter('all')
    setIsAdding(false)
  }

  const handleRemove = (plantingId: string) => {
    if (confirm('Remove this planting?')) {
      removePlanting(parentAreaId, plantingId)
    }
  }

  const getPlantName = (plantId: string): string => {
    const plant = getVegetableIndexById(plantId)
    return plant?.name || plantId
  }

  return (
    <div className="bg-zen-water-50 rounded-zen p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zen-water-600" />
          <h4 className="text-sm font-medium text-zen-water-700">
            Plantings ({selectedYear})
          </h4>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-zen-water-600 hover:text-zen-water-700"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-3 p-2 bg-white rounded-zen border border-zen-water-200">
          <PlantCombobox
            value={selectedPlantId}
            onChange={setSelectedPlantId}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            existingPlantings={plantings}
          />
          <input
            type="text"
            placeholder="Variety (optional)"
            value={variety}
            onChange={e => setVariety(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-zen-stone-200 rounded-zen mb-2 mt-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedPlantId}
              className="flex items-center gap-1 text-xs px-3 min-h-[44px] bg-zen-water-500 text-white rounded-zen hover:bg-zen-water-600 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check className="w-3 h-3" />
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setSelectedPlantId('')
                setVariety('')
                setCategoryFilter('all')
              }}
              className="flex items-center gap-1 text-xs px-3 min-h-[44px] bg-zen-stone-200 text-zen-stone-700 rounded-zen hover:bg-zen-stone-300"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {plantings.length === 0 ? (
        <p className="text-xs text-zen-water-500 italic">
          No plantings in {parentAreaName} for {selectedYear}.
        </p>
      ) : (
        <div className="space-y-1">
          {plantings.map((planting: Planting) => (
            <div
              key={planting.id}
              className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 group"
            >
              <div className="flex items-center gap-2">
                <Leaf className="w-3 h-3 text-zen-moss-500" />
                <span className="text-zen-ink-700">{getPlantName(planting.plantId)}</span>
                {planting.varietyName && (
                  <span className="text-zen-stone-400">({planting.varietyName})</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(planting.id)}
                className="opacity-0 group-hover:opacity-100 text-zen-stone-400 hover:text-zen-sakura-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
