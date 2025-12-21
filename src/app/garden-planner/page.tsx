'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sprout, Users, Recycle, Calendar, Plus, Trash2, Edit2, Check, X, LayoutGrid, History, Download } from 'lucide-react'
import { GridPlot, PlotCell } from '@/types/garden-planner'
import { createGridPlot } from '@/lib/garden-storage'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getVegetableById } from '@/lib/vegetable-database'
import GardenGrid from '@/components/garden-planner/GardenGrid'
import BedOverview from '@/components/garden-planner/BedOverview'
import UnifiedCalendar from '@/components/garden-planner/UnifiedCalendar'
import { season2025 } from '@/data/historical-plans'
import { physicalBeds, BED_COLORS } from '@/data/allotment-layout'

const STORAGE_KEY = 'garden-beds-2025'
const DEFAULT_ROWS = 4
const DEFAULT_COLS = 4

interface GardenData {
  beds: GridPlot[]
  activeBedId: string | null
}

export default function GardenPlannerPage() {
  const [data, setData] = useState<GardenData | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'single'>('single')
  const [editingBedId, setEditingBedId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Handle old format (single grid)
        if (parsed.gridRows !== undefined) {
          const beds = [parsed as GridPlot]
          setData({ beds, activeBedId: beds[0].id })
        } else {
          setData(parsed)
        }
      } catch {
        const defaultBed = createGridPlot('Bed 1', DEFAULT_ROWS, DEFAULT_COLS)
        setData({ beds: [defaultBed], activeBedId: defaultBed.id })
      }
    } else {
      const defaultBed = createGridPlot('Bed 1', DEFAULT_ROWS, DEFAULT_COLS)
      setData({ beds: [defaultBed], activeBedId: defaultBed.id })
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  // Get active bed
  const activeBed = data?.beds.find(b => b.id === data.activeBedId) || data?.beds[0]

  // Select bed
  function handleSelectBed(bedId: string) {
    if (!data) return
    setData({ ...data, activeBedId: bedId })
  }

  // Add new bed
  function handleAddBed() {
    if (!data) return
    const newBed = createGridPlot(`Bed ${data.beds.length + 1}`, DEFAULT_ROWS, DEFAULT_COLS)
    setData({
      beds: [...data.beds, newBed],
      activeBedId: newBed.id
    })
  }

  // Delete bed
  function handleDeleteBed(bedId: string) {
    if (!data || data.beds.length <= 1) return
    const newBeds = data.beds.filter(b => b.id !== bedId)
    setData({
      beds: newBeds,
      activeBedId: data.activeBedId === bedId ? newBeds[0].id : data.activeBedId
    })
  }

  // Rename bed
  function handleRenameBed(bedId: string, newName: string) {
    if (!data) return
    setData({
      ...data,
      beds: data.beds.map(b => b.id === bedId ? { ...b, name: newName } : b)
    })
    setEditingBedId(null)
  }

  // Update active bed
  function updateActiveBed(updates: Partial<GridPlot>) {
    if (!data || !activeBed) return
    setData({
      ...data,
      beds: data.beds.map(b => b.id === activeBed.id ? { ...b, ...updates } : b)
    })
  }

  // Assign plant to cell
  function handleAssign(cellId: string, vegetableId: string) {
    if (!activeBed) return
    updateActiveBed({
      cells: activeBed.cells.map(cell =>
        cell.id === cellId
          ? { ...cell, vegetableId, plantedYear: new Date().getFullYear() }
          : cell
      )
    })
  }

  // Clear cell
  function handleClear(cellId: string) {
    if (!activeBed) return
    updateActiveBed({
      cells: activeBed.cells.map(cell =>
        cell.id === cellId
          ? { ...cell, vegetableId: undefined, plantedYear: undefined }
          : cell
      )
    })
  }

  // Resize grid
  function handleResize(newRows: number, newCols: number) {
    if (!activeBed) return
    
    // Build new cells array
    const newCells: PlotCell[] = []
    for (let row = 0; row < newRows; row++) {
      for (let col = 0; col < newCols; col++) {
        // Try to find existing cell
        const existing = activeBed.cells.find(c => c.row === row && c.col === col)
        if (existing) {
          newCells.push(existing)
        } else {
          newCells.push({
            id: `${activeBed.id}-${row}-${col}`,
            plotId: activeBed.id,
            row,
            col
          })
        }
      }
    }
    
    updateActiveBed({
      gridRows: newRows,
      gridCols: newCols,
      cells: newCells
    })
  }

  // Clear all plants in active bed
  function handleClearAll() {
    if (!activeBed) return
    updateActiveBed({
      cells: activeBed.cells.map(cell => ({
        ...cell,
        vegetableId: undefined,
        plantedYear: undefined
      }))
    })
  }

  // Load 2025 plan from historical data
  function handleLoadPlan() {
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
    
    setData({
      beds: newBeds,
      activeBedId: newBeds[0].id
    })
    setShowLoadDialog(false)
  }

  // Get companion tips for active bed
  function getCompanionTips(): { good: string[], bad: string[] } {
    if (!activeBed) return { good: [], bad: [] }
    const good: string[] = []
    const bad: string[] = []
    const plantedCells = activeBed.cells.filter(c => c.vegetableId)
    
    for (let i = 0; i < plantedCells.length; i++) {
      for (let j = i + 1; j < plantedCells.length; j++) {
        const veg1 = getVegetableById(plantedCells[i].vegetableId!)
        const veg2 = getVegetableById(plantedCells[j].vegetableId!)
        if (!veg1 || !veg2) continue
        
        const compat = checkCompanionCompatibility(veg1.id, veg2.id)
        if (compat === 'good') {
          good.push(`${veg1.name} + ${veg2.name}`)
        } else if (compat === 'bad') {
          bad.push(`${veg1.name} + ${veg2.name}`)
        }
      }
    }
    
    return { good: good.slice(0, 5), bad: bad.slice(0, 5) }
  }

  // Loading
  if (!data || !activeBed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <Sprout className="w-12 h-12 text-green-600 animate-pulse" />
      </div>
    )
  }

  const tips = getCompanionTips()
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
        {showLoadDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Load 2025 Plan</h3>
              <p className="text-gray-600 mb-4">
                This will replace your current beds with your 2025 planting plan from the Excel workbook. 
                Your beds will be set up as A, B, C, D with the vegetables you planted this year.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This will overwrite any existing bed data. 
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoadPlan}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Load Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bed Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {/* All Beds overview tab */}
          <button
            onClick={() => setViewMode('overview')}
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
          {data.beds.map(bed => (
            <button
              key={bed.id}
              onClick={() => { handleSelectBed(bed.id); setViewMode('single') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                viewMode === 'single' && bed.id === activeBed.id
                  ? 'bg-green-600 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {bed.name}
              {bed.cells.filter(c => c.vegetableId).length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  viewMode === 'single' && bed.id === activeBed.id ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {bed.cells.filter(c => c.vegetableId).length}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleAddBed}
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white hover:shadow-sm transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Bed
          </button>
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Unified Calendar (when toggled) - at top for consistency */}
            {showCalendar && (
              <UnifiedCalendar beds={data.beds} />
            )}

            {/* Bed Overview Grid */}
            <BedOverview 
              beds={data.beds} 
              onSelectBed={(bedId) => { handleSelectBed(bedId); setViewMode('single') }}
            />
          </div>
        )}

        {/* Single Bed Mode */}
        {viewMode === 'single' && (
          <>
            {/* Active Bed Header */}
            <div className="bg-white rounded-t-xl shadow-md px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingBedId === activeBed.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-2 py-1 border rounded text-sm font-medium"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameBed(activeBed.id, editingName)
                        if (e.key === 'Escape') setEditingBedId(null)
                      }}
                    />
                    <button onClick={() => handleRenameBed(activeBed.id, editingName)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingBedId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-800">{activeBed.name}</span>
                    <button
                      onClick={() => { setEditingBedId(activeBed.id); setEditingName(activeBed.name) }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {data.beds.length > 1 && (
                <button
                  onClick={() => handleDeleteBed(activeBed.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete this bed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Calendar overlay */}
            {showCalendar && (
              <div className="bg-white shadow-md p-6 mb-0 border-t">
                <h2 className="font-semibold text-gray-800 mb-4">Planting Calendar</h2>
                <div className="grid grid-cols-12 gap-1 text-xs">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                    <div key={i} className="text-center text-gray-500 font-medium">{m}</div>
                  ))}
                </div>
                {activeBed.cells.filter(c => c.vegetableId).map(cell => {
                  const veg = getVegetableById(cell.vegetableId!)
                  if (!veg) return null
                  return (
                    <div key={cell.id} className="grid grid-cols-12 gap-1 mt-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1
                        const canSow = veg.planting.sowOutdoorsMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12) || 
                                       veg.planting.sowIndoorsMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12)
                        const canHarvest = veg.planting.harvestMonths.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12)
                        return (
                          <div 
                            key={i} 
                            className={`h-4 rounded-sm ${canHarvest ? 'bg-amber-400' : canSow ? 'bg-green-400' : 'bg-gray-100'}`}
                            title={`${veg.name}: ${canSow ? 'Sow' : ''} ${canHarvest ? 'Harvest' : ''}`}
                          />
                        )
                      })}
                      <span className="col-span-12 text-xs text-gray-600 mt-0.5">{veg.name}</span>
                    </div>
                  )
                })}
                {activeBed.cells.filter(c => c.vegetableId).length === 0 && (
                  <p className="text-gray-400 text-sm mt-4">Add plants to see their calendar</p>
                )}
                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded"></span> Sow</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded"></span> Harvest</span>
                </div>
              </div>
            )}

            {/* Main Grid */}
            <GardenGrid
              grid={activeBed}
              onAssign={handleAssign}
              onClear={handleClear}
              onResize={handleResize}
              onClearAll={handleClearAll}
            />

            {/* Companion Tips */}
            {(tips.good.length > 0 || tips.bad.length > 0) && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Companion Tips</h3>
                <div className="space-y-3">
                  {tips.bad.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">⚠️ Avoid together:</p>
                      <div className="space-y-1">
                        {tips.bad.map((tip, i) => (
                          <p key={i} className="text-sm text-red-600 pl-4">{tip}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {tips.good.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">✓ Great companions:</p>
                      <div className="space-y-1">
                        {tips.good.map((tip, i) => (
                          <p key={i} className="text-sm text-green-600 pl-4">{tip}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
