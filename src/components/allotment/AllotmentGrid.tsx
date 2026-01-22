'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactGridLayout from 'react-grid-layout'
import { Lock, Unlock, RotateCcw, Move } from 'lucide-react'
import {
  DEFAULT_GRID_LAYOUT,
  LAYOUT_STORAGE_KEY,
  GridItemConfig
} from '@/data/allotment-layout'
import { AllotmentItemRef } from '@/types/garden-planner'
import { Area, Planting } from '@/types/unified-allotment'
import { wasAreaActiveInYear } from '@/services/allotment-storage'
import BedItem from './BedItem'
import AllotmentMobileView from './AllotmentMobileView'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface AllotmentGridProps {
  onItemSelect?: (ref: AllotmentItemRef | null) => void
  selectedItemRef?: AllotmentItemRef | null
  getPlantingsForBed?: (bedId: string) => Planting[]
  areas?: Area[]
  selectedYear: number
  onEditingChange?: (isEditing: boolean) => void
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

// Convert Area[] to GridItemConfig[]
function areasToGridConfig(areas: Area[]): GridItemConfig[] {
  return areas
    .filter(area => !area.isArchived) // Don't show archived areas
    .map(area => {
      // Determine type for styling
      let type: GridItemConfig['type'] = 'area'
      if (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') {
        type = 'bed'
      } else if (area.kind === 'tree' || area.kind === 'berry') {
        type = 'tree'
      } else if (area.kind === 'herb') {
        type = 'perennial'
      } else if (area.kind === 'infrastructure') {
        type = 'infrastructure'
      }

      // Use grid position from area or default to bottom
      const pos = area.gridPosition || { x: 0, y: 20, w: 2, h: 2 }

      return {
        i: area.id,
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
        label: area.name,
        type,
        icon: area.icon,
        color: area.color,
        bedId: (area.kind === 'rotation-bed' || area.kind === 'perennial-bed')
          ? area.id as GridItemConfig['bedId']
          : undefined,
      }
    })
}

export default function AllotmentGrid({ onItemSelect, selectedItemRef, getPlantingsForBed, areas, selectedYear, onEditingChange }: AllotmentGridProps) {
  // Filter areas by selected year
  const visibleAreas = useMemo(() => {
    if (!areas) return undefined
    return areas.filter(area => wasAreaActiveInYear(area, selectedYear))
  }, [areas, selectedYear])

  // Use visible areas from props if provided, otherwise fall back to DEFAULT_GRID_LAYOUT
  const baseConfig = visibleAreas ? areasToGridConfig(visibleAreas) : DEFAULT_GRID_LAYOUT
  const [items, setItems] = useState<GridItemConfig[]>(baseConfig)
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [width, setWidth] = useState(800)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation state for accessibility
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isRepositionMode, setIsRepositionMode] = useState(false)
  const [repositionItemId, setRepositionItemId] = useState<string | null>(null)
  const gridItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Grid column count (used in layout calculations and keyboard repositioning)
  const cols = 12

  // Update items when visible areas change
  useEffect(() => {
    if (visibleAreas) {
      const newConfig = areasToGridConfig(visibleAreas)
      // Merge with any saved layout positions
      try {
        const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
        if (saved) {
          const savedLayout = JSON.parse(saved) as LayoutItem[]
          const merged = mergeLayoutWithConfig(savedLayout, newConfig)
          setItems(merged)
        } else {
          setItems(newConfig)
        }
      } catch (e) {
        console.error('Failed to load saved grid layout, using default config', {
          error: e instanceof Error ? e.message : String(e),
          selectedYear,
          areaCount: newConfig?.length || 0,
          stack: e instanceof Error ? e.stack : undefined
        })
        setItems(newConfig)
      }
    }
  }, [visibleAreas, selectedYear])

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true)

    if (!visibleAreas) {
      // Only use DEFAULT_GRID_LAYOUT if no areas prop
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
    }
  }, [visibleAreas])

  // Track container width and mobile state
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
      // Consider mobile if window width is less than 768px (Tailwind's md breakpoint)
      setIsMobile(window.innerWidth < 768)
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [mounted])

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isEditing)
  }, [isEditing, onEditingChange])

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
  const handleItemClick = useCallback((item: GridItemConfig) => {
    if (!onItemSelect) return

    // When using areas prop, all items are selectable by their id
    if (visibleAreas) {
      const area = visibleAreas.find(a => a.id === item.i)
      if (area) {
        // Use 'bed' type for rotation/perennial beds, 'permanent' for trees/berries/herbs, 'infrastructure' for infra
        if (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') {
          onItemSelect({ type: 'bed', id: area.id })
        } else if (area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb') {
          onItemSelect({ type: 'permanent', id: area.id })
        } else if (area.kind === 'infrastructure') {
          onItemSelect({ type: 'infrastructure', id: area.id })
        } else {
          // 'other' kind - treat as bed for now
          onItemSelect({ type: 'bed', id: area.id })
        }
      }
      return
    }

    // Legacy: Determine the item type based on grid item type
    if (item.bedId) {
      onItemSelect({ type: 'bed', id: item.bedId })
    } else if (item.type === 'perennial' || item.type === 'tree') {
      onItemSelect({ type: 'permanent', id: item.i })
    } else if (item.type === 'infrastructure') {
      onItemSelect({ type: 'infrastructure', id: item.i })
    }
  }, [onItemSelect, visibleAreas])

  // Focus management for keyboard navigation
  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      const item = items[index]
      const button = gridItemRefs.current.get(item.i)
      if (button) {
        button.focus()
        setFocusedIndex(index)
      }
    }
  }, [items])

  // Keyboard navigation handler for grid items
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, item: GridItemConfig, index: number) => {
    // In reposition mode, arrow keys move the item instead of navigation
    if (isRepositionMode && repositionItemId === item.i) {
      const currentLayout = configToLayout(items, isEditing)
      const currentItem = currentLayout.find(l => l.i === item.i)
      if (!currentItem) return

      let newX = currentItem.x
      let newY = currentItem.y

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          newY = Math.max(0, currentItem.y - 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          newY = currentItem.y + 1
          break
        case 'ArrowLeft':
          e.preventDefault()
          newX = Math.max(0, currentItem.x - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          newX = Math.min(cols - currentItem.w, currentItem.x + 1)
          break
        case 'Escape':
        case 'Enter':
          e.preventDefault()
          setIsRepositionMode(false)
          setRepositionItemId(null)
          return
      }

      // Apply the position change
      if (newX !== currentItem.x || newY !== currentItem.y) {
        const newLayout = currentLayout.map(l =>
          l.i === item.i ? { ...l, x: newX, y: newY } : l
        )
        handleLayoutChange(newLayout)
      }
      return
    }

    // Normal navigation mode
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleItemClick(item)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (index >= 1) focusItem(index - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (index < items.length - 1) focusItem(index + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (index >= 1) focusItem(index - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        if (index < items.length - 1) focusItem(index + 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(items.length - 1)
        break
      case 'm':
      case 'M':
        // Enter reposition mode when editing is enabled
        if (isEditing && !item.static) {
          e.preventDefault()
          setIsRepositionMode(true)
          setRepositionItemId(item.i)
        }
        break
    }
  }, [items, isEditing, isRepositionMode, repositionItemId, focusItem, handleItemClick, handleLayoutChange, cols])

  // Exit reposition mode when editing is disabled
  useEffect(() => {
    if (!isEditing) {
      setIsRepositionMode(false)
      setRepositionItemId(null)
    }
  }, [isEditing])

  if (!mounted) {
    return (
      <div className="bg-gradient-to-b from-green-100/50 to-emerald-100/50 rounded-xl p-4 h-[600px] flex items-center justify-center">
        <div className="text-gray-400">Loading layout...</div>
      </div>
    )
  }

  // Show mobile view on small screens
  if (isMobile && visibleAreas) {
    return (
      <AllotmentMobileView
        areas={visibleAreas}
        selectedItemRef={selectedItemRef}
        onItemSelect={onItemSelect}
        getPlantingsForBed={getPlantingsForBed}
        selectedYear={selectedYear}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" role="toolbar" aria-label="Grid controls">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            aria-pressed={isEditing}
            aria-label={isEditing ? 'Stop editing layout' : 'Edit layout'}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition min-h-[44px] ${
              isEditing
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isEditing ? (
              <>
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Editing</span>
                <span className="sm:hidden">Edit</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Locked</span>
                <span className="sm:hidden">Lock</span>
              </>
            )}
          </button>

          {isEditing && (
            <button
              onClick={handleReset}
              aria-label="Reset layout to default"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs text-gray-400 hidden sm:block" aria-live="polite">
          {isEditing ? 'Drag items to reposition • Drag corners to resize • Press M on focused item to reposition with keyboard' : 'Click edit to modify layout'}
        </div>
      </div>

      {/* Year filtering feedback */}
      {visibleAreas && areas && visibleAreas.length < areas.length && (
        <div className="text-sm text-zen-stone-600 bg-zen-stone-50 rounded-lg p-3">
          Showing {visibleAreas.length} of {areas.length} areas active in {selectedYear}.
          {' '}{areas.length - visibleAreas.length} area(s) not yet built or already retired.
        </div>
      )}

      {/* Reposition mode announcement */}
      {isRepositionMode && (
        <div
          role="status"
          aria-live="assertive"
          className="sr-only"
        >
          Reposition mode active. Use arrow keys to move the item. Press Enter or Escape to confirm.
        </div>
      )}

      {/* Grid */}
      <div
        ref={containerRef}
        className="bg-gradient-to-b from-green-100/50 to-emerald-100/50 rounded-xl p-2 overflow-hidden"
        role="grid"
        aria-label={`Allotment layout grid for ${selectedYear}. ${items.length} areas total.`}
      >
        {/* North label */}
        <div className="text-center text-gray-500 text-xs font-bold mb-1" aria-hidden="true">NORTH</div>

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
            useCSSTransforms: false,
          } as unknown as React.ComponentProps<typeof ReactGridLayout>)}
        >
          {items.map((item, index) => {
            // Get plantings - use item.i for areas mode, item.bedId for legacy
            const plantingId = visibleAreas ? item.i : item.bedId
            const plantings = plantingId && getPlantingsForBed ? getPlantingsForBed(plantingId) : []

            // Get the area data if available
            const area = visibleAreas ? visibleAreas.find(a => a.id === item.i) : undefined

            // Check if this item is selected
            let isSelected = false
            if (visibleAreas) {
              // Areas mode: match by id directly
              isSelected = selectedItemRef?.id === item.i
            } else {
              // Legacy mode
              isSelected = !!(selectedItemRef && (
                (item.bedId && selectedItemRef.type === 'bed' && selectedItemRef.id === item.bedId) ||
                ((item.type === 'perennial' || item.type === 'tree') && selectedItemRef.type === 'permanent' && selectedItemRef.id === item.i) ||
                (item.type === 'infrastructure' && selectedItemRef.type === 'infrastructure' && selectedItemRef.id === item.i)
              ))
            }

            // Determine if clickable - in areas mode, all non-area types are clickable
            const isClickable = visibleAreas
              ? item.type !== 'area' // In areas mode, everything except 'area' type is clickable
              : (item.bedId || item.type === 'perennial' || item.type === 'tree' || item.type === 'infrastructure')

            // Build accessible label for the item
            const itemLabel = item.label || item.i
            const plantingsCount = plantings.length
            const plantingsSummary = plantingsCount > 0
              ? `. ${plantingsCount} planting${plantingsCount > 1 ? 's' : ''}`
              : ''
            const repositionHint = isEditing && !item.static ? '. Press M to reposition with keyboard' : ''
            const isBeingRepositioned = isRepositionMode && repositionItemId === item.i
            const repositionStatus = isBeingRepositioned ? '. Repositioning mode active - use arrow keys to move' : ''
            const ariaLabel = `${itemLabel}${plantingsSummary}${isSelected ? '. Currently selected' : ''}${repositionHint}${repositionStatus}`

            return (
              <div
                key={item.i}
                role="gridcell"
                className="relative"
              >
                <button
                  ref={(el) => {
                    if (el) {
                      gridItemRefs.current.set(item.i, el)
                    } else {
                      gridItemRefs.current.delete(item.i)
                    }
                  }}
                  onClick={() => isClickable && handleItemClick(item)}
                  onKeyDown={(e) => handleGridKeyDown(e, item, index)}
                  tabIndex={index === focusedIndex ? 0 : -1}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  aria-disabled={!isClickable}
                  className={`
                    w-full h-full
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:z-10
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    ${isBeingRepositioned ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                >
                  <BedItem
                    item={item}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    plantings={plantings}
                    area={area}
                    selectedYear={selectedYear}
                  />
                  {/* Reposition indicator */}
                  {isBeingRepositioned && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl text-xs flex items-center gap-1">
                      <Move className="w-3 h-3" aria-hidden="true" />
                      <span className="sr-only">Repositioning</span>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </ReactGridLayout>

        {/* South label */}
        <div className="text-center text-gray-500 text-xs font-bold mt-1" aria-hidden="true">SOUTH (Entry)</div>
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" role="note">
        Use arrow keys to navigate between areas. Press Enter or Space to select an area and view its details.
        {isEditing && ' Press M on any non-static item to enter keyboard reposition mode.'}
      </div>
    </div>
  )
}
