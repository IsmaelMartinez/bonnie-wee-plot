'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sprout, Users, Recycle, Calendar, History, Download } from 'lucide-react'
import { GridPlot, PlotCell } from '@/types/garden-planner'
import { useBeds } from '@/hooks/useBeds'
import BedTabs, { ViewMode } from '@/components/garden-planner/BedTabs'
import BedEditor from '@/components/garden-planner/BedEditor'
import BedOverview from '@/components/garden-planner/BedOverview'
import UnifiedCalendar from '@/components/garden-planner/UnifiedCalendar'
import LoadPlanDialog from '@/components/garden-planner/LoadPlanDialog'
import { season2025 } from '@/data/historical-plans'
import { physicalBeds, BED_COLORS } from '@/data/allotment-layout'

export default function GardenPlannerPage() {
  const {
    data,
    activeBed,
    isLoading,
    selectBed,
    addBed,
    deleteBed,
    renameBed,
    assignPlant,
    clearCell,
    resizeBed,
    clearAllPlants,
    loadData
  } = useBeds()

  const [showCalendar, setShowCalendar] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Load 2025 plan from historical data
  const handleLoadPlan = () => {
    const newBeds: GridPlot[] = physicalBeds.map((physBed, index) => {
      const bedPlan = season2025.beds.find(b => b.bedId === physBed.id)
      const plantings = bedPlan?.plantings || []
      
      // Create a 4x4 grid for each bed
      const gridRows = 4
      const gridCols = 4
      const cells: PlotCell[] = []
      
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const plantingIndex = row * gridCols + col
          const planting = plantings[plantingIndex]
          cells.push({
            id: `bed-${physBed.id}-${row}-${col}`,
            plotId: `bed-${physBed.id}`,
            row,
            col,
            vegetableId: planting?.vegetableId,
            plantedYear: planting ? 2025 : undefined
          })
        }
      }
      
      return {
        id: `bed-${physBed.id}`,
        name: `Bed ${physBed.id}`,
        description: physBed.description,
        width: 2,
        length: 2,
        color: BED_COLORS[physBed.id],
        sortOrder: index,
        gridRows,
        gridCols,
        cells
      }
    })
    
    loadData({
      beds: newBeds,
      activeBedId: newBeds[0].id
    })
    setShowLoadDialog(false)
  }

  // Loading state
  if (isLoading || !data || !activeBed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <Sprout className="w-12 h-12 text-green-600 animate-pulse" />
      </div>
    )
  }

  const totalPlants = data.beds.reduce((sum, bed) => sum + bed.cells.filter(c => c.vegetableId).length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Sprout className="w-10 h-10 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Edinburgh Garden 2025</h1>
              <p className="text-sm text-gray-500">{data.beds.length} beds · {totalPlants} plants</p>
            </div>
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showCalendar ? 'bg-green-600 text-white' : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mb-6 text-sm">
          <Link href="/plan-history" className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 rounded-full shadow-sm hover:shadow text-amber-700 hover:text-amber-800">
            <History className="w-3.5 h-3.5" />
            Past Plans
          </Link>
          <button 
            onClick={() => setShowLoadDialog(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-full shadow-sm hover:shadow text-green-700 hover:text-green-800"
          >
            <Download className="w-3.5 h-3.5" />
            Load 2025 Plan
          </button>
          <Link href="/companion-planting" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow text-gray-600 hover:text-green-600">
            <Users className="w-3.5 h-3.5" />
            Companions
          </Link>
          <Link href="/composting" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow text-gray-600 hover:text-green-600">
            <Recycle className="w-3.5 h-3.5" />
            Composting
          </Link>
          <Link href="/crop-rotation" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow text-gray-600 hover:text-orange-600">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Rotation
          </Link>
          <Link href="/ai-advisor" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow text-gray-600 hover:text-green-600">
            <Sprout className="w-3.5 h-3.5" />
            Ask Aitor
          </Link>
        </div>

        {/* Load Plan Dialog */}
        <LoadPlanDialog
          isOpen={showLoadDialog}
          onClose={() => setShowLoadDialog(false)}
          onConfirm={handleLoadPlan}
        />

        {/* Bed Tabs */}
        <BedTabs
          beds={data.beds}
          activeBedId={data.activeBedId}
          viewMode={viewMode}
          onSelectBed={selectBed}
          onAddBed={addBed}
          onViewModeChange={setViewMode}
        />

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {showCalendar && <UnifiedCalendar beds={data.beds} />}
            <BedOverview 
              beds={data.beds} 
              onSelectBed={(bedId) => {
                selectBed(bedId)
                setViewMode('single')
              }}
            />
          </div>
        )}

        {/* Single Bed Mode */}
        {viewMode === 'single' && (
          <BedEditor
            bed={activeBed}
            canDelete={data.beds.length > 1}
            showCalendar={showCalendar}
            onAssign={assignPlant}
            onClear={clearCell}
            onResize={resizeBed}
            onClearAll={clearAllPlants}
            onRename={(newName) => renameBed(activeBed.id, newName)}
            onDelete={() => deleteBed(activeBed.id)}
          />
        )}
      </div>
    </div>
  )
}
