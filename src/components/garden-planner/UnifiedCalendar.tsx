'use client'

import { Month } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

interface PlantingEntry {
  bedId: string
  bedName: string
  bedColor: string
  plantId: string
  varietyName?: string
}

interface UnifiedCalendarProps {
  plantings: PlantingEntry[]
  currentMonth?: number // 1-12, highlights the current month column
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export default function UnifiedCalendar({ plantings, currentMonth }: UnifiedCalendarProps) {
  // Group plantings by bed
  const bedGroups = plantings.reduce((acc, p) => {
    if (!acc[p.bedId]) {
      acc[p.bedId] = { bedName: p.bedName, bedColor: p.bedColor, items: [] }
    }
    acc[p.bedId].items.push(p)
    return acc
  }, {} as Record<string, { bedName: string; bedColor: string; items: PlantingEntry[] }>)

  const bedIds = Object.keys(bedGroups)
  const totalPlants = plantings.length

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
          ({totalPlants} plant{totalPlants !== 1 ? 's' : ''} across {bedIds.length} bed{bedIds.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {/* Month Headers */}
      <div className="grid grid-cols-12 gap-1 text-xs mb-2">
        {MONTH_LABELS.map((m, i) => (
          <div
            key={i}
            className={`text-center font-medium ${
              currentMonth === i + 1
                ? 'text-green-700 bg-green-100 rounded'
                : 'text-gray-500'
            }`}
          >
            {m}
          </div>
        ))}
      </div>

      {/* Beds and their plants */}
      <div className="space-y-4">
        {bedIds.map(bedId => {
          const group = bedGroups[bedId]
          return (
            <div key={bedId}>
              {/* Bed name header */}
              <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: group.bedColor }}
                />
                {group.bedName}
              </div>

              {/* Plants in this bed */}
              <div className="space-y-1">
                {group.items.map((item, idx) => {
                  const veg = getVegetableById(item.plantId)
                  if (!veg) return null

                  const displayName = item.varietyName
                    ? `${veg.name} (${item.varietyName})`
                    : veg.name

                  return (
                    <div key={`${item.plantId}-${idx}`} className="grid grid-cols-12 gap-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = (i + 1) as Month
                        const canSow = veg.planting.sowOutdoorsMonths.includes(month) ||
                                       veg.planting.sowIndoorsMonths.includes(month)
                        const canHarvest = veg.planting.harvestMonths.includes(month)
                        const isCurrentMonth = currentMonth === month

                        let bgClass = 'bg-gray-100'
                        if (canHarvest) bgClass = 'bg-amber-400'
                        else if (canSow) bgClass = 'bg-green-400'

                        return (
                          <div
                            key={i}
                            className={`h-4 rounded-sm ${bgClass} ${isCurrentMonth ? 'ring-2 ring-green-600 ring-offset-1' : ''}`}
                            title={`${veg.name}: ${canSow ? 'Sow ' : ''}${canHarvest ? 'Harvest' : ''}`}
                          />
                        )
                      })}
                      <span className="col-span-12 text-xs text-gray-600 mt-0.5">
                        {displayName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
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

