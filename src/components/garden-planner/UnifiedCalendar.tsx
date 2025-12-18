'use client'

import { GridPlot, Month, Vegetable } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

interface UnifiedCalendarProps {
  beds: GridPlot[]
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export default function UnifiedCalendar({ beds }: UnifiedCalendarProps) {
  // Get all unique vegetables per bed
  const bedPlants = beds.map(bed => ({
    bed,
    vegetables: getUniquePlantedVegetables(bed)
  })).filter(bp => bp.vegetables.length > 0)

  const totalPlants = bedPlants.reduce((sum, bp) => sum + bp.vegetables.length, 0)

  if (totalPlants === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Planting Calendar</h2>
        <p className="text-gray-400 text-sm text-center py-8">
          Add plants to your beds to see their planting calendar
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="font-semibold text-gray-800 mb-4">
        Planting Calendar
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({totalPlants} plant{totalPlants !== 1 ? 's' : ''} across {bedPlants.length} bed{bedPlants.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {/* Month Headers */}
      <div className="grid grid-cols-12 gap-1 text-xs mb-2">
        {MONTH_LABELS.map((m, i) => (
          <div key={i} className="text-center text-gray-500 font-medium">
            {m}
          </div>
        ))}
      </div>

      {/* Beds and their plants */}
      <div className="space-y-4">
        {bedPlants.map(({ bed, vegetables }) => (
          <div key={bed.id}>
            {/* Bed name header */}
            <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: bed.color }}
              />
              {bed.name}
            </div>

            {/* Plants in this bed */}
            <div className="space-y-1">
              {vegetables.map(veg => (
                <div key={veg.id} className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1) as Month
                    const canSow = veg.planting.sowOutdoorsMonths.includes(month) || 
                                   veg.planting.sowIndoorsMonths.includes(month)
                    const canHarvest = veg.planting.harvestMonths.includes(month)
                    
                    // If both sow and harvest, show harvest (amber) as primary
                    let bgClass = 'bg-gray-100'
                    if (canHarvest) bgClass = 'bg-amber-400'
                    else if (canSow) bgClass = 'bg-green-400'

                    return (
                      <div 
                        key={i} 
                        className={`h-4 rounded-sm ${bgClass}`}
                        title={`${veg.name}: ${canSow ? 'Sow ' : ''}${canHarvest ? 'Harvest' : ''}`}
                      />
                    )
                  })}
                  <span className="col-span-12 text-xs text-gray-600 mt-0.5">
                    {veg.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 pt-4 border-t text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-400 rounded" />
          Sow
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-400 rounded" />
          Harvest
        </span>
      </div>
    </div>
  )
}

/**
 * Get unique vegetables planted in a bed (deduplicated)
 */
function getUniquePlantedVegetables(bed: GridPlot): Vegetable[] {
  const vegIds = new Set<string>()
  const vegs: Vegetable[] = []

  for (const cell of bed.cells) {
    if (cell.vegetableId && !vegIds.has(cell.vegetableId)) {
      vegIds.add(cell.vegetableId)
      const veg = getVegetableById(cell.vegetableId)
      if (veg) vegs.push(veg)
    }
  }

  return vegs
}

