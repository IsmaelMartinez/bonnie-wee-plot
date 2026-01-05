'use client'

import { Lightbulb, AlertTriangle, CheckCircle2, Leaf, ArrowRight } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY } from '@/lib/rotation'
import { getVegetableById } from '@/lib/vegetable-database'
import { RotationPlan } from '@/types/garden-planner'

interface Year2026PlanningProps {
  plan2026: RotationPlan
}

export default function Year2026Planning({ plan2026 }: Year2026PlanningProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="zen-card p-6 bg-zen-moss-50 border-zen-moss-200">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-8 h-8 text-zen-moss-600" />
          <div>
            <h2 className="text-xl font-display text-zen-moss-800">{plan2026.year} Rotation Suggestions</h2>
            <p className="text-zen-moss-600">Based on your planting history</p>
          </div>
        </div>

        {plan2026.warnings.length > 0 && (
          <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3">
            <div className="flex items-center gap-2 text-zen-kitsune-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Rotation Notes</span>
            </div>
            {plan2026.warnings.map((warning, i) => (
              <p key={i} className="text-sm text-zen-kitsune-600 ml-6">{warning}</p>
            ))}
          </div>
        )}
      </div>

      {/* 2026 Bed Suggestions - Split by type */}
      <div className="space-y-6">
        {/* Rotation Beds */}
        <div>
          <h3 className="font-display text-zen-ink-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-zen-moss-600" />
            Rotation Beds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan2026.suggestions
              .filter(s => !s.isProblemBed && !s.isPerennial)
              .map(suggestion => {
                const prevDisplay = ROTATION_GROUP_DISPLAY[suggestion.previousGroup]
                const suggDisplay = ROTATION_GROUP_DISPLAY[suggestion.suggestedGroup]

                return (
                  <div key={suggestion.bedId} className="zen-card overflow-hidden">
                    <div
                      className="px-4 py-3 text-white font-medium"
                      style={{ backgroundColor: BED_COLORS[suggestion.bedId] }}
                    >
                      Bed {suggestion.bedId}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{prevDisplay?.emoji}</span>
                        <span className="text-zen-stone-400 text-sm">{prevDisplay?.name}</span>
                        <ArrowRight className="w-4 h-4 text-zen-stone-400" />
                        <span className="text-2xl">{suggDisplay?.emoji}</span>
                        <span className="font-medium text-zen-ink-800 text-sm">{suggDisplay?.name}</span>
                      </div>

                      <p className="text-sm text-zen-stone-600 mb-3">{suggestion.reason}</p>

                      {suggestion.suggestedVegetables.length > 0 && (
                        <div className="border-t border-zen-stone-100 pt-3">
                          <p className="text-xs text-zen-stone-500 mb-2">Suggested vegetables:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.suggestedVegetables.slice(0, 5).map(vegId => {
                              const veg = getVegetableById(vegId)
                              return veg ? (
                                <span
                                  key={vegId}
                                  className="px-2 py-1 bg-zen-stone-100 rounded text-xs text-zen-ink-700"
                                >
                                  {veg.name}
                                </span>
                              ) : null
                            })}
                            {suggestion.suggestedVegetables.length > 5 && (
                              <span className="px-2 py-1 text-xs text-zen-stone-400">
                                +{suggestion.suggestedVegetables.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Perennial Beds */}
        {plan2026.suggestions.some(s => s.isPerennial) && (
          <div>
            <h3 className="font-display text-zen-ink-800 mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-zen-bamboo-600" />
              Perennial Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan2026.suggestions
                .filter(s => s.isPerennial)
                .map(suggestion => (
                  <div key={suggestion.bedId} className="zen-card overflow-hidden border border-zen-bamboo-200">
                    <div
                      className="px-4 py-3 text-white font-medium"
                      style={{ backgroundColor: BED_COLORS[suggestion.bedId] }}
                    >
                      {suggestion.bedId === 'raspberries' ? 'Raspberry Area' : `Bed ${suggestion.bedId}`}
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-zen-stone-600">{suggestion.reason}</p>
                      <p className="text-xs text-zen-bamboo-600 mt-2">
                        No rotation needed - maintain and tend existing plantings
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
