'use client'

import { AlertTriangle } from 'lucide-react'
import { GridItemConfig } from '@/data/allotment-layout'

interface BedItemProps {
  item: GridItemConfig
  isSelected?: boolean
  isEditing?: boolean
}

export default function BedItem({ item, isSelected, isEditing }: BedItemProps) {
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
      {/* Icon */}
      {item.icon && (
        <span className="text-lg leading-none" role="img" aria-label={item.label}>
          {item.icon}
        </span>
      )}
      
      {/* Label */}
      {item.label && (
        <div className={`text-xs font-bold ${textColor} text-center px-1 leading-tight`}>
          {item.label}
        </div>
      )}
      
      {/* Problem indicator */}
      {item.isProblem && (
        <div className={`flex items-center gap-0.5 text-[10px] ${textColor} opacity-80`}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>Problem</span>
        </div>
      )}

      {/* Edit mode indicator */}
      {isEditing && !item.static && (
        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}

