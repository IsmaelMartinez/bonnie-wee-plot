'use client'

import { GridPlot } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'
import { getPlantEmoji } from '@/lib/plant-emoji'

interface BedOverviewProps {
  beds: GridPlot[]
  onSelectBed: (bedId: string) => void
}

export default function BedOverview({ beds, onSelectBed }: BedOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {beds.map(bed => {
        const plantedCells = bed.cells.filter(c => c.vegetableId)
        const plantCount = plantedCells.length
        const totalCells = bed.gridRows * bed.gridCols

        return (
          <button
            key={bed.id}
            onClick={() => onSelectBed(bed.id)}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 text-left group"
          >
            {/* Bed Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">
                {bed.name}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {plantCount}/{totalCells}
              </span>
            </div>

            {/* Miniature Grid */}
            <div 
              className="grid gap-1 mb-3"
              style={{
                gridTemplateColumns: `repeat(${bed.gridCols}, 1fr)`,
                aspectRatio: `${bed.gridCols}/${bed.gridRows}`
              }}
            >
              {Array.from({ length: bed.gridRows }, (_, row) =>
                Array.from({ length: bed.gridCols }, (_, col) => {
                  const cell = bed.cells.find(c => c.row === row && c.col === col)
                  const veg = cell?.vegetableId ? getVegetableById(cell.vegetableId) : null

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`
                        rounded-sm flex items-center justify-center text-xs
                        ${veg 
                          ? 'bg-green-100 border border-green-200' 
                          : 'bg-gray-50 border border-gray-100'
                        }
                      `}
                      style={{ aspectRatio: '1' }}
                    >
                      {veg && (
                        <span className="text-sm leading-none">
                          {getPlantEmoji(veg.category)}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Plant Summary */}
            {plantCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {getUniquePlants(bed).slice(0, 4).map(veg => (
                  <span
                    key={veg.id}
                    className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"
                  >
                    {veg.name}
                  </span>
                ))}
                {getUniquePlants(bed).length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{getUniquePlants(bed).length - 4} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No plants yet</p>
            )}

            {/* Click hint */}
            <p className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition">
              Click to edit →
            </p>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Get unique vegetables planted in a bed
 */
function getUniquePlants(bed: GridPlot) {
  const vegIds = new Set<string>()
  const vegs: NonNullable<ReturnType<typeof getVegetableById>>[] = []

  for (const cell of bed.cells) {
    if (cell.vegetableId && !vegIds.has(cell.vegetableId)) {
      vegIds.add(cell.vegetableId)
      const veg = getVegetableById(cell.vegetableId)
      if (veg) vegs.push(veg)
    }
  }

  return vegs
}

