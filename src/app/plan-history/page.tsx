'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Sprout,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Leaf,
  CheckCircle2,
  Map
} from 'lucide-react'
import { getAvailableYears, getSeasonByYear, getProblemBedsSummary } from '@/data/historical-plans'
import { 
  BED_COLORS, 
  ALL_BED_IDS,
  getBedById,
  physicalBeds,
  permanentPlantings
} from '@/data/allotment-layout'
import { generate2026Plan, ROTATION_GROUP_DISPLAY, PROBLEM_BED_SUGGESTIONS } from '@/lib/rotation-planner'
import { getVegetableById } from '@/lib/vegetable-database'
import { PhysicalBedId, RotationGroup, PlantingSuccess } from '@/types/garden-planner'

// Success badge colors
const SUCCESS_COLORS: Record<PlantingSuccess, { bg: string; text: string }> = {
  'excellent': { bg: 'bg-green-100', text: 'text-green-700' },
  'good': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'fair': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'poor': { bg: 'bg-red-100', text: 'text-red-700' }
}

export default function PlanHistoryPage() {
  const availableYears = getAvailableYears()
  const [selectedYear, setSelectedYear] = useState<number | '2026'>(availableYears[0] || 2025)
  const [showLayout, setShowLayout] = useState(false)
  
  // Generate 2026 suggestions
  const plan2026 = generate2026Plan()
  const problemBedsSummary = getProblemBedsSummary()

  const currentSeason = selectedYear === '2026' ? null : getSeasonByYear(selectedYear)

  function navigateYear(direction: 'prev' | 'next') {
    if (selectedYear === '2026') {
      setSelectedYear(availableYears[0])
      return
    }
    
    const currentIndex = availableYears.indexOf(selectedYear)
    if (direction === 'prev' && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1])
    } else if (direction === 'next') {
      if (currentIndex === 0) {
        setSelectedYear('2026')
      } else if (currentIndex > 0) {
        setSelectedYear(availableYears[currentIndex - 1])
      }
    }
  }

  // Get bed status info
  function getBedStatusInfo(bedId: PhysicalBedId) {
    const bed = getBedById(bedId)
    if (!bed) return null
    
    return {
      status: bed.status,
      isProblem: bed.status === 'problem',
      isPerennial: bed.status === 'perennial',
      problemNote: bed.problemNotes
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <History className="w-10 h-10 text-amber-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Allotment History</h1>
              <p className="text-sm text-gray-500">Past seasons and 2026 planning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLayout(!showLayout)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${
                showLayout 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              <Map className="w-4 h-4" />
              {showLayout ? 'Hide Layout' : 'View Layout'}
            </button>
            <Link 
              href="/garden-planner"
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md transition"
            >
              <Sprout className="w-4 h-4" />
              Garden Planner
            </Link>
          </div>
        </div>

        {/* Year Navigation */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateYear('prev')}
              disabled={selectedYear === availableYears[availableYears.length - 1]}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedYear === year
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {year}
                </button>
              ))}
              <button
                onClick={() => setSelectedYear('2026')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedYear === '2026'
                    ? 'bg-green-500 text-white shadow'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Plan 2026
              </button>
            </div>

            <button
              onClick={() => navigateYear('next')}
              disabled={selectedYear === '2026'}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Visual Layout View */}
        {showLayout && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Map className="w-6 h-6 text-blue-600" />
              Allotment Layout
            </h2>
            
            {/* Visual layout - matching /allotment page */}
            <div className="bg-gradient-to-b from-green-50 to-emerald-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="min-w-[550px]">
                {/* NORTH label */}
                <div className="text-center text-gray-500 mb-2 font-bold">↑ NORTH</div>
                
                {/* Top row: E, Wildish (B1+B2 width), Compost (A+berries width), Path */}
                <div className="flex gap-2 mb-2">
                  <div 
                    className="w-20 h-14 rounded flex items-center justify-center text-white font-bold text-center p-1"
                    style={{ backgroundColor: BED_COLORS['E'] }}
                  >
                    <div>
                      <div>E</div>
                      <div className="text-[10px] font-normal opacity-90">French Beans</div>
                      <div className="text-[9px] opacity-70">⚠️ Problem</div>
                    </div>
                  </div>
                  {/* Wildish - same width as B1+B2 */}
                  <div className="w-[148px] h-14 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-center">
                    <div>
                      <div className="font-bold">🌿 Wildish</div>
                      <div className="text-[10px]">Uncultivated</div>
                    </div>
                  </div>
                  {/* Compost - same width as A + berries */}
                  <div className="w-[92px] h-14 bg-amber-100 rounded flex items-center justify-center text-amber-800 text-center">
                    <div>
                      <div>🗑️</div>
                      <div className="text-[10px] font-bold">Compost</div>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                  <div className="w-8 h-14 bg-stone-300 rounded flex items-center justify-center text-stone-600 text-center">
                    <div className="transform -rotate-90 whitespace-nowrap text-[10px]">PATH</div>
                  </div>
                </div>

                {/* Row with B' beds, berries, A */}
                <div className="flex gap-2 mb-1">
                  {/* Left column top - perennials */}
                  <div className="w-20 flex flex-col gap-1">
                    <div className="h-7 bg-purple-100 rounded flex items-center justify-center text-purple-800 text-[10px]">
                      🥬 Rhubarb
                    </div>
                    <div className="h-7 bg-green-100 rounded flex items-center justify-center text-green-800 text-[10px]">
                      🍎 Apple
                    </div>
                  </div>

                  {/* B2' */}
                  <div 
                    className="w-[70px] h-14 rounded flex items-center justify-center text-white font-bold text-center"
                    style={{ backgroundColor: BED_COLORS['B2-prime'] }}
                  >
                    <div>
                      <div>B2&apos;</div>
                      <div className="text-[10px] font-normal">🫛 Peas</div>
                    </div>
                  </div>

                  {/* B1' */}
                  <div 
                    className="w-[70px] h-14 rounded flex items-center justify-center text-white font-bold text-center"
                    style={{ backgroundColor: BED_COLORS['B1-prime'] }}
                  >
                    <div>
                      <div>B1&apos;</div>
                      <div className="text-[10px] font-normal">🍓 → A</div>
                    </div>
                  </div>

                  {/* Gooseberry/Blueberry */}
                  <div className="w-14 h-14 bg-indigo-100 rounded flex items-center justify-center text-indigo-800 text-[10px] text-center">
                    🫐 Goose<br/>🫐 Blue
                  </div>

                  {/* A - same size as B' */}
                  <div 
                    className="w-[70px] h-14 rounded flex items-center justify-center text-white font-bold text-center p-1"
                    style={{ backgroundColor: BED_COLORS['A'] }}
                  >
                    <div>
                      <div>A</div>
                      <div className="text-[10px] font-normal opacity-90">🫛 → 🍓</div>
                    </div>
                  </div>

                  <div className="flex-1"></div>

                  {/* Path */}
                  <div className="w-8 bg-stone-300 rounded flex items-center justify-center text-stone-600">
                    <div className="transform -rotate-90 whitespace-nowrap text-[10px]">PATH</div>
                  </div>
                </div>

                {/* Main B beds row + C + Raspberries */}
                <div className="flex gap-2 mb-2">
                  {/* Left column - C and bottom perennials */}
                  <div className="w-20 flex flex-col gap-1">
                    <div 
                      className="h-20 rounded flex items-center justify-center text-white font-bold text-center p-1"
                      style={{ backgroundColor: BED_COLORS['C'] }}
                    >
                      <div>
                        <div>C</div>
                        <div className="text-[10px] font-normal">🌳 Shaded</div>
                        <div className="text-[9px] opacity-70">⚠️ Problem</div>
                      </div>
                    </div>
                    <div className="h-10 bg-pink-100 rounded flex items-center justify-center text-pink-800 text-[10px] text-center">
                      🍓 Straw<br/>🫐 Damson
                    </div>
                  </div>

                  {/* B2 - main bed */}
                  <div 
                    className="w-[70px] h-[120px] rounded flex items-center justify-center text-white font-bold text-center p-1"
                    style={{ backgroundColor: BED_COLORS['B2'] }}
                  >
                    <div>
                      <div className="text-lg">B2</div>
                      <div className="text-[10px] font-normal opacity-90">🧄 Garlic</div>
                      <div className="text-[10px] font-normal opacity-90">🧅 Onion</div>
                      <div className="text-[10px] font-normal opacity-90">🫘 Beans</div>
                    </div>
                  </div>

                  {/* B1 - main bed */}
                  <div 
                    className="w-[70px] h-[120px] rounded flex items-center justify-center text-white font-bold text-center p-1"
                    style={{ backgroundColor: BED_COLORS['B1'] }}
                  >
                    <div>
                      <div className="text-lg">B1</div>
                      <div className="text-[10px] font-normal opacity-90">🥬 Pak Choi</div>
                      <div className="text-[10px] font-normal opacity-90">🥦 Cauliflower</div>
                      <div className="text-[10px] font-normal opacity-90">🥕 Carrots</div>
                    </div>
                  </div>

                  {/* Empty grass area */}
                  <div className="w-14 h-[120px] bg-gray-100 rounded"></div>

                  {/* Raspberries - same height as B1/B2 */}
                  <div 
                    className="w-[70px] h-[120px] rounded flex items-center justify-center text-white font-bold text-center p-1"
                    style={{ backgroundColor: BED_COLORS['raspberries'] }}
                  >
                    <div>
                      <div className="text-xl">🍇</div>
                      <div className="text-[10px]">Raspberries</div>
                      <div className="text-[9px] opacity-70">(reduce)</div>
                    </div>
                  </div>

                  <div className="flex-1"></div>

                  {/* Path */}
                  <div className="w-8 bg-stone-300 rounded flex items-center justify-center text-stone-600">
                    <div className="transform -rotate-90 whitespace-nowrap text-[10px]">PATH</div>
                  </div>
                </div>

                {/* Small path between B beds and D */}
                <div className="flex gap-2 mb-2 items-center">
                  <div className="w-20"></div>
                  <div className="w-[148px] flex items-center">
                    <div className="flex-1 h-1 bg-stone-300 rounded"></div>
                    <span className="text-[10px] text-gray-400 px-1">path</span>
                    <div className="flex-1 h-1 bg-stone-300 rounded"></div>
                  </div>
                  <div className="flex-1"></div>
                  <div className="w-8"></div>
                </div>

                {/* Bottom row: Flowers/Apple, D (potatoes), Trees + Shed area */}
                <div className="flex gap-2">
                  <div className="w-20 flex flex-col gap-1">
                    <div className="h-7 bg-pink-100 rounded flex items-center justify-center text-pink-800 text-[10px]">
                      🌸 Flowers
                    </div>
                    <div className="h-7 bg-green-100 rounded flex items-center justify-center text-green-800 text-[10px]">
                      🍎 Apple
                    </div>
                    <div className="h-7 bg-pink-100 rounded flex items-center justify-center text-pink-800 text-[10px]">
                      🌸 Flowers
                    </div>
                  </div>
                  
                  {/* D - same width as B1+B2 */}
                  <div 
                    className="w-[148px] h-[84px] rounded flex items-center justify-center text-white font-bold text-center p-2"
                    style={{ backgroundColor: BED_COLORS['D'] }}
                  >
                    <div>
                      <div className="text-xl">D</div>
                      <div className="text-sm font-normal opacity-90">🥔 Potatoes</div>
                      <div className="text-[10px] font-normal opacity-70">Colleen • Setanta</div>
                    </div>
                  </div>

                  {/* Trees next to shed */}
                  <div className="w-14 flex flex-col gap-1">
                    <div className="h-10 bg-red-100 rounded flex items-center justify-center text-red-800 text-[10px] text-center">
                      🍒 Cherry
                    </div>
                    <div className="h-10 bg-green-100 rounded flex items-center justify-center text-green-800 text-[10px] text-center">
                      🍎 Apple
                    </div>
                  </div>

                  {/* Shed area */}
                  <div className="w-20 flex flex-col gap-1">
                    <div className="h-7 bg-stone-200 rounded flex items-center justify-center text-stone-700 text-[10px]">
                      🏠 Shed
                    </div>
                    <div className="h-7 bg-blue-100 rounded flex items-center justify-center text-blue-800 text-[10px]">
                      💧 Water
                    </div>
                    <div className="h-7 bg-green-100 rounded flex items-center justify-center text-green-800 text-[10px]">
                      🌿 Herbs
                    </div>
                  </div>

                  <div className="flex-1"></div>

                  <div className="w-8 bg-stone-300 rounded flex items-center justify-center text-stone-600">
                    <div className="transform -rotate-90 whitespace-nowrap text-[10px]">PATH</div>
                  </div>
                </div>

                {/* SOUTH label */}
                <div className="text-center text-gray-500 mt-2 font-bold">↓ SOUTH (Entry)</div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {physicalBeds.map(bed => (
                <div key={bed.id} className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: BED_COLORS[bed.id] }}
                  >
                    {bed.id.replace('-prime', "'")}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-gray-800">{bed.name}</div>
                    <div className={`${bed.status === 'problem' ? 'text-red-500' : 'text-gray-500'}`}>
                      {bed.status === 'problem' ? '⚠️ ' : ''}{bed.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Permanent plantings summary */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium text-gray-700 mb-2">Permanent Plantings</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {permanentPlantings.map(p => (
                  <span key={p.id} className="px-2 py-1 bg-green-50 text-green-700 rounded">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2026 Planning View */}
        {selectedYear === '2026' && (
          <div className="space-y-6">
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
                          style={{ backgroundColor: BED_COLORS[problem.bedId] }}
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
                      const problemInfo = PROBLEM_BED_SUGGESTIONS[suggestion.bedId]
                      
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
        )}

        {/* Historical Season View */}
        {selectedYear !== '2026' && currentSeason && (
          <div className="space-y-6">
            {/* Season Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-800">{selectedYear} Season</h2>
              </div>
              
              {currentSeason.notes && (
                <p className="text-gray-600 mb-4 p-3 bg-amber-50 rounded-lg">
                  {currentSeason.notes}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {currentSeason.beds.length}
                  </p>
                  <p className="text-sm text-gray-500">Beds Used</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {currentSeason.beds.reduce((sum, b) => sum + b.plantings.length, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Plantings</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {new Set(currentSeason.beds.flatMap(b => b.plantings.map(p => p.vegetableId))).size}
                  </p>
                  <p className="text-sm text-gray-500">Crop Types</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {new Set(currentSeason.beds.map(b => b.rotationGroup)).size}
                  </p>
                  <p className="text-sm text-gray-500">Rotation Groups</p>
                </div>
              </div>
            </div>

            {/* Bed Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSeason.beds.map(bed => {
                const rotationDisplay = ROTATION_GROUP_DISPLAY[bed.rotationGroup as RotationGroup]
                const bedInfo = getBedStatusInfo(bed.bedId)
                
                return (
                  <div 
                    key={bed.bedId} 
                    className={`bg-white rounded-xl shadow-md overflow-hidden ${
                      bedInfo?.isProblem ? 'ring-2 ring-red-300' : ''
                    }`}
                  >
                    <div 
                      className="px-4 py-3 text-white font-medium flex items-center justify-between"
                      style={{ backgroundColor: BED_COLORS[bed.bedId] }}
                    >
                      <span className="flex items-center gap-2">
                        Bed {bed.bedId}
                        {bedInfo?.isProblem && (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </span>
                      <span className="text-sm opacity-90 flex items-center gap-1">
                        {rotationDisplay?.emoji} {rotationDisplay?.name || bed.rotationGroup}
                      </span>
                    </div>
                    
                    {/* Problem Note */}
                    {bedInfo?.isProblem && bedInfo.problemNote && (
                      <div className="bg-red-50 px-4 py-2 text-xs text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        {bedInfo.problemNote}
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        {bed.plantings.map(planting => {
                          const veg = getVegetableById(planting.vegetableId)
                          const successColor = planting.success ? SUCCESS_COLORS[planting.success] : null
                          
                          return (
                            <div key={planting.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800">
                                    {veg?.name || planting.vegetableId}
                                  </p>
                                  {planting.success && successColor && (
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${successColor.bg} ${successColor.text}`}>
                                      {planting.success}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-amber-600">{planting.varietyName}</p>
                                {planting.sowDate && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Sown: {new Date(planting.sowDate).toLocaleDateString('en-GB', { 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })}
                                  </p>
                                )}
                                {planting.notes && (
                                  <p className="text-xs text-gray-500 mt-1">{planting.notes}</p>
                                )}
                              </div>
                              {planting.quantity && (
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
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
        )}

        {/* Rotation Timeline - All 9 Beds */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Rotation Timeline - All Beds</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-gray-600">Bed</th>
                  <th className="text-left py-2 px-3 text-gray-600">Status</th>
                  {availableYears.slice().reverse().map(year => (
                    <th key={year} className="text-center py-2 px-3 text-gray-600">{year}</th>
                  ))}
                  <th className="text-center py-2 px-3 text-green-600">2026</th>
                </tr>
              </thead>
              <tbody>
                {ALL_BED_IDS.map(bedId => {
                  const bed = getBedById(bedId)
                  const statusInfo = getBedStatusInfo(bedId)
                  
                  return (
                    <tr key={bedId} className={`border-b last:border-0 ${statusInfo?.isProblem ? 'bg-red-50' : ''}`}>
                      <td className="py-2 px-3">
                        <span 
                          className="inline-block px-2 py-1 rounded text-white text-center text-xs font-medium"
                          style={{ backgroundColor: BED_COLORS[bedId] }}
                        >
                          {bedId}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          statusInfo?.isProblem 
                            ? 'bg-red-100 text-red-700' 
                            : statusInfo?.isPerennial
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
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
                                {hasPoor && <span className="text-red-500 text-xs ml-0.5">!</span>}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center py-2 px-3">
                        {(() => {
                          const suggestion = plan2026.suggestions.find(s => s.bedId === bedId)
                          if (!suggestion) return null
                          
                          if (suggestion.isProblemBed) {
                            return <span title="Needs attention" className="text-red-400">?</span>
                          }
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
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-4">
            <span className="font-medium text-gray-700">Legend:</span>
            {Object.entries(ROTATION_GROUP_DISPLAY).map(([key, value]) => (
              <span key={key} className="flex items-center gap-1">
                {value.emoji} {value.name}
              </span>
            ))}
            <span className="flex items-center gap-1 text-red-500">! = poor results</span>
            <span className="flex items-center gap-1 text-red-400">? = needs attention</span>
          </div>
        </div>
      </div>
    </div>
  )
}
