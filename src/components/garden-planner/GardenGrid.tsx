'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { GridPlot, PlotCell } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'
import { getPlantEmoji } from '@/lib/plant-emoji'
import GridSizeControls from './GridSizeControls'
import PlantSelectionDialog from './PlantSelectionDialog'

interface GardenGridProps {
  grid: GridPlot
  onAssign: (cellId: string, plantId: string) => void
  onClear: (cellId: string) => void
  onResize: (rows: number, cols: number) => void
  onClearAll: () => void
}

const MIN_SIZE = 1
const MAX_SIZE = 8

export default function GardenGrid({ grid, onAssign, onClear, onResize, onClearAll }: GardenGridProps) {
  const [selectedCell, setSelectedCell] = useState<PlotCell | null>(null)
  const [focusedRow, setFocusedRow] = useState(0)
  const [focusedCol, setFocusedCol] = useState(0)

  // Refs for cell buttons to enable focus management
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Get cell ref key
  const getCellKey = useCallback((row: number, col: number) => `${row}-${col}`, [])

  // Focus a specific cell
  const focusCell = useCallback((row: number, col: number) => {
    const key = getCellKey(row, col)
    const cellButton = cellRefs.current.get(key)
    if (cellButton) {
      cellButton.focus()
      setFocusedRow(row)
      setFocusedCol(col)
    }
  }, [getCellKey])

  // Handle keyboard navigation in the grid
  const handleCellKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLButtonElement>,
    cell: PlotCell,
    row: number,
    col: number
  ) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setSelectedCell(cell)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (row > 0) focusCell(row - 1, col)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (row < grid.gridRows - 1) focusCell(row + 1, col)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (col > 0) focusCell(row, col - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        if (col < grid.gridCols - 1) focusCell(row, col + 1)
        break
      case 'Home':
        e.preventDefault()
        focusCell(row, 0)
        break
      case 'End':
        e.preventDefault()
        focusCell(row, grid.gridCols - 1)
        break
    }
  }, [focusCell, grid.gridRows, grid.gridCols])

  // Check if removing row/col would delete plants
  const hasPlantInLastRow = grid.cells.some(c => c.row === grid.gridRows - 1 && c.plantId)
  const hasPlantInLastCol = grid.cells.some(c => c.col === grid.gridCols - 1 && c.plantId)

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

  const planted = grid.cells.filter(c => c.plantId).length
  const selectedVeg = selectedCell?.plantId ? getVegetableById(selectedCell.plantId) ?? null : null

  // Get planted vegetable IDs (excluding the selected cell)
  const plantedVegetableIds = grid.cells
    .filter(c => c.plantId && c.id !== selectedCell?.id)
    .map(c => c.plantId!)

  const handlePlantSelect = (plantId: string) => {
    if (selectedCell) {
      onAssign(selectedCell.id, plantId)
      setSelectedCell(null)
    }
  }

  const handlePlantRemove = () => {
    if (selectedCell) {
      onClear(selectedCell.id)
      setSelectedCell(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-b-xl shadow-md overflow-hidden">
        <GridSizeControls
          rows={grid.gridRows}
          cols={grid.gridCols}
          minSize={MIN_SIZE}
          maxSize={MAX_SIZE}
          hasPlantInLastRow={hasPlantInLastRow}
          hasPlantInLastCol={hasPlantInLastCol}
          onResize={onResize}
        />

        {/* Grid */}
        <div className="p-4" role="grid" aria-label="Garden planting grid">
          <div className="space-y-2">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2" role="row">
                {row.map((cell, colIndex) => {
                  const veg = cell.plantId ? getVegetableById(cell.plantId) : null
                  const cellKey = getCellKey(rowIndex, colIndex)

                  return (
                    <button
                      key={cell.id}
                      ref={(el) => {
                        if (el) {
                          cellRefs.current.set(cellKey, el)
                        } else {
                          cellRefs.current.delete(cellKey)
                        }
                      }}
                      onClick={() => setSelectedCell(cell)}
                      onKeyDown={(e) => handleCellKeyDown(e, cell, rowIndex, colIndex)}
                      tabIndex={rowIndex === focusedRow && colIndex === focusedCol ? 0 : -1}
                      role="gridcell"
                      aria-label={veg ? `Cell ${rowIndex + 1}-${colIndex + 1}: ${veg.name}` : `Empty cell ${rowIndex + 1}-${colIndex + 1}`}
                      aria-selected={selectedCell?.id === cell.id}
                      className={`
                        flex-1 aspect-square rounded-lg border-2 transition-all
                        flex flex-col items-center justify-center p-2
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
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
                        <Plus className="w-5 h-5 text-gray-300" aria-hidden="true" />
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
              aria-label="Clear all plants from this bed"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear All
            </button>
          </div>
        )}
      </div>

      <PlantSelectionDialog
        isOpen={selectedCell !== null}
        currentVegetable={selectedVeg}
        plantedVegetableIds={plantedVegetableIds}
        onSelect={handlePlantSelect}
        onRemove={handlePlantRemove}
        onClose={() => setSelectedCell(null)}
      />
    </>
  )
}
