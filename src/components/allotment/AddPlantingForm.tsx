'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Check, Users, Package } from 'lucide-react'
import { getVegetableById } from '@/lib/vegetable-database'
import { vegetableIndex } from '@/lib/vegetables/index'
import { getPlantEmoji } from '@/lib/plant-emoji'
import { VegetableCategory, CATEGORY_INFO } from '@/types/garden-planner'
import { getCompanionStatusForVegetable } from '@/lib/companion-utils'
import { useVarieties } from '@/hooks/useVarieties'
import { hasSeedsForYear } from '@/services/variety-storage'
import { NewPlanting, Planting } from '@/types/unified-allotment'

interface AddPlantingFormProps {
  onSubmit: (planting: NewPlanting) => void
  onCancel: () => void
  existingPlantings?: Planting[]
  selectedYear: number
}

export default function AddPlantingForm({
  onSubmit,
  onCancel,
  existingPlantings = [],
  selectedYear
}: AddPlantingFormProps) {
  const { data } = useVarieties()
  const [plantId, setVegetableId] = useState('')
  const [varietyName, setVarietyName] = useState('')
  const [sowDate, setSowDate] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')

  // Get matching varieties from seed library for autocomplete
  // Sort: varieties with seeds first, then alphabetically
  const matchingVarieties = useMemo(() => {
    if (!plantId || !data) return []

    const forPlant = data.varieties.filter(v => v.plantId === plantId)

    return forPlant.sort((a, b) => {
      const aHasSeeds = hasSeedsForYear(a, selectedYear)
      const bHasSeeds = hasSeedsForYear(b, selectedYear)

      // Prioritize varieties with seeds
      if (aHasSeeds && !bHasSeeds) return -1
      if (!aHasSeeds && bHasSeeds) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name)
    })
  }, [plantId, data, selectedYear])
  const selectedVegetable = plantId ? getVegetableById(plantId) : null

  // Pre-select variety if only one match exists
  useEffect(() => {
    if (matchingVarieties.length === 1 && !varietyName) {
      setVarietyName(matchingVarieties[0].name)
    } else if (matchingVarieties.length === 0) {
      setVarietyName('')
    }
  }, [matchingVarieties, varietyName])

  // Calculate companion compatibility with existing plantings
  const companionInfo = plantId
    ? getCompanionStatusForVegetable(plantId, existingPlantings)
    : { goods: [], bads: [] }

  const filteredPlants = useMemo(() => {
    return vegetableIndex
      .filter(v => categoryFilter === 'all' || v.category === categoryFilter)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [categoryFilter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!plantId) return

    onSubmit({
      plantId,
      varietyName: varietyName || undefined,
      sowDate: sowDate || undefined,
      notes: notes || undefined,
    })

    // Reset form
    setVegetableId('')
    setVarietyName('')
    setSowDate('')
    setNotes('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category Filter Tabs */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
              categoryFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Plants
          </button>
          {CATEGORY_INFO.map((info) => (
            <button
              key={info.id}
              type="button"
              onClick={() => setCategoryFilter(info.id)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
                categoryFilter === info.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getPlantEmoji(info.id)} {info.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="vegetable-select" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Plant *
        </label>
        <select
          id="vegetable-select"
          value={plantId}
          onChange={(e) => setVegetableId(e.target.value)}
          required
          className="zen-select"
        >
          <option value="">Select a plant...</option>
          {filteredPlants.map((plant) => (
            <option key={plant.id} value={plant.id}>{plant.name}</option>
          ))}
        </select>

        {/* Companion suggestions panel */}
        {plantId && existingPlantings.length > 0 && (
          <div className="mt-2 space-y-1">
            {companionInfo.goods.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-moss-700 bg-zen-moss-50 px-2 py-1.5 rounded-zen">
                <Check className="w-3 h-3" />
                <span>Good with: {companionInfo.goods.join(', ')}</span>
              </div>
            )}
            {companionInfo.bads.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-kitsune-700 bg-zen-kitsune-50 px-2 py-1.5 rounded-zen">
                <AlertTriangle className="w-3 h-3" />
                <span>Avoid: {companionInfo.bads.join(', ')}</span>
              </div>
            )}
            {companionInfo.goods.length === 0 && companionInfo.bads.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-stone-500 bg-zen-stone-50 px-2 py-1.5 rounded-zen">
                <Users className="w-3 h-3" />
                <span>Neutral with current plantings</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="variety-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Variety Name
        </label>
        <input
          id="variety-input"
          type="text"
          value={varietyName}
          onChange={(e) => setVarietyName(e.target.value)}
          list="variety-suggestions"
          placeholder="e.g., Kelvedon Wonder"
          className="zen-input"
        />
        <datalist id="variety-suggestions">
          {matchingVarieties.map(v => {
            const hasSeeds = hasSeedsForYear(v, selectedYear)
            return (
              <option key={v.id} value={v.name}>
                {hasSeeds ? '● ' : '○ '}{v.name}
              </option>
            )
          })}
        </datalist>
        {plantId && matchingVarieties.length > 0 && (
          <>
            <p className="text-xs text-zen-stone-500 mt-1">
              ● Have seeds  |  ○ Need to order
            </p>
            <a
              href={`/seeds?vegetable=${plantId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs text-zen-moss-600 hover:text-zen-moss-700"
            >
              <Package className="w-3 h-3" />
              View your {matchingVarieties.length} {selectedVegetable?.name.toLowerCase()} {matchingVarieties.length === 1 ? 'variety' : 'varieties'} →
            </a>
          </>
        )}
      </div>

      <div>
        <label htmlFor="sow-date-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Sow Date
        </label>
        <input
          id="sow-date-input"
          type="date"
          value={sowDate}
          onChange={(e) => setSowDate(e.target.value)}
          className="zen-input"
        />
      </div>

      <div>
        <label htmlFor="notes-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes about this planting..."
          className="zen-input"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="zen-btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!plantId}
          className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Planting
        </button>
      </div>
    </form>
  )
}
