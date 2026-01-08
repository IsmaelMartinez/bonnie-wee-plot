'use client'

import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY } from '@/lib/rotation'
import { PhysicalBedId, RotationPlan, RotationGroup } from '@/types/garden-planner'
import { SeasonRecord, BedArea } from '@/types/unified-allotment'

interface RotationTimelineProps {
  availableYears: number[]
  seasons: SeasonRecord[]
  beds: BedArea[]
  plan2026: RotationPlan
}

// Get bed status info
function getBedStatusInfo(bedId: PhysicalBedId, beds: BedArea[]) {
  const bed = beds.find(b => b.id === bedId)
  if (!bed) return null

  return {
    status: bed.status,
    isPerennial: bed.status === 'perennial',
  }
}

export default function RotationTimeline({ availableYears, seasons, beds, plan2026 }: RotationTimelineProps) {
  // Get all bed IDs from the beds array
  const allBedIds = beds.map(b => b.id)

  // Helper to get season by year
  const getSeasonByYear = (year: number) => seasons.find(s => s.year === year)

  return (
    <div className="mt-8 zen-card p-6">
      <h3 className="font-display text-zen-ink-800 mb-4">Rotation Timeline - All Beds</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zen-stone-200">
              <th className="text-left py-2 px-3 text-zen-stone-600">Bed</th>
              <th className="text-left py-2 px-3 text-zen-stone-600">Status</th>
              {availableYears.slice().reverse().map(year => (
                <th key={year} className="text-center py-2 px-3 text-zen-stone-600">{year}</th>
              ))}
              <th className="text-center py-2 px-3 text-zen-moss-600">{plan2026.year}</th>
            </tr>
          </thead>
          <tbody>
            {allBedIds.map(bedId => {
              const bed = beds.find(b => b.id === bedId)
              const statusInfo = getBedStatusInfo(bedId as PhysicalBedId, beds)

              return (
                <tr key={bedId} className="border-b border-zen-stone-100 last:border-0">
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-center text-xs font-medium"
                      style={{ backgroundColor: BED_COLORS[bedId as PhysicalBedId] }}
                    >
                      {bedId}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      statusInfo?.isPerennial
                        ? 'bg-zen-bamboo-100 text-zen-bamboo-700'
                        : 'bg-zen-stone-100 text-zen-stone-600'
                    }`}>
                      {bed?.status || 'unknown'}
                    </span>
                  </td>
                  {availableYears.slice().reverse().map(year => {
                    const season = getSeasonByYear(year)
                    const bedPlan = season?.beds.find(b => b.bedId === bedId)
                    const display = bedPlan ? ROTATION_GROUP_DISPLAY[bedPlan.rotationGroup as RotationGroup] : null
                    const hasPoor = bedPlan?.plantings.some(p => p.success === 'poor')

                    return (
                      <td key={year} className="text-center py-2 px-3">
                        {display ? (
                          <span
                            title={display.name}
                            className={hasPoor ? 'opacity-50' : ''}
                          >
                            {display.emoji}
                            {hasPoor && <span className="text-zen-ume-500 text-xs ml-0.5">!</span>}
                          </span>
                        ) : (
                          <span className="text-zen-stone-300">-</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-center py-2 px-3">
                    {(() => {
                      const suggestion = plan2026.suggestions.find(s => s.bedId === bedId)
                      if (!suggestion) return null

                      if (suggestion.isPerennial) {
                        return <span title="Perennial - no change">🌳</span>
                      }

                      const display = ROTATION_GROUP_DISPLAY[suggestion.suggestedGroup]
                      return display ? (
                        <span title={display.name} className="opacity-70">{display.emoji}</span>
                      ) : null
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zen-stone-500 border-t border-zen-stone-200 pt-4">
        <span className="font-medium text-zen-ink-700">Legend:</span>
        {Object.entries(ROTATION_GROUP_DISPLAY).map(([key, value]) => (
          <span key={key} className="flex items-center gap-1">
            {value.emoji} {value.name}
          </span>
        ))}
        <span className="flex items-center gap-1 text-zen-ume-500">! = poor results</span>
      </div>
    </div>
  )
}
