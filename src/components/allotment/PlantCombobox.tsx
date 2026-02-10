'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, AlertTriangle, Check } from 'lucide-react'
import { searchAndScoreVegetables, getVegetableIndexById } from '@/lib/vegetables/index'
import { getPlantEmoji } from '@/lib/plant-emoji'
import { VegetableCategory, CATEGORY_INFO } from '@/types/garden-planner'
import { getCompanionStatusForVegetable } from '@/lib/companion-utils'
import { Planting } from '@/types/unified-allotment'
import { useCombobox } from '@/hooks/useCombobox'

interface PlantComboboxProps {
  value: string
  onChange: (plantId: string) => void
  categoryFilter: VegetableCategory | 'all'
  onCategoryChange: (category: VegetableCategory | 'all') => void
  existingPlantings: Planting[]
  required?: boolean
}

export default function PlantCombobox({
  value,
  onChange,
  categoryFilter,
  onCategoryChange,
  existingPlantings,
  required = false
}: PlantComboboxProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get selected plant for display
  const selectedPlant = value ? getVegetableIndexById(value) : null
  const displayValue = selectedPlant?.name || ''

  // Filter and search plants with scoring
  const filteredPlants = useMemo(() => {
    const category = categoryFilter === 'all' ? undefined : categoryFilter
    return searchAndScoreVegetables(searchQuery, category)
  }, [searchQuery, categoryFilter])

  // Handle plant selection
  const handleSelect = (plantId: string) => {
    onChange(plantId)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Use combobox hook for keyboard navigation
  const {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    listRef,
    itemRefs,
  } = useCombobox({
    items: filteredPlants,
    onSelect: (plant) => handleSelect(plant.id),
    onClose: () => setIsOpen(false),
    isOpen,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Attach keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <div ref={containerRef} className="relative">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
            categoryFilter === 'all'
              ? 'bg-zen-moss-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Plants
        </button>
        {CATEGORY_INFO.map((info) => (
          <button
            key={info.id}
            type="button"
            onClick={() => onCategoryChange(info.id)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
              categoryFilter === info.id
                ? 'bg-zen-moss-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getPlantEmoji(info.id)} {info.name}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setSearchQuery('')
          }}
          onClick={() => setIsOpen(true)}
          placeholder="Search plants..."
          required={required}
          className="zen-input pr-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="plant-listbox"
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 && filteredPlants[highlightedIndex]
              ? `plant-option-${filteredPlants[highlightedIndex].id}`
              : undefined
          }
          aria-label="Search for a plant"
        />

        {/* Dropdown icon */}
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zen-stone-500 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          id="plant-listbox"
          role="listbox"
          aria-label="Plant search results"
          className="absolute z-50 w-full mt-1 bg-white border border-zen-stone-300 rounded-zen shadow-zen-md max-h-80 overflow-y-auto"
        >
          {filteredPlants.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zen-stone-500">
              No plants found
            </li>
          ) : (
            filteredPlants.slice(0, 50).map((plant, index) => {
              // Get companion status for this plant
              const companionStatus = getCompanionStatusForVegetable(
                plant.id,
                existingPlantings
              )
              const isSelected = plant.id === value
              const isHighlighted = index === highlightedIndex

              return (
                <li
                  key={plant.id}
                  id={`plant-option-${plant.id}`}
                  ref={(el) => {
                    if (el) itemRefs.current.set(index, el)
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(plant.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-zen-moss-50'
                      : isSelected
                      ? 'bg-zen-moss-100'
                      : 'hover:bg-zen-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Plant name and emoji */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium text-zen-ink-800 truncate">
                        {plant.name}
                      </span>
                      <span className="text-xs shrink-0" aria-label={`Category: ${plant.category}`}>
                        {getPlantEmoji(plant.category)}
                      </span>
                    </div>

                    {/* Companion indicators */}
                    <div className="flex items-center gap-1 shrink-0">
                      {companionStatus.bads.length > 0 && (
                        <AlertTriangle
                          className="w-4 h-4 text-zen-kitsune-600"
                          aria-label="Has incompatible companions"
                        />
                      )}
                      {companionStatus.goods.length > 0 && companionStatus.bads.length === 0 && (
                        <Check
                          className="w-4 h-4 text-zen-moss-600"
                          aria-label="Has beneficial companions"
                        />
                      )}
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      )}

      {/* Result count for screen readers */}
      {isOpen && filteredPlants.length > 0 && (
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'} found
          {filteredPlants.length > 50 && ', showing first 50'}
        </div>
      )}
    </div>
  )
}
