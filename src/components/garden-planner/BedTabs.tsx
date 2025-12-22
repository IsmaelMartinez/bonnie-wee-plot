/**
 * BedTabs Component
 * Tab navigation for switching between beds and overview mode
 */

'use client'

import { Plus, LayoutGrid } from 'lucide-react'
import { GridPlot } from '@/types/garden-planner'

export type ViewMode = 'overview' | 'single'

interface BedTabsProps {
  beds: GridPlot[]
  activeBedId: string | null
  viewMode: ViewMode
  onSelectBed: (bedId: string) => void
  onAddBed: () => void
  onViewModeChange: (mode: ViewMode) => void
}

export default function BedTabs({
  beds,
  activeBedId,
  viewMode,
  onSelectBed,
  onAddBed,
  onViewModeChange
}: BedTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      {/* All Beds overview tab */}
      <button
        onClick={() => onViewModeChange('overview')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
          viewMode === 'overview'
            ? 'bg-green-600 text-white shadow'
            : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        All Beds
      </button>
      
      {/* Individual bed tabs */}
      {beds.map(bed => {
        const plantCount = bed.cells.filter(c => c.vegetableId).length
        const isActive = viewMode === 'single' && bed.id === activeBedId
        
        return (
          <button
            key={bed.id}
            onClick={() => {
              onSelectBed(bed.id)
              onViewModeChange('single')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              isActive
                ? 'bg-green-600 text-white shadow'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {bed.name}
            {plantCount > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                isActive ? 'bg-green-500' : 'bg-gray-200'
              }`}>
                {plantCount}
              </span>
            )}
          </button>
        )
      })}
      
      {/* Add Bed button */}
      <button
        onClick={onAddBed}
        className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white hover:shadow-sm transition flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Bed
      </button>
    </div>
  )
}

