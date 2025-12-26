'use client'

import { Lightbulb, AlertTriangle, AlertCircle, CheckCircle2, Leaf, ArrowRight } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY, PROBLEM_BED_SUGGESTIONS } from '@/lib/rotation-planner'
import { getVegetableById } from '@/lib/vegetable-database'
import { RotationPlan } from '@/types/garden-planner'

interface ProblemBedSummary {
  bedId: string
  issue: string
  suggestion: string
}

interface Year2026PlanningProps {
  plan2026: RotationPlan
  problemBedsSummary: ProblemBedSummary[]
}

export default function Year2026Planning({ plan2026, problemBedsSummary }: Year2026PlanningProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">2026 Rotation Suggestions</h2>
            <p className="text-green-100">Based on your 2024 and 2025 planting history</p>
          </div>
        </div>
        
        {plan2026.warnings.length > 0 && (
          <div className="bg-yellow-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-100 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Rotation Notes</span>
            </div>
            {plan2026.warnings.map((warning, i) => (
              <p key={i} className="text-sm text-yellow-100 ml-6">{warning}</p>
            ))}
          </div>
        )}
      </div>

      {/* Problem Beds Alert */}
      {problemBedsSummary.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">Problem Beds Need Attention</span>
          </div>
          <div className="space-y-3">
            {problemBedsSummary.map(problem => (
              <div key={problem.bedId} className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="px-2 py-0.5 rounded text-white text-sm font-bold"
                    style={{ backgroundColor: BED_COLORS[problem.bedId as keyof typeof BED_COLORS] }}
                  >
                    Bed {problem.bedId}
                  </span>
                  <span className="text-red-600 text-sm">{problem.issue}</span>
                </div>
                <p className="text-sm text-gray-700 ml-1">{problem.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2026 Bed Suggestions - Split by type */}
      <div className="space-y-6">
        {/* Rotation Beds */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Rotation Beds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan2026.suggestions
              .filter(s => !s.isProblemBed && !s.isPerennial)
              .map(suggestion => {
                const prevDisplay = ROTATION_GROUP_DISPLAY[suggestion.previousGroup]
                const suggDisplay = ROTATION_GROUP_DISPLAY[suggestion.suggestedGroup]
                
                return (
                  <div key={suggestion.bedId} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div 
                      className="px-4 py-3 text-white font-medium"
                      style={{ backgroundColor: BED_COLORS[suggestion.bedId] }}
                    >
                      Bed {suggestion.bedId}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{prevDisplay?.emoji}</span>
                        <span className="text-gray-400 text-sm">{prevDisplay?.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-2xl">{suggDisplay?.emoji}</span>
                        <span className="font-medium text-gray-800 text-sm">{suggDisplay?.name}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>
                      
                      {suggestion.suggestedVegetables.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-500 mb-2">Suggested vegetables:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.suggestedVegetables.slice(0, 5).map(vegId => {
                              const veg = getVegetableById(vegId)
                              return veg ? (
                                <span 
                                  key={vegId}
                                  className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                                >
                                  {veg.name}
                                </span>
                              ) : null
                            })}
                            {suggestion.suggestedVegetables.length > 5 && (
                              <span className="px-2 py-1 text-xs text-gray-400">
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

        {/* Problem Beds */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Problem Beds - Special Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan2026.suggestions
              .filter(s => s.isProblemBed)
              .map(suggestion => {
                const problemInfo = PROBLEM_BED_SUGGESTIONS[suggestion.bedId as keyof typeof PROBLEM_BED_SUGGESTIONS]
                
                return (
                  <div key={suggestion.bedId} className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-200">
                    <div 
                      className="px-4 py-3 text-white font-medium flex items-center justify-between"
                      style={{ backgroundColor: BED_COLORS[suggestion.bedId] }}
                    >
                      <span>Bed {suggestion.bedId}</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Needs Attention</span>
                    </div>
                    <div className="p-4">
                      <p className="text-red-600 text-sm mb-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {suggestion.problemNote || problemInfo?.issue}
                      </p>
                      
                      <p className="text-sm text-gray-700 mb-4">{suggestion.reason}</p>
                      
                      {problemInfo && (
                        <div className="space-y-3">
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-700 font-medium mb-2">Perennial Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {problemInfo.perennialOptions.map(opt => (
                                <span key={opt} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-700 font-medium mb-2">Annual Options (if retrying):</p>
                            <div className="flex flex-wrap gap-1">
                              {problemInfo.annualOptions.map(opt => (
                                <span key={opt} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                                  {opt}
                                </span>
                              ))}
                            </div>
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
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              Perennial Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan2026.suggestions
                .filter(s => s.isPerennial)
                .map(suggestion => (
                  <div key={suggestion.bedId} className="bg-white rounded-xl shadow-md overflow-hidden border border-emerald-200">
                    <div 
                      className="px-4 py-3 text-white font-medium"
                      style={{ backgroundColor: BED_COLORS[suggestion.bedId] }}
                    >
                      {suggestion.bedId === 'raspberries' ? 'Raspberry Area' : `Bed ${suggestion.bedId}`}
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600">{suggestion.reason}</p>
                      <p className="text-xs text-emerald-600 mt-2">
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



