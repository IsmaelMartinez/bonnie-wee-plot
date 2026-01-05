'use client'

import { GridItemConfig } from '@/data/allotment-layout'
import { Planting } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import { getPlantEmoji } from '@/lib/plant-emoji'

interface BedItemProps {
  item: GridItemConfig
  isSelected?: boolean
  isEditing?: boolean
  plantings?: Planting[]
}

export default function BedItem({ item, isSelected, isEditing, plantings = [] }: BedItemProps) {
  // Get icon from plantings if available, otherwise use default
  const getPlantingIcon = (): string | undefined => {
    if (plantings.length === 0) return item.icon

    // Get first planting's vegetable and show its emoji
    const firstPlanting = plantings[0]
    const veg = getVegetableById(firstPlanting.plantId)
    if (veg) {
      return getPlantEmoji(veg.category)
    }
    return item.icon
  }

  const displayIcon = getPlantingIcon()

  // Determine text color based on background brightness
  const getTextColor = (bgColor?: string) => {
    if (!bgColor) return 'text-gray-700'
    // Simple luminance check - dark backgrounds get light text
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? 'text-gray-800' : 'text-white'
  }

  const textColor = getTextColor(item.color)
  
  // Style variations based on type
  const getTypeStyles = () => {
    switch (item.type) {
      case 'path':
        return 'opacity-60'
      case 'area':
        return item.label ? '' : 'opacity-30' // Empty areas are more transparent
      case 'tree':
        return 'rounded-full'
      default:
        return ''
    }
  }

  return (
    <div
      className={`
        w-full h-full rounded-lg flex flex-col items-center justify-center
        transition-all duration-200 overflow-hidden
        ${getTypeStyles()}
        ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 scale-105 z-10' : ''}
        ${isEditing ? 'hover:opacity-80' : item.bedId ? 'hover:scale-[1.02] hover:shadow-lg' : ''}
        ${item.type === 'path' ? 'rounded-md' : ''}
      `}
      style={{ 
        backgroundColor: item.color || '#e5e7eb',
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

      {/* Edit mode indicator */}
      {isEditing && !item.static && (
        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}




