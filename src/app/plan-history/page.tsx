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
import { generateRotationPlanFromData } from '@/lib/rotation'

// Extracted components
import Year2026Planning from '@/components/plan-history/Year2026Planning'
import SeasonView from '@/components/plan-history/SeasonView'
import RotationTimeline from '@/components/plan-history/RotationTimeline'

export default function PlanHistoryPage() {
  const { data, isLoading, getYears, getAreas } = useAllotment()
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
      <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zen-kitsune-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <History className="w-6 h-6 text-zen-kitsune-600" />
                <h1 className="text-zen-ink-900">History</h1>
              </div>
              <p className="text-zen-stone-500 text-lg">
                Past seasons and {nextPlanningYear} planning
              </p>
            </div>
            <Link
              href="/allotment"
              className="zen-btn-secondary flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              My Allotment
            </Link>
          </div>
        </header>

        {/* Year Navigation */}
        <div className="zen-card p-4 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateYear('prev')}
              disabled={selectedYear === availableYears[availableYears.length - 1]}
              className="p-2 rounded-zen hover:bg-zen-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5 text-zen-ink-600" />
            </button>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-zen text-sm font-medium transition ${
                    selectedYear === year
                      ? 'bg-zen-kitsune-600 text-white'
                      : 'bg-zen-stone-100 text-zen-ink-600 hover:bg-zen-stone-200'
                  }`}
                >
                  {year}
                </button>
              ))}
              <button
                onClick={() => setSelectedYear('next')}
                className={`px-4 py-2 rounded-zen text-sm font-medium transition flex items-center gap-2 ${
                  selectedYear === 'next'
                    ? 'bg-zen-moss-600 text-white'
                    : 'bg-zen-moss-100 text-zen-moss-700 hover:bg-zen-moss-200'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Plan {nextPlanningYear}
              </button>
            </div>

            <button
              onClick={() => navigateYear('next')}
              disabled={selectedYear === 'next'}
              className="p-2 rounded-zen hover:bg-zen-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5 text-zen-ink-600" />
            </button>
          </div>
        </div>

        {/* Next Year Planning View */}
        {selectedYear === 'next' && nextYearPlan && (
          <Year2026Planning plan2026={nextYearPlan} />
        )}

        {/* Historical Season View */}
        {selectedYear !== 'next' && selectedSeason && (
          <SeasonView
            season={selectedSeason}
            year={selectedYear}
          />
        )}

        {/* Rotation Timeline */}
        {nextYearPlan && (
          <RotationTimeline
            availableYears={availableYears}
            seasons={data.seasons}
            beds={getAreas('bed')}
            plan2026={nextYearPlan}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zen-stone-200 text-center">
          <p className="text-sm text-zen-stone-400">
            Tailored for Scottish gardens
          </p>
        </footer>
      </div>
    </div>
  )
}
