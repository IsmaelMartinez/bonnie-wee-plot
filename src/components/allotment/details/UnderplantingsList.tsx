'use client'

import { useState } from 'react'
import { Plus, Layers, Leaf, X, Check, Calendar } from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { NewPermanentUnderplanting, NewSeasonalUnderplanting } from '@/types/unified-allotment'
import { vegetableIndex, VegetableIndex } from '@/lib/vegetables'

interface UnderplantingsListProps {
  parentAreaId: string
  parentAreaName: string
}

type UnderplantingType = 'permanent' | 'seasonal'

export default function UnderplantingsList({ parentAreaId, parentAreaName }: UnderplantingsListProps) {
  const {
    getPermanentUnderplantings,
    getSeasonalUnderplantings,
    addPermanentUnderplanting,
    addSeasonalUnderplanting,
    removePermanentUnderplanting,
    removeSeasonalUnderplanting,
    selectedYear,
  } = useAllotment()

  const [isAdding, setIsAdding] = useState(false)
  const [underplantingType, setUnderplantingType] = useState<UnderplantingType>('permanent')
  const [selectedPlantId, setSelectedPlantId] = useState('')
  const [variety, setVariety] = useState('')

  const permanentUnderplantings = getPermanentUnderplantings(parentAreaId)
  const seasonalUnderplantings = getSeasonalUnderplantings(parentAreaId)

  const handleAdd = () => {
    if (!selectedPlantId) return

    if (underplantingType === 'permanent') {
      const newUnderplanting: NewPermanentUnderplanting = {
        parentAreaId,
        plantId: selectedPlantId,
        variety: variety || undefined,
        plantedYear: new Date().getFullYear(),
      }
      addPermanentUnderplanting(newUnderplanting)
    } else {
      const newUnderplanting: NewSeasonalUnderplanting = {
        plantId: selectedPlantId,
        varietyName: variety || undefined,
      }
      addSeasonalUnderplanting(parentAreaId, newUnderplanting)
    }

    setSelectedPlantId('')
    setVariety('')
    setIsAdding(false)
  }

  const handleRemovePermanent = (id: string) => {
    if (confirm('Remove this permanent underplanting?')) {
      removePermanentUnderplanting(id)
    }
  }

  const handleRemoveSeasonal = (id: string) => {
    if (confirm('Remove this seasonal underplanting?')) {
      removeSeasonalUnderplanting(parentAreaId, id)
    }
  }

  const getPlantName = (plantId: string): string => {
    const plant = vegetableIndex.find((v: VegetableIndex) => v.id === plantId)
    return plant?.name || plantId
  }

  const hasUnderplantings = permanentUnderplantings.length > 0 || seasonalUnderplantings.length > 0

  return (
    <div className="bg-zen-water-50 rounded-zen p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zen-water-600" />
          <h4 className="text-sm font-medium text-zen-water-700">
            Underplantings
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
          <div className="flex gap-2 mb-2">
            <select
              value={underplantingType}
              onChange={e => setUnderplantingType(e.target.value as UnderplantingType)}
              className="text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
            >
              <option value="permanent">Permanent</option>
              <option value="seasonal">Seasonal ({selectedYear})</option>
            </select>
          </div>
          <select
            value={selectedPlantId}
            onChange={e => setSelectedPlantId(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-zen-stone-200 rounded-zen mb-2"
          >
            <option value="">Select plant...</option>
            {vegetableIndex.map((v: VegetableIndex) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Variety (optional)"
            value={variety}
            onChange={e => setVariety(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-zen-stone-200 rounded-zen mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedPlantId}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-water-500 text-white rounded-zen hover:bg-zen-water-600 disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-stone-200 text-zen-stone-700 rounded-zen hover:bg-zen-stone-300"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {!hasUnderplantings ? (
        <p className="text-xs text-zen-water-500 italic">
          No underplantings under {parentAreaName}.
        </p>
      ) : (
        <div className="space-y-2">
          {permanentUnderplantings.length > 0 && (
            <div>
              <div className="text-xs text-zen-stone-500 mb-1">Permanent</div>
              <div className="space-y-1">
                {permanentUnderplantings.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-3 h-3 text-zen-moss-500" />
                      <span className="text-zen-ink-700">{getPlantName(u.plantId)}</span>
                      {u.variety && (
                        <span className="text-zen-stone-400">({u.variety})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePermanent(u.id)}
                      className="opacity-0 group-hover:opacity-100 text-zen-stone-400 hover:text-zen-sakura-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seasonalUnderplantings.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs text-zen-stone-500 mb-1">
                <Calendar className="w-3 h-3" />
                {selectedYear}
              </div>
              <div className="space-y-1">
                {seasonalUnderplantings.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-3 h-3 text-zen-kitsune-500" />
                      <span className="text-zen-ink-700">{getPlantName(u.plantId)}</span>
                      {u.varietyName && (
                        <span className="text-zen-stone-400">({u.varietyName})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSeasonal(u.id)}
                      className="opacity-0 group-hover:opacity-100 text-zen-stone-400 hover:text-zen-sakura-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
