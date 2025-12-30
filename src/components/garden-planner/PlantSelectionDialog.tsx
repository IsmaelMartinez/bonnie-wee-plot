'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check, AlertTriangle } from 'lucide-react'
import { Vegetable, CATEGORY_INFO, VegetableCategory } from '@/types/garden-planner'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getPlantEmoji } from '@/lib/plant-emoji'

interface PlantSelectionDialogProps {
  isOpen: boolean
  currentVegetable: Vegetable | null
  plantedVegetableIds: string[]
  onSelect: (vegetableId: string) => void
  onRemove: () => void
  onClose: () => void
}

export default function PlantSelectionDialog({
  isOpen,
  currentVegetable,
  plantedVegetableIds,
  onSelect,
  onRemove,
  onClose,
}: PlantSelectionDialogProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')

  // Reset filters when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setCategoryFilter('all')
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Get compatibility details for a plant based on what's already planted
  function getCompatibilityDetails(vegetableId: string): {
    status: 'good' | 'neutral' | 'bad'
    goodWith: string[]
    badWith: string[]
  } {
    const goodWith: string[] = []
    const badWith: string[] = []

    for (const plantedId of plantedVegetableIds) {
      const compat = checkCompanionCompatibility(vegetableId, plantedId)
      const plantedVeg = getVegetableById(plantedId)
      if (compat === 'good' && plantedVeg) goodWith.push(plantedVeg.name)
      if (compat === 'bad' && plantedVeg) badWith.push(plantedVeg.name)
    }

    const status = badWith.length > 0 ? 'bad' : goodWith.length > 0 ? 'good' : 'neutral'
    return { status, goodWith, badWith }
  }

  // Filter plants
  const filteredPlants = vegetables.filter(v => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plant-selection-title"
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 id="plant-selection-title" className="text-lg font-semibold text-gray-800">
              {currentVegetable ? `Change plant in cell` : `Select a plant`}
            </h2>
            {currentVegetable && (
              <p className="text-sm text-gray-500">Currently: {currentVegetable.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
              aria-label="Search plants"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 border-b overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                categoryFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORY_INFO.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === cat.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getPlantEmoji(cat.id)} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 bg-gray-50 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Good companion
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span> Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Avoid
          </span>
        </div>

        {/* Plant list */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredPlants.map(plant => {
              const { status, goodWith, badWith } = getCompatibilityDetails(plant.id)
              const bgColor = status === 'good'
                ? 'bg-green-50 hover:bg-green-100 border-green-200'
                : status === 'bad'
                ? 'bg-red-50 hover:bg-red-100 border-red-200'
                : 'bg-white hover:bg-gray-50 border-gray-200'

              return (
                <button
                  key={plant.id}
                  onClick={() => onSelect(plant.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPlantEmoji(plant.category)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 truncate">{plant.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {CATEGORY_INFO.find(c => c.id === plant.category)?.name}
                      </div>
                      {goodWith.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-700">
                          <Check className="w-3 h-3 shrink-0" />
                          <span className="truncate">Good: {goodWith.join(', ')}</span>
                        </div>
                      )}
                      {badWith.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">Avoid: {badWith.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {filteredPlants.length === 0 && (
            <p className="text-center text-gray-400 py-8">No plants found</p>
          )}
        </div>

        {/* Remove button */}
        {currentVegetable && (
          <div className="p-4 border-t">
            <button
              onClick={onRemove}
              className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium flex items-center justify-center gap-2"
              aria-label={`Remove ${currentVegetable.name} from this cell`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Remove {currentVegetable.name}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
