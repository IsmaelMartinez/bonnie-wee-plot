'use client'

import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY } from '@/lib/rotation'
import { RotationPlan, RotationGroup } from '@/types/garden-planner'
import { SeasonRecord, Area, AreaSeason } from '@/types/unified-allotment'

interface RotationTimelineProps {
  availableYears: number[]
  seasons: SeasonRecord[]
  areas: Area[]
  plan2026: RotationPlan
}

// Get area status info
function getAreaStatusInfo(areaId: string, areas: Area[]) {
  const area = areas.find(a => a.id === areaId)
  if (!area) return null

  return {
    kind: area.kind,
    isPerennial: area.kind !== 'rotation-bed',
  }
}

export default function RotationTimeline({ availableYears, seasons, areas, plan2026 }: RotationTimelineProps) {
  // Get all area IDs from the areas array
  const allAreaIds = areas.map(a => a.id)

  // Helper to get season by year
  const getSeasonByYear = (year: number) => seasons.find(s => s.year === year)

  return (
    <div className="mt-8 zen-card p-6">
      <h3 className="font-display text-zen-ink-800 mb-4">Rotation Timeline - All Areas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zen-stone-200">
              <th className="text-left py-2 px-3 text-zen-stone-600">Area</th>
              <th className="text-left py-2 px-3 text-zen-stone-600">Type</th>
              {availableYears.slice().reverse().map(year => (
                <th key={year} className="text-center py-2 px-3 text-zen-stone-600">{year}</th>
              ))}
              <th className="text-center py-2 px-3 text-zen-moss-600">{plan2026.year}</th>
            </tr>
          </thead>
          <tbody>
            {allAreaIds.map(areaId => {
              const area = areas.find(a => a.id === areaId)
              const statusInfo = getAreaStatusInfo(areaId, areas)

              return (
                <tr key={areaId} className="border-b border-zen-stone-100 last:border-0">
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-center text-xs font-medium"
                      style={{ backgroundColor: BED_COLORS[areaId] || '#666' }}
                    >
                      {area?.name || areaId}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      statusInfo?.isPerennial
                        ? 'bg-zen-bamboo-100 text-zen-bamboo-700'
                        : 'bg-zen-stone-100 text-zen-stone-600'
                    }`}>
                      {area?.kind || 'unknown'}
                    </span>
                  </td>
                  {availableYears.slice().reverse().map(year => {
                    const season = getSeasonByYear(year)
                    const areaSeason = season?.areas.find((a: AreaSeason) => a.areaId === areaId)
                    const display = areaSeason ? ROTATION_GROUP_DISPLAY[areaSeason.rotationGroup as RotationGroup] : null
                    const hasPoor = areaSeason?.plantings.some(p => p.success === 'poor')

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
                      const suggestion = plan2026.suggestions.find(s => s.areaId === areaId)
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
