'use client'

import { useTodayData } from '@/hooks/useTodayData'
import { getCurrentSeason, getSeasonalTheme, SEASON_NAMES } from '@/lib/seasonal-theme'
import SeasonCard from './SeasonCard'
import TaskList from './TaskList'
import BedAlerts from './BedAlerts'
import QuickActions from './QuickActions'
import AIInsight from './AIInsight'
import CompostAlerts from './CompostAlerts'

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Season card skeleton */}
      <div className="zen-card p-8 h-40" />

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-zen-stone-100 rounded-zen-lg" />
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="zen-card h-48" />
        <div className="zen-card h-48" />
      </div>
    </div>
  )
}

export default function TodayDashboard() {
  const {
    currentMonth,
    seasonalPhase,
    maintenanceTasks,
    generatedTasks,
    harvestReady,
    needsAttention,
    isLoading,
  } = useTodayData()

  const season = getCurrentSeason(currentMonth - 1) // useTodayData returns 1-indexed month
  const theme = getSeasonalTheme(season)
  const seasonName = SEASON_NAMES[season]

  if (isLoading) {
    return (
      <div className={`zen-page ${theme.bgPage} zen-texture`}>
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className={`zen-page ${theme.bgPage} zen-texture`}>
      <div className="relative container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-zen-ink-900">Today</h1>
            <span className="text-zen-stone-400 text-lg font-display">
              {seasonName.romaji}
            </span>
          </div>
          <p className="text-zen-stone-500 text-lg">
            Your garden, this moment
          </p>
        </header>

        <div className="space-y-8">
          {/* Season Card - Hero element */}
          <SeasonCard
            seasonalPhase={seasonalPhase}
            currentMonth={currentMonth}
            season={season}
            theme={theme}
          />

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tasks */}
            <TaskList tasks={maintenanceTasks} generatedTasks={generatedTasks} theme={theme} />

            {/* Garden Status */}
            <BedAlerts
              harvestReady={harvestReady}
              needsAttention={needsAttention}
              theme={theme}
            />
          </div>

          {/* Compost Alerts */}
          <CompostAlerts />

          {/* AI Insight */}
          <AIInsight
            input={{
              seasonalPhase,
              currentMonth,
              harvestReady,
              needsAttention,
              maintenanceTasks,
            }}
          />
        </div>

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
