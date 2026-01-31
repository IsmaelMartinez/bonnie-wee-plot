'use client'

import { useMemo } from 'react'
import { GridItemConfig } from '@/data/allotment-layout'
import { Planting, Area } from '@/types/unified-allotment'
import { getVegetableCategory } from '@/lib/vegetable-loader'
import { getPlantEmoji } from '@/lib/plant-emoji'
import { getColorValue } from '@/lib/colors'
import PerennialStatusBadge from './PerennialStatusBadge'

interface BedItemProps {
  item: GridItemConfig
  isSelected?: boolean
  isEditing?: boolean
  plantings?: Planting[]
  area?: Area
  selectedYear?: number
}

export default function BedItem({ item, isSelected, isEditing, plantings = [], area, selectedYear }: BedItemProps) {
  // Get icon from plantings if available, otherwise use default
  const getPlantingIcon = (): string | undefined => {
    if (plantings.length === 0) return item.icon

    // Get first planting's category and show its emoji
    const firstPlanting = plantings[0]
    const category = getVegetableCategory(firstPlanting.plantId)
    if (category) {
      return getPlantEmoji(category)
    }
    return item.icon
  }

  const displayIcon = getPlantingIcon()

  // Determine text color based on background brightness
  const getTextColor = (bgColor?: string) => {
    if (!bgColor) return 'text-gray-700'
    // Convert semantic color name to hex if needed
    const hex = getColorValue(bgColor).replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? 'text-gray-800' : 'text-white'
  }

  const textColor = getTextColor(item.color)

  // Temporal status checks with defensive validation
  const isNew = useMemo(() => {
    if (!area || !selectedYear || typeof selectedYear !== 'number') return false
    if (!area.createdYear || typeof area.createdYear !== 'number') return false
    return area.createdYear === selectedYear
  }, [area, selectedYear])

  const isRetired = useMemo(() => {
    if (!area || !selectedYear || typeof selectedYear !== 'number') return false
    if (!area.retiredYear || typeof area.retiredYear !== 'number') return false
    return area.retiredYear <= selectedYear
  }, [area, selectedYear])

  const recentYears = useMemo(() => {
    if (!area || !selectedYear || typeof selectedYear !== 'number') return false
    if (!area.createdYear || typeof area.createdYear !== 'number') return false
    return (selectedYear - area.createdYear) <= 3 && selectedYear > area.createdYear
  }, [area, selectedYear])

  // Style variations based on type
  const getTypeStyles = () => {
    let styles = ''
    switch (item.type) {
      case 'path':
        styles = 'opacity-60'
        break
      case 'area':
        styles = item.label ? '' : 'opacity-30' // Empty areas are more transparent
        break
      case 'tree':
        styles = 'rounded-full'
        break
    }
    // Apply dimmed styling if retired
    if (isRetired) {
      styles = (styles ? styles + ' ' : '') + 'opacity-50'
    }
    return styles
  }

  return (
    <div
      className={`
        w-full h-full rounded-lg flex flex-col items-center justify-center
        transition-all duration-200 overflow-hidden relative
        ${getTypeStyles()}
        ${isSelected ? 'ring-4 ring-yellow-500 ring-offset-2 shadow-lg' : ''}
        ${isEditing ? 'hover:opacity-80' : item.bedId ? 'hover:shadow-lg' : ''}
        ${item.type === 'path' ? 'rounded-md' : ''}
      `}
      style={{
        backgroundColor: getColorValue(item.color),
      }}
    >
      {/* Icon - shows planting icon if available */}
      {displayIcon && (
        <span className="text-lg leading-none" role="img" aria-label={item.label}>
          {displayIcon}
        </span>
      )}

      {/* Label */}
      {item.label && (
        <div className={`text-xs font-bold ${textColor} text-center px-1 leading-tight`}>
          {item.label}
        </div>
      )}

      {/* Temporal Status Badges */}
      {area && selectedYear && (
        <div className="absolute inset-x-0 top-0.5 flex flex-wrap justify-center gap-0.5 px-0.5">
          {/* New badge */}
          {isNew && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-zen-moss-200 text-zen-moss-800 font-medium whitespace-nowrap">
              New {selectedYear}
            </span>
          )}

          {/* Since badge for recent creation */}
          {recentYears && !isNew && area.createdYear && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-zen-water-100 text-zen-water-700 whitespace-nowrap">
              Since {area.createdYear}
            </span>
          )}

          {/* Perennial status badge for trees, berries, and perennial beds */}
          {area.primaryPlant && selectedYear && (
            <PerennialStatusBadge area={area} currentYear={selectedYear} compact />
          )}

          {/* Retired indicator */}
          {isRetired && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-zen-stone-300 text-zen-stone-800 font-medium whitespace-nowrap">
              Retired
            </span>
          )}
        </div>
      )}

      {/* Edit mode indicator */}
      {isEditing && !item.static && (
        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}




