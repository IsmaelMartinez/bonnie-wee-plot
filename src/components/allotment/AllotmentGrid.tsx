'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactGridLayout from 'react-grid-layout'
import { Lock, Unlock, RotateCcw } from 'lucide-react'
import {
  DEFAULT_GRID_LAYOUT,
  LAYOUT_STORAGE_KEY,
  GridItemConfig
} from '@/data/allotment-layout'
import { PhysicalBedId, AllotmentItemRef } from '@/types/garden-planner'
import { Planting } from '@/types/unified-allotment'
import BedItem from './BedItem'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface AllotmentGridProps {
  onItemSelect?: (ref: AllotmentItemRef | null) => void
  selectedItemRef?: AllotmentItemRef | null
  getPlantingsForBed?: (bedId: PhysicalBedId) => Planting[]
}

// Layout item type for react-grid-layout
interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

// Convert our config to react-grid-layout format
function configToLayout(config: GridItemConfig[], isEditing: boolean): LayoutItem[] {
  return config.map(item => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    // When not editing, make all items static (immovable)
    static: !isEditing || item.static || false,
  }))
}

// Merge saved layout positions with default config (preserves styling/labels)
function mergeLayoutWithConfig(
  savedLayout: LayoutItem[], 
  defaultConfig: GridItemConfig[]
): GridItemConfig[] {
  return defaultConfig.map(item => {
    const saved = savedLayout.find(l => l.i === item.i)
    if (saved) {
      return {
        ...item,
        x: saved.x,
        y: saved.y,
        w: saved.w,
        h: saved.h,
      }
    }
    return item
  })
}

export default function AllotmentGrid({ onItemSelect, selectedItemRef, getPlantingsForBed }: AllotmentGridProps) {
  const [items, setItems] = useState<GridItemConfig[]>(DEFAULT_GRID_LAYOUT)
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [width, setWidth] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true)
    
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (saved) {
        const savedLayout = JSON.parse(saved) as LayoutItem[]
        const merged = mergeLayoutWithConfig(savedLayout, DEFAULT_GRID_LAYOUT)
        setItems(merged)
      }
    } catch (e) {
      console.warn('Failed to load saved layout:', e)
    }
  }, [])

  // Track container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [mounted])

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    if (!isEditing) return
    
    const merged = mergeLayoutWithConfig(newLayout, items)
    setItems(merged)
    
    // Save to localStorage
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout))
    } catch (e) {
      console.warn('Failed to save layout:', e)
    }
  }, [isEditing, items])

  // Reset to default layout
  const handleReset = () => {
    setItems(DEFAULT_GRID_LAYOUT)
    localStorage.removeItem(LAYOUT_STORAGE_KEY)
  }

  // Handle item click - convert grid item to AllotmentItemRef
  const handleItemClick = (item: GridItemConfig) => {
    if (!onItemSelect) return

    // Determine the item type based on grid item type
    if (item.bedId) {
      // All beds (rotation or perennial) are type 'bed'
      onItemSelect({ type: 'bed', id: item.bedId })
    } else if (item.type === 'perennial' || item.type === 'tree') {
      onItemSelect({ type: 'permanent', id: item.i })
    } else if (item.type === 'infrastructure') {
      onItemSelect({ type: 'infrastructure', id: item.i })
    }
    // Areas like 'grass', 'flowers', 'wildish' are not selectable
  }

  const cols = 12

  if (!mounted) {
    return (
      <div className="bg-gradient-to-b from-green-100/50 to-emerald-100/50 rounded-xl p-4 h-[600px] flex items-center justify-center">
        <div className="text-gray-400">Loading layout...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isEditing 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isEditing ? (
              <>
                <Unlock className="w-4 h-4" />
                Editing
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Locked
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-gray-400">
          {isEditing ? 'Drag items to reposition • Drag corners to resize' : 'Click edit to modify layout'}
        </div>
      </div>

      {/* Grid */}
      <div 
        ref={containerRef}
        className="bg-gradient-to-b from-green-100/50 to-emerald-100/50 rounded-xl p-2 overflow-hidden"
      >
        {/* North label */}
        <div className="text-center text-gray-500 text-xs font-bold mb-1">↑ NORTH</div>
        
        <ReactGridLayout
          {...({
            className: "layout",
            layout: configToLayout(items, isEditing),
            cols: cols,
            rowHeight: 50,
            width: width - 16,
            margin: [6, 6],
            containerPadding: [0, 0],
            onLayoutChange: (layout: LayoutItem[]) => handleLayoutChange([...layout]),
            isDraggable: isEditing,
            isResizable: isEditing,
            compactType: null,
            preventCollision: false,
            useCSSTransforms: true,
          } as unknown as React.ComponentProps<typeof ReactGridLayout>)}
        >
          {items.map(item => {
            const plantings = item.bedId && getPlantingsForBed ? getPlantingsForBed(item.bedId) : []
            // Check if this item is selected based on the unified selection ref
            const isSelected = selectedItemRef && (
              (item.bedId && selectedItemRef.type === 'bed' && selectedItemRef.id === item.bedId) ||
              ((item.type === 'perennial' || item.type === 'tree') && selectedItemRef.type === 'permanent' && selectedItemRef.id === item.i) ||
              (item.type === 'infrastructure' && selectedItemRef.type === 'infrastructure' && selectedItemRef.id === item.i)
            )
            const isClickable = item.bedId || item.type === 'perennial' || item.type === 'tree' || item.type === 'infrastructure'
            return (
              <div
                key={item.i}
                onClick={() => handleItemClick(item)}
                className={isClickable ? 'cursor-pointer' : ''}
              >
                <BedItem
                  item={item}
                  isSelected={!!isSelected}
                  isEditing={isEditing}
                  plantings={plantings}
                />
              </div>
            )
          })}
        </ReactGridLayout>

        {/* South label */}
        <div className="text-center text-gray-500 text-xs font-bold mt-1">↓ SOUTH (Entry)</div>
      </div>
    </div>
  )
}
