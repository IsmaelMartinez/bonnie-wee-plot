'use client'

import { useTodayData } from '@/hooks/useTodayData'
import { useAllotment } from '@/hooks/useAllotment'
import { getCurrentSeason, getSeasonalTheme, SEASON_NAMES } from '@/lib/seasonal-theme'
import { isFrostTender } from '@/lib/hardiness'
import { getVegetableByIdCached } from '@/lib/vegetable-loader'
import SeasonCard from './SeasonCard'
import TaskList from './TaskList'
import QuickActions from './QuickActions'
import CompostAlerts from './CompostAlerts'
import LocationPromptBanner from './LocationPromptBanner'
import WeatherStrip from './WeatherStrip'
import FrostWarningBanner, { FrostAffectedArea } from './FrostWarningBanner'
import AitorOptInBanner from './AitorOptInBanner'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import PageTour from '@/components/onboarding/PageTour'
import SignInPrompt from '@/components/auth/SignInPrompt'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { useAitorChat } from '@/contexts/AitorChatContext'

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
    customTasks,
    maintenanceTasks,
    generatedTasks,
    dismissedTasks,
    rainfall,
    hasCoordinates,
    isLoading,
    showOnboarding,
    completeOnboarding,
    onAddCustomTask,
    onToggleCustomTask,
    onUpdateCustomTask,
    onRemoveCustomTask,
    onDismissTask,
    onCompleteTask,
    onRestoreTask,
    onRequestLocation,
  } = useTodayData()

  const hasWaterTasks = generatedTasks.some((t) => t.generatedType === 'water')
  const showLocationPrompt = !hasCoordinates && hasWaterTasks

  // Frost banner: tonight's forecast minimum + tender plantings in current season.
  const { data, updateMeta } = useAllotment()
  const { isSignedIn } = useOptionalAuth()
  const { openChat } = useAitorChat()
  const showAitorOptIn =
    isSignedIn &&
    data?.meta?.aiAdvisorEnabled !== true &&
    !data?.meta?.aiAdvisorPromptDismissedAt
  // Use local calendar day (en-CA gives YYYY-MM-DD) so the dismiss key rolls
  // over at the user's local midnight, not UTC midnight. Matches the
  // todayLocal() helper in useTodayData.ts.
  const todayIso = new Date().toLocaleDateString('en-CA')
  const tonightMinC = rainfall?.forecast?.[0]?.tempMinC ?? Infinity
  const currentSeason = data?.seasons.find((s) => s.year === data.currentYear)
  const layoutAreas = data?.layout.areas ?? []
  const affectedAreas: FrostAffectedArea[] = []
  if (tonightMinC <= 0 && currentSeason) {
    for (const areaSeason of currentSeason.areas || []) {
      const tenderNames: string[] = []
      for (const planting of areaSeason.plantings || []) {
        if (planting.status === 'removed' || planting.status === 'harvested') continue
        const veg = getVegetableByIdCached(planting.plantId)
        if (veg && isFrostTender(veg.hardiness)) {
          tenderNames.push(veg.name)
        }
      }
      if (tenderNames.length > 0) {
        const layoutArea = layoutAreas.find((a) => a.id === areaSeason.areaId)
        affectedAreas.push({
          areaId: areaSeason.areaId,
          areaName: layoutArea?.name ?? areaSeason.areaId,
          plantNames: Array.from(new Set(tenderNames)),
        })
      }
    }
  }

  const season = getCurrentSeason(currentMonth - 1) // useTodayData returns 1-indexed month
  const theme = getSeasonalTheme(season)
  const seasonName = SEASON_NAMES[season]

  const handleOnboardingComplete = () => {
    completeOnboarding()
  }

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
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div className="flex items-baseline gap-3">
              <h1 className="text-zen-ink-900">Today</h1>
              <span className="text-zen-stone-400 text-lg font-display">
                {seasonName.romaji}
              </span>
            </div>
            {!showOnboarding && <PageTour tourId="today" />}
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

          {/* One-time Aitor opt-in banner for signed-in users. */}
          {showAitorOptIn && (
            <AitorOptInBanner
              onEnable={() => {
                updateMeta({
                  aiAdvisorEnabled: true,
                  aiAdvisorPromptDismissedAt: new Date().toISOString(),
                })
                openChat()
              }}
              onDismiss={() =>
                updateMeta({ aiAdvisorPromptDismissedAt: new Date().toISOString() })
              }
            />
          )}

          {/* Optional banner: ask for location only when watering tasks exist
              and we don't yet have coordinates for rainfall lookup. */}
          {showLocationPrompt && (
            <LocationPromptBanner onRequestLocation={onRequestLocation} />
          )}

          {/* Frost warning: tonight's forecast min ≤ 0 °C and at least one tender crop active. */}
          <FrostWarningBanner
            forecastMinC={tonightMinC}
            affectedAreas={affectedAreas}
            todayIso={todayIso}
          />

          {/* Forecast strip (today / tomorrow / +1) when we have rich data,
              otherwise fall back to the rainfall summary line. */}
          {rainfall && hasCoordinates && rainfall.forecast && (
            <WeatherStrip forecast={rainfall.forecast} />
          )}
          {rainfall && hasCoordinates && !rainfall.forecast && (
            <div className="text-xs text-zen-stone-500 -mt-4">
              Rainfall: {rainfall.past3DaysMm.toFixed(1)}mm last 3 days
              {rainfall.todayMm > 0 && `, ${rainfall.todayMm.toFixed(1)}mm forecast today`}
            </div>
          )}

          {/* Tasks - full width, includes harvest and sow tasks via status filtering */}
          <TaskList
            customTasks={customTasks}
            tasks={maintenanceTasks}
            generatedTasks={generatedTasks}
            dismissedTasks={dismissedTasks}
            theme={theme}
            onAddCustomTask={onAddCustomTask}
            onToggleCustomTask={onToggleCustomTask}
            onUpdateCustomTask={onUpdateCustomTask}
            onRemoveCustomTask={onRemoveCustomTask}
            onDismissTask={onDismissTask}
            onCompleteTask={onCompleteTask}
            onRestoreTask={onRestoreTask}
          />

          {/* Compost Alerts */}
          <CompostAlerts />

          {/* Sign-in prompt for anonymous users */}
          <SignInPrompt />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zen-stone-200 text-center">
          <p className="text-sm text-zen-stone-400">
            Tailored for Scottish gardens
          </p>
        </footer>
      </div>

      {/* Onboarding Wizard - shown only on first visit */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
