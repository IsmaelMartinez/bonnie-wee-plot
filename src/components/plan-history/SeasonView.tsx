'use client'

import { Calendar } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY } from '@/lib/rotation'
import { getVegetableById } from '@/lib/vegetable-database'
import { RotationGroup, PlantingSuccess } from '@/types/garden-planner'
import { SeasonRecord } from '@/types/unified-allotment'

// Success badge colors
const SUCCESS_COLORS: Record<PlantingSuccess, { bg: string; text: string }> = {
  'excellent': { bg: 'bg-zen-moss-100', text: 'text-zen-moss-700' },
  'good': { bg: 'bg-zen-bamboo-100', text: 'text-zen-bamboo-700' },
  'fair': { bg: 'bg-zen-kitsune-100', text: 'text-zen-kitsune-700' },
  'poor': { bg: 'bg-zen-ume-100', text: 'text-zen-ume-700' }
}

interface SeasonViewProps {
  season: SeasonRecord
  year: number
}

export default function SeasonView({ season, year }: SeasonViewProps) {
  return (
    <div className="space-y-6">
      {/* Season Summary */}
      <div className="zen-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-zen-kitsune-600" />
          <h2 className="text-xl font-display text-zen-ink-800">{year} Season</h2>
          {season.status && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              season.status === 'current' ? 'bg-zen-moss-100 text-zen-moss-700' :
              season.status === 'planned' ? 'bg-zen-water-100 text-zen-water-700' :
              'bg-zen-stone-100 text-zen-stone-600'
            }`}>
              {season.status}
            </span>
          )}
        </div>

        {season.notes && (
          <p className="text-zen-stone-600 mb-4 p-3 bg-zen-kitsune-50 rounded-zen border border-zen-kitsune-100">
            {season.notes}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-zen-stone-50 rounded-zen">
            <p className="text-2xl font-display text-zen-ink-800">
              {season.beds.length}
            </p>
            <p className="text-sm text-zen-stone-500">Beds Used</p>
          </div>
          <div className="text-center p-3 bg-zen-stone-50 rounded-zen">
            <p className="text-2xl font-display text-zen-ink-800">
              {season.beds.reduce((sum, b) => sum + b.plantings.length, 0)}
            </p>
            <p className="text-sm text-zen-stone-500">Plantings</p>
          </div>
          <div className="text-center p-3 bg-zen-stone-50 rounded-zen">
            <p className="text-2xl font-display text-zen-ink-800">
              {new Set(season.beds.flatMap(b => b.plantings.map(p => p.plantId))).size}
            </p>
            <p className="text-sm text-zen-stone-500">Crop Types</p>
          </div>
          <div className="text-center p-3 bg-zen-stone-50 rounded-zen">
            <p className="text-2xl font-display text-zen-ink-800">
              {new Set(season.beds.map(b => b.rotationGroup)).size}
            </p>
            <p className="text-sm text-zen-stone-500">Rotation Groups</p>
          </div>
        </div>
      </div>

      {/* Bed Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {season.beds.map(bed => {
          const rotationDisplay = ROTATION_GROUP_DISPLAY[bed.rotationGroup as RotationGroup]

          return (
            <div
              key={bed.bedId}
              className="zen-card overflow-hidden"
            >
              <div
                className="px-4 py-3 text-white font-medium flex items-center justify-between"
                style={{ backgroundColor: BED_COLORS[bed.bedId] }}
              >
                <span className="flex items-center gap-2">
                  Bed {bed.bedId}
                </span>
                <span className="text-sm opacity-90 flex items-center gap-1">
                  {rotationDisplay?.emoji} {rotationDisplay?.name || bed.rotationGroup}
                </span>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {bed.plantings.map(planting => {
                    const veg = getVegetableById(planting.plantId)
                    const successColor = planting.success ? SUCCESS_COLORS[planting.success] : null

                    return (
                      <div key={planting.id} className="flex items-start gap-3 p-2 hover:bg-zen-stone-50 rounded-zen">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zen-ink-800">
                              {veg?.name || planting.plantId}
                            </p>
                            {planting.success && successColor && (
                              <span className={`px-1.5 py-0.5 rounded text-xs ${successColor.bg} ${successColor.text}`}>
                                {planting.success}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zen-kitsune-600">{planting.varietyName}</p>
                          {planting.sowDate && (
                            <p className="text-xs text-zen-stone-400 mt-1">
                              Sown: {new Date(planting.sowDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          )}
                          {planting.notes && (
                            <p className="text-xs text-zen-stone-500 mt-1">{planting.notes}</p>
                          )}
                        </div>
                        {planting.quantity && (
                          <span className="px-2 py-1 bg-zen-stone-100 rounded text-xs text-zen-stone-600">
                            x{planting.quantity}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
