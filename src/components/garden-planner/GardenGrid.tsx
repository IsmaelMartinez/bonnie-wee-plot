'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, X, Trash2, Search } from 'lucide-react'
import { GridPlot, PlotCell, CATEGORY_INFO, VegetableCategory } from '@/types/garden-planner'
import { vegetables, getVegetableById } from '@/lib/vegetable-database'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { getPlantEmoji } from '@/lib/plant-emoji'

interface GardenGridProps {
  grid: GridPlot
  onAssign: (cellId: string, vegetableId: string) => void
  onClear: (cellId: string) => void
  onResize: (rows: number, cols: number) => void
  onClearAll: () => void
}

const MIN_SIZE = 1
const MAX_SIZE = 8

export default function GardenGrid({ grid, onAssign, onClear, onResize, onClearAll }: GardenGridProps) {
  const [selectedCell, setSelectedCell] = useState<PlotCell | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')

  // Close dialog on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedCell(null)
        setSearch('')
        setCategoryFilter('all')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Get compatibility color for a plant based on what's already planted
  function getCompatibility(vegetableId: string): 'good' | 'neutral' | 'bad' {
    const plantedVegIds = grid.cells
      .filter(c => c.vegetableId && c.id !== selectedCell?.id)
      .map(c => c.vegetableId!)

    if (plantedVegIds.length === 0) return 'neutral'

    let hasGood = false
    let hasBad = false

    for (const plantedId of plantedVegIds) {
      const compat = checkCompanionCompatibility(vegetableId, plantedId)
      if (compat === 'good') hasGood = true
      if (compat === 'bad') hasBad = true
    }

    if (hasBad) return 'bad'
    if (hasGood) return 'good'
    return 'neutral'
  }

  // Check if removing row/col would delete plants
  function hasPlantInLastRow(): boolean {
    return grid.cells.some(c => c.row === grid.gridRows - 1 && c.vegetableId)
  }

  function hasPlantInLastCol(): boolean {
    return grid.cells.some(c => c.col === grid.gridCols - 1 && c.vegetableId)
  }

  // Build cells into rows
  const rows: PlotCell[][] = []
  for (let r = 0; r < grid.gridRows; r++) {
    const row: PlotCell[] = []
    for (let c = 0; c < grid.gridCols; c++) {
      const cell = grid.cells.find(cell => cell.row === r && cell.col === c)
      if (cell) row.push(cell)
    }
    rows.push(row)
  }

  // Filter plants
  const filteredPlants = vegetables.filter(v => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const planted = grid.cells.filter(c => c.vegetableId).length
  const selectedVeg = selectedCell?.vegetableId ? getVegetableById(selectedCell.vegetableId) : null

  return (
    <>
      <div className="bg-white rounded-b-xl shadow-md overflow-hidden">
        {/* Size Controls */}
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {/* Rows */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows:</span>
              <button
                onClick={() => onResize(grid.gridRows - 1, grid.gridCols)}
                disabled={grid.gridRows <= MIN_SIZE}
                className={`p-1.5 rounded transition ${
                  grid.gridRows <= MIN_SIZE 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : hasPlantInLastRow()
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={hasPlantInLastRow() ? 'Warning: Last row has plants' : 'Remove row'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-medium text-gray-800">{grid.gridRows}</span>
              <button
                onClick={() => onResize(grid.gridRows + 1, grid.gridCols)}
                disabled={grid.gridRows >= MAX_SIZE}
                className={`p-1.5 rounded transition ${
                  grid.gridRows >= MAX_SIZE
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Columns */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Cols:</span>
              <button
                onClick={() => onResize(grid.gridRows, grid.gridCols - 1)}
                disabled={grid.gridCols <= MIN_SIZE}
                className={`p-1.5 rounded transition ${
                  grid.gridCols <= MIN_SIZE
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : hasPlantInLastCol()
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={hasPlantInLastCol() ? 'Warning: Last column has plants' : 'Remove column'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-medium text-gray-800">{grid.gridCols}</span>
              <button
                onClick={() => onResize(grid.gridRows, grid.gridCols + 1)}
                disabled={grid.gridCols >= MAX_SIZE}
                className={`p-1.5 rounded transition ${
                  grid.gridCols >= MAX_SIZE
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <span className="text-sm text-gray-500">
            {grid.gridRows}×{grid.gridCols} = {grid.gridRows * grid.gridCols} cells
          </span>
        </div>

        {/* Grid */}
        <div className="p-4">
          <div className="space-y-2">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map(cell => {
                  const veg = cell.vegetableId ? getVegetableById(cell.vegetableId) : null

                  return (
                    <button
                      key={cell.id}
                      onClick={() => {
                        setSelectedCell(cell)
                        setSearch('')
                        setCategoryFilter('all')
                      }}
                      className={`
                        flex-1 aspect-square rounded-lg border-2 transition-all
                        flex flex-col items-center justify-center p-2
                        ${veg
                          ? 'border-green-200 bg-green-50 hover:border-green-300'
                          : 'border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {veg ? (
                        <>
                          <span 
                            className="text-2xl mb-1"
                            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
                          >
                            {getPlantEmoji(veg.category)}
                          </span>
                          <span className="text-xs font-medium text-gray-700 text-center leading-tight line-clamp-1">
                            {veg.name}
                          </span>
                        </>
                      ) : (
                        <Plus className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {planted > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">{planted} plants in this bed</span>
            <button
              onClick={onClearAll}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Plant Selection Dialog */}
      {selectedCell && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCell(null)
              setSearch('')
              setCategoryFilter('all')
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedVeg ? `Change plant in cell` : `Select a plant`}
                </h2>
                {selectedVeg && (
                  <p className="text-sm text-gray-500">Currently: {selectedVeg.name}</p>
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedCell(null)
                  setSearch('')
                  setCategoryFilter('all')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-2 border-b overflow-x-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
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
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition flex items-center gap-1 ${
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
            <div className="px-4 py-2 bg-gray-50 flex gap-4 text-xs text-gray-500">
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
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredPlants.map(plant => {
                  const compat = getCompatibility(plant.id)
                  const bgColor = compat === 'good' 
                    ? 'bg-green-50 hover:bg-green-100 border-green-200' 
                    : compat === 'bad'
                    ? 'bg-red-50 hover:bg-red-100 border-red-200'
                    : 'bg-white hover:bg-gray-50 border-gray-200'

                  return (
                    <button
                      key={plant.id}
                      onClick={() => {
                        onAssign(selectedCell.id, plant.id)
                        setSelectedCell(null)
                        setSearch('')
                        setCategoryFilter('all')
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${bgColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlantEmoji(plant.category)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-800 truncate">{plant.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {CATEGORY_INFO.find(c => c.id === plant.category)?.name}
                          </div>
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
            {selectedVeg && (
              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    onClear(selectedCell.id)
                    setSelectedCell(null)
                  }}
                  className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove {selectedVeg.name}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
