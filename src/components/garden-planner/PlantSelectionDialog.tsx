'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Check, AlertTriangle, X, MessageCircle } from 'lucide-react'
import { Vegetable, CATEGORY_INFO, VegetableCategory } from '@/types/garden-planner'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusByIds } from '@/lib/companion-utils'
import { getPlantEmoji } from '@/lib/plant-emoji'
import Dialog from '@/components/ui/Dialog'
import InlineAIPrompt from '@/components/ai-advisor/InlineAIPrompt'

interface PlantSelectionDialogProps {
  isOpen: boolean
  currentVegetable: Vegetable | null
  plantedVegetableIds: string[]
  onSelect: (plantId: string) => void
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

  // Build context for AI prompt
  const plantedNames = useMemo(() => {
    return plantedVegetableIds
      .map(id => getVegetableById(id)?.name)
      .filter((name): name is string => !!name)
  }, [plantedVegetableIds])

  const aiQuestion = useMemo(() => {
    if (plantedNames.length === 0) {
      return 'What vegetables would you recommend for a beginner to start with in their allotment?'
    }
    const plantList = plantedNames.slice(0, 3).join(', ')
    return `I have ${plantList} in my bed. What would be a good companion plant to add?`
  }, [plantedNames])

  const aiContext = useMemo(() => {
    if (plantedNames.length === 0) {
      return 'The user is selecting plants for their allotment bed. The bed is currently empty.'
    }
    return `The user is selecting plants for their allotment bed. Currently planted: ${plantedNames.join(', ')}. Suggest good companion plants based on companion planting principles.`
  }, [plantedNames])

  // Filter and sort plants (good companions first)
  const filteredPlants = useMemo(() => {
    const filtered = vegetables.filter(v => {
      const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    // Sort by companion compatibility if there are planted vegetables
    if (plantedVegetableIds.length === 0) return filtered

    return [...filtered].sort((a, b) => {
      const statusA = getCompanionStatusByIds(a.id, plantedVegetableIds)
      const statusB = getCompanionStatusByIds(b.id, plantedVegetableIds)

      // Score: good companions first, then neutral, then bad
      const scoreA = statusA.goodWith.length - statusA.badWith.length * 2
      const scoreB = statusB.goodWith.length - statusB.badWith.length * 2

      return scoreB - scoreA
    })
  }, [search, categoryFilter, plantedVegetableIds])

  const title = currentVegetable ? 'Change plant in cell' : 'Select a plant'
  const description = currentVegetable ? `Currently: ${currentVegetable.name}` : undefined

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="2xl"
      fullContent
    >
      {/* Search and AI Help */}
      <div className="p-4 border-b shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <InlineAIPrompt
            contextQuestion={aiQuestion}
            allotmentContext={aiContext}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Ask Aitor</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 border-b overflow-x-auto shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm whitespace-nowrap transition ${
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
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm whitespace-nowrap transition flex items-center gap-1 ${
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
      <div className="px-4 py-2 bg-gray-50 flex gap-4 text-xs text-gray-500 shrink-0">
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
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredPlants.map(plant => {
            const { status, goodWith, badWith } = getCompanionStatusByIds(plant.id, plantedVegetableIds)
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
        <div className="p-4 border-t shrink-0">
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
    </Dialog>
  )
}
