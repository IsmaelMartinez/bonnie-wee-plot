'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Lightbulb,
  Sprout,
  Loader2
} from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { generateRotationPlanFromData } from '@/lib/rotation-planner'

// Extracted components
import Year2026Planning from '@/components/plan-history/Year2026Planning'
import SeasonView from '@/components/plan-history/SeasonView'
import RotationTimeline from '@/components/plan-history/RotationTimeline'

export default function PlanHistoryPage() {
  const { data, isLoading, getYears } = useAllotment()
  const availableYears = getYears()
  
  const [selectedYear, setSelectedYear] = useState<number | 'next'>(() => {
    return availableYears[0] || 2025
  })
  
  // Calculate next planning year
  const nextPlanningYear = useMemo(() => {
    if (availableYears.length === 0) return 2026
    return Math.max(...availableYears) + 1
  }, [availableYears])
  
  // Generate rotation plan for next year using unified data
  const nextYearPlan = useMemo(() => {
    if (!data) return null
    return generateRotationPlanFromData(nextPlanningYear, data)
  }, [data, nextPlanningYear])
  
  // Get problem beds summary
  const problemBedsSummary = useMemo(() => {
    if (!data) return []
    const problemBeds = data.layout.beds.filter(b => b.status === 'problem')
    return problemBeds.map(bed => ({
      bedId: bed.id,
      issue: bed.problemNotes || 'Needs attention',
      suggestion: `Consider alternative plantings for ${bed.name}`
    }))
  }, [data])

  // Get selected season
  const selectedSeason = useMemo(() => {
    if (!data || selectedYear === 'next') return null
    return data.seasons.find(s => s.year === selectedYear)
  }, [data, selectedYear])

  function navigateYear(direction: 'prev' | 'next') {
    if (selectedYear === 'next') {
      setSelectedYear(availableYears[0])
      return
    }
    
    const currentIndex = availableYears.indexOf(selectedYear)
    if (direction === 'prev' && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1])
    } else if (direction === 'next') {
      if (currentIndex === 0) {
        setSelectedYear('next')
      } else if (currentIndex > 0) {
        setSelectedYear(availableYears[currentIndex - 1])
      }
    }
  }

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
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
              <p className="text-sm text-gray-500">Past seasons and {nextPlanningYear} planning</p>
            </div>
          </div>
          <Link 
            href="/allotment"
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md transition"
          >
            <Sprout className="w-4 h-4" />
            My Allotment
          </Link>
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
                onClick={() => setSelectedYear('next')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedYear === 'next'
                    ? 'bg-green-500 text-white shadow'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Plan {nextPlanningYear}
              </button>
            </div>

            <button
              onClick={() => navigateYear('next')}
              disabled={selectedYear === 'next'}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Next Year Planning View */}
        {selectedYear === 'next' && nextYearPlan && (
          <Year2026Planning 
            plan2026={nextYearPlan} 
            problemBedsSummary={problemBedsSummary} 
          />
        )}

        {/* Historical Season View */}
        {selectedYear !== 'next' && selectedSeason && (
          <SeasonView 
            season={selectedSeason} 
            year={selectedYear} 
            beds={data.layout.beds}
          />
        )}

        {/* Rotation Timeline */}
        {nextYearPlan && (
          <RotationTimeline 
            availableYears={availableYears} 
            seasons={data.seasons}
            beds={data.layout.beds}
            plan2026={nextYearPlan} 
          />
        )}
      </div>
    </div>
  )
}
