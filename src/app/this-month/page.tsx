'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Sprout,
  Shovel,
  Carrot,
  CheckCircle,
  Recycle,
  RotateCcw,
  Users,
  Leaf,
  Cloud,
  Lightbulb,
  Home,
  MapPin,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react'
import UnifiedCalendar from '@/components/garden-planner/UnifiedCalendar'
import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableById, getMaintenanceForMonth, type MaintenanceTask } from '@/lib/vegetable-database'
import { Area } from '@/types/unified-allotment'
import {
  scotlandMonthlyCalendar,
  MONTH_KEYS,
  getCurrentMonthKey,
  type MonthKey
} from '@/data/scotland-calendar'
import { BED_COLORS } from '@/data/allotment-layout'
import { Scissors, Droplet, TreeDeciduous, Layers } from 'lucide-react'
import PageTour from '@/components/onboarding/PageTour'

// Month selector button component
function MonthButton({
  monthKey,
  isSelected,
  onClick
}: {
  monthKey: MonthKey
  isSelected: boolean
  onClick: () => void
}) {
  const data = scotlandMonthlyCalendar[monthKey]
  return (
    <button
      onClick={onClick}
      className={`px-2 sm:px-3 py-2.5 rounded-zen text-xs sm:text-sm font-medium transition whitespace-nowrap min-h-[44px] ${
        isSelected
          ? 'bg-zen-moss-600 text-white'
          : 'bg-white text-zen-ink-700 hover:bg-zen-stone-50 border border-zen-stone-200'
      }`}
    >
      <span className="hidden sm:inline">{data.emoji} {data.month.slice(0, 3)}</span>
      <span className="sm:hidden">{data.emoji} {data.month.slice(0, 1)}</span>
    </button>
  )
}

// Task list component
function TaskList({
  items,
  emptyMessage = 'Nothing this month'
}: {
  items: string[]
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return <p className="text-zen-stone-500 text-sm italic">{emptyMessage}</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span className="text-zen-moss-500 mr-2 mt-1">•</span>
          <span className="text-zen-ink-700 text-sm">{item}</span>
        </li>
      ))}
    </ul>
  )
}

// Specialization tip card
function TipCard({
  icon: Icon,
  title,
  content,
  color
}: {
  icon: React.ElementType
  title: string
  content: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-zen-moss-50 border-zen-moss-200 text-zen-moss-800',
    blue: 'bg-zen-water-50 border-zen-water-200 text-zen-water-800',
    amber: 'bg-zen-kitsune-50 border-zen-kitsune-200 text-zen-kitsune-800',
    purple: 'bg-zen-sakura-50 border-zen-sakura-200 text-zen-sakura-800'
  }
  const iconColors: Record<string, string> = {
    green: 'text-zen-moss-600',
    blue: 'text-zen-water-600',
    amber: 'text-zen-kitsune-600',
    purple: 'text-zen-sakura-600'
  }

  return (
    <div className={`rounded-zen border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center mb-2">
        <Icon className={`w-5 h-5 mr-2 ${iconColors[color]}`} />
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed">{content}</p>
    </div>
  )
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Format a date range for display (e.g., "mid-July to August")
function formatDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate) return null
  const start = new Date(startDate)
  const startMonth = MONTH_NAMES[start.getMonth()]
  if (!endDate) return startMonth
  const end = new Date(endDate)
  const endMonth = MONTH_NAMES[end.getMonth()]
  if (startMonth === endMonth) return startMonth
  return `${startMonth} to ${endMonth}`
}

// Personalized planting card
function PersonalizedPlanting({
  bedId,
  plantingId,
  vegetableName,
  varietyName,
  context,
  dateInfo,
  sowMethodHint,
  isClickable,
  hasSeeds
}: {
  bedId: string
  plantingId?: string
  vegetableName: string
  varietyName?: string
  context?: 'harvest' | 'growing' | 'sow'
  dateInfo?: string | null
  sowMethodHint?: string
  isClickable?: boolean
  hasSeeds?: boolean
}) {
  const content = (
    <div className="flex items-start gap-3 p-3 bg-white/80 rounded-zen border border-zen-moss-200">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium text-zen-ink-800">{vegetableName}</div>
          {context === 'sow' && hasSeeds !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${hasSeeds ? 'bg-zen-moss-100 text-zen-moss-700' : 'bg-zen-stone-100 text-zen-stone-600'}`}>
              {hasSeeds ? '✓ Seeds' : 'No seeds'}
            </span>
          )}
        </div>
        {varietyName && <div className="text-xs text-zen-stone-500">{varietyName}</div>}
        <div className="text-xs text-zen-moss-600 mt-1">Bed {bedId}</div>
        {context === 'harvest' && dateInfo && (
          <div className="text-xs text-zen-kitsune-600 mt-1">Expected harvest: {dateInfo}</div>
        )}
        {context === 'growing' && dateInfo && (
          <div className="text-xs text-zen-water-600 mt-1">Harvest expected: {dateInfo}</div>
        )}
        {context === 'sow' && sowMethodHint && (
          <div className="text-xs text-zen-moss-500 mt-1">{sowMethodHint}</div>
        )}
      </div>
    </div>
  )

  if (isClickable && plantingId) {
    return (
      <Link
        href={`/allotment?bed=${bedId}&planting=${plantingId}`}
        className="block hover:opacity-90 transition"
      >
        {content}
      </Link>
    )
  }

  return content
}

// Maintenance task card
function MaintenanceCard({ task }: { task: MaintenanceTask }) {
  const typeIcons = {
    prune: Scissors,
    feed: Droplet,
    mulch: TreeDeciduous
  }
  const typeLabels = {
    prune: 'Prune',
    feed: 'Feed',
    mulch: 'Mulch'
  }
  const typeColors = {
    prune: 'text-zen-sakura-600 bg-zen-sakura-50 border-zen-sakura-200',
    feed: 'text-zen-water-600 bg-zen-water-50 border-zen-water-200',
    mulch: 'text-zen-kitsune-600 bg-zen-kitsune-50 border-zen-kitsune-200'
  }

  const Icon = typeIcons[task.type]

  return (
    <div className={`flex items-start gap-3 p-3 rounded-zen border ${typeColors[task.type]}`}>
      <Icon className="w-5 h-5 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium">{task.vegetable.name}</div>
        <div className="text-xs opacity-75">{typeLabels[task.type]}</div>
        {task.notes && task.notes.length > 0 && (
          <div className="text-xs mt-1 opacity-75">{task.notes[0]}</div>
        )}
      </div>
    </div>
  )
}

export default function ThisMonthPage() {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('january')
  const [isExpertTipsOpen, setIsExpertTipsOpen] = useState(false)

  // Load allotment data for personalization
  const { data: allotmentData, currentSeason, isLoading, getAreasByKind } = useAllotment()

  // Auto-select current month on page load
  useEffect(() => {
    setSelectedMonth(getCurrentMonthKey())
  }, [])

  const data = scotlandMonthlyCalendar[selectedMonth]
  const isCurrentMonth = selectedMonth === getCurrentMonthKey()

  // Get personalized maintenance for user's permanent plantings (trees, berries, perennials)
  const personalizedMaintenance = useMemo(() => {
    const treeAreas = getAreasByKind('tree')
    const berryAreas = getAreasByKind('berry')
    const herbAreas = getAreasByKind('herb')
    const perennialBedAreas = getAreasByKind('perennial-bed')
    const permanentAreas: Area[] = [...treeAreas, ...berryAreas, ...herbAreas, ...perennialBedAreas]
    if (permanentAreas.length === 0) return { tasks: [] as MaintenanceTask[], plantings: [] as Area[] }

    const plantIds = permanentAreas
      .filter((p: Area) => p.primaryPlant?.plantId)
      .map((p: Area) => p.primaryPlant!.plantId)

    if (plantIds.length === 0) return { tasks: [] as MaintenanceTask[], plantings: permanentAreas }

    // Get maintenance tasks for the month
    const monthIndex = MONTH_KEYS.indexOf(selectedMonth) + 1
    const allTasks = getMaintenanceForMonth(monthIndex)
    // Filter to user's plants
    const tasks = allTasks.filter(t => plantIds.includes(t.vegetable.id))

    return { tasks, plantings: permanentAreas }
  }, [getAreasByKind, selectedMonth])
  
  // Get personalized tasks based on user's plantings, using actual dates when available
  const personalizedData = useMemo(() => {
    if (!currentSeason || !allotmentData) return null

    interface PlantingInfo {
      id: string
      areaId: string
      plantId: string
      vegetableName: string
      varietyName?: string
      sowDate?: string
      expectedHarvestStart?: string
      expectedHarvestEnd?: string
      actualHarvestStart?: string
      actualHarvestEnd?: string
      harvestMonths: number[]
      sowMonths: number[]
      sowMethodHint?: string
      hasSowDate: boolean
      hasSeeds?: boolean
    }

    const allPlantings: PlantingInfo[] = []

    // Helper: check if user has seeds for this planting
    const checkHasSeeds = (plantId: string, varietyName?: string): boolean => {
      if (!varietyName) return false
      const variety = allotmentData.varieties.find(
        v => v.plantId === plantId && v.name.toLowerCase().trim() === varietyName.toLowerCase().trim()
      )
      if (!variety) return false
      return variety.seedsByYear?.[currentSeason.year] === 'have'
    }

    for (const areaSeason of currentSeason.areas) {
      for (const planting of areaSeason.plantings) {
        const veg = getVegetableById(planting.plantId)
        if (veg) {
          const sowIndoors = veg.planting?.sowIndoorsMonths || []
          const sowOutdoors = veg.planting?.sowOutdoorsMonths || []
          allPlantings.push({
            id: planting.id,
            areaId: areaSeason.areaId,
            plantId: planting.plantId,
            vegetableName: veg.name,
            varietyName: planting.varietyName,
            sowDate: planting.sowDate,
            expectedHarvestStart: planting.expectedHarvestStart,
            expectedHarvestEnd: planting.expectedHarvestEnd,
            actualHarvestStart: planting.actualHarvestStart,
            actualHarvestEnd: planting.actualHarvestEnd,
            harvestMonths: veg.planting?.harvestMonths || [],
            sowMonths: [...sowIndoors, ...sowOutdoors],
            sowMethodHint: sowIndoors.length > 0 && sowOutdoors.length > 0
              ? 'Sow indoors or outdoors'
              : sowIndoors.length > 0 ? 'Sow indoors' : 'Sow outdoors',
            hasSowDate: !!planting.sowDate,
            hasSeeds: checkHasSeeds(planting.plantId, planting.varietyName)
          })
        }
      }
    }

    const monthIndex = MONTH_KEYS.indexOf(selectedMonth) + 1

    // Helper: check if a month falls within a date range
    const monthInRange = (month: number, startDate?: string, endDate?: string): boolean => {
      if (!startDate) return false
      const startMonth = new Date(startDate).getMonth() + 1
      if (!endDate) return month === startMonth
      const endMonth = new Date(endDate).getMonth() + 1
      if (startMonth <= endMonth) return month >= startMonth && month <= endMonth
      // Wraps year boundary
      return month >= startMonth || month <= endMonth
    }

    const isHarvestableThisMonth = (p: PlantingInfo): boolean => {
      const hStart = p.actualHarvestStart || p.expectedHarvestStart
      const hEnd = p.actualHarvestEnd || p.expectedHarvestEnd
      if (hStart) return monthInRange(monthIndex, hStart, hEnd)
      return p.harvestMonths.includes(monthIndex)
    }

    // "Harvest now" — sown plantings whose harvest window includes this month
    const harvestNow = allPlantings.filter(p => p.hasSowDate && isHarvestableThisMonth(p))

    // "Sow this month" — plantings without a sow date where the database says this is a sow window
    // Sort by seed availability: prioritize varieties with seeds
    const sowThisMonth = allPlantings
      .filter(p => {
        if (p.hasSowDate) return false
        return p.sowMonths.includes(monthIndex)
      })
      .sort((a, b) => {
        if (a.hasSeeds && !b.hasSeeds) return -1
        if (!a.hasSeeds && b.hasSeeds) return 1
        return 0
      })

    // "Growing" — planted but not yet ready to harvest this month
    const growing = allPlantings.filter(p => {
      if (!p.hasSowDate) return false
      return !isHarvestableThisMonth(p)
    })

    return {
      plantingCount: allPlantings.length,
      harvestNow,
      sowThisMonth,
      growing
    }
  }, [currentSeason, allotmentData, selectedMonth])

  // Build calendar plantings data
  const calendarPlantings = useMemo(() => {
    if (!currentSeason || !allotmentData) return []

    const entries: Array<{
      bedId: string
      bedName: string
      bedColor: string
      plantId: string
      varietyName?: string
      sowDate?: string
      expectedHarvestStart?: string
      expectedHarvestEnd?: string
      actualHarvestStart?: string
      actualHarvestEnd?: string
    }> = []

    for (const areaSeason of currentSeason.areas) {
      const area = allotmentData.layout.areas.find((a: Area) => a.id === areaSeason.areaId)
      const bedColor = area?.color || BED_COLORS[areaSeason.areaId] || '#9ca3af'
      const bedName = area?.name || `Area ${areaSeason.areaId}`

      for (const planting of areaSeason.plantings) {
        entries.push({
          bedId: areaSeason.areaId,
          bedName,
          bedColor,
          plantId: planting.plantId,
          varietyName: planting.varietyName,
          sowDate: planting.sowDate,
          expectedHarvestStart: planting.expectedHarvestStart,
          expectedHarvestEnd: planting.expectedHarvestEnd,
          actualHarvestStart: planting.actualHarvestStart,
          actualHarvestEnd: planting.actualHarvestEnd
        })
      }
    }

    return entries
  }, [currentSeason, allotmentData])

  const hasAnnualPlantings = personalizedData && personalizedData.plantingCount > 0
  const hasPermanentPlantings = personalizedMaintenance.plantings.length > 0
  const hasAnyPlantings = hasAnnualPlantings || hasPermanentPlantings
  
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-baseline gap-3">
              <Calendar className="w-6 h-6 text-zen-moss-600" />
              <h1 className="text-zen-ink-900">This Month</h1>
            </div>
            <PageTour tourId="this-month" />
          </div>
          <p className="text-zen-stone-500 text-lg">
            Seasonal tasks for Scottish gardens
          </p>
        </header>

        {/* Month Selector */}
        <div className="mb-8" data-tour="month-selector">
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
            {MONTH_KEYS.map((monthKey) => (
              <MonthButton
                key={monthKey}
                monthKey={monthKey}
                isSelected={selectedMonth === monthKey}
                onClick={() => setSelectedMonth(monthKey)}
              />
            ))}
          </div>
        </div>

        {/* Current Month Indicator */}
        {isCurrentMonth && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-zen-moss-100 text-zen-moss-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-zen-moss-500 rounded-full mr-2 animate-pulse"></span>
              You&apos;re viewing the current month
            </div>
          </div>
        )}

        {/* Month Overview */}
        <div className="zen-card p-6 mb-8" data-tour="month-overview">
          <div className="flex items-start">
            <span className="text-4xl mr-4">{data.emoji}</span>
            <div>
              <h2 className="text-xl font-display text-zen-ink-800 mb-2">{data.month}</h2>
              <p className="text-zen-stone-600 leading-relaxed">{data.overview}</p>
            </div>
          </div>
        </div>

        {/* Personalized Section - Your Garden This Month (unified: annuals + trees & perennials) */}
        {!isLoading && hasAnyPlantings && (
          <div className="zen-card p-6 mb-8 border-zen-moss-200 bg-zen-moss-50/30" data-tour="your-garden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-zen-moss-600 mr-2" />
                <h3 className="font-display text-zen-ink-800">Your Garden in {data.month}</h3>
              </div>
              <Link
                href="/allotment"
                className="text-sm text-zen-moss-600 hover:text-zen-moss-700"
              >
                View All →
              </Link>
            </div>

            {hasAnnualPlantings && personalizedData && (
              <div className="space-y-4">
                {/* Harvest now */}
                {personalizedData.harvestNow.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zen-kitsune-700 mb-2 flex items-center">
                      <Carrot className="w-4 h-4 mr-2" />
                      Harvest now
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {personalizedData.harvestNow.map((p) => (
                        <PersonalizedPlanting
                          key={p.id}
                          bedId={p.areaId}
                          plantingId={p.id}
                          vegetableName={p.vegetableName}
                          varietyName={p.varietyName}
                          context="harvest"
                          dateInfo={formatDateRange(
                            p.actualHarvestStart || p.expectedHarvestStart,
                            p.actualHarvestEnd || p.expectedHarvestEnd
                          )}
                          isClickable={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sow this month */}
                {personalizedData.sowThisMonth.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zen-moss-700 mb-2 flex items-center">
                      <Sprout className="w-4 h-4 mr-2" />
                      Sow this month
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {personalizedData.sowThisMonth.map((p) => (
                        <PersonalizedPlanting
                          key={p.id}
                          bedId={p.areaId}
                          vegetableName={p.vegetableName}
                          varietyName={p.varietyName}
                          context="sow"
                          sowMethodHint={p.sowMethodHint}
                          hasSeeds={p.hasSeeds}
                        />
                      ))}
                    </div>
                    {personalizedData.sowThisMonth.some(p => !p.hasSeeds && p.varietyName) && (
                      <Link
                        href="/seeds"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-zen-moss-600 hover:text-zen-moss-700"
                      >
                        <Package className="w-4 h-4" />
                        Manage seed inventory →
                      </Link>
                    )}
                  </div>
                )}

                {/* Growing */}
                {personalizedData.growing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zen-water-700 mb-2 flex items-center">
                      <Leaf className="w-4 h-4 mr-2" />
                      Growing
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {personalizedData.growing.map((p) => (
                        <PersonalizedPlanting
                          key={p.id}
                          bedId={p.areaId}
                          vegetableName={p.vegetableName}
                          varietyName={p.varietyName}
                          context="growing"
                          dateInfo={formatDateRange(
                            p.expectedHarvestStart,
                            p.expectedHarvestEnd
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {personalizedData.harvestNow.length === 0 && personalizedData.sowThisMonth.length === 0 && personalizedData.growing.length === 0 && (
                  <p className="text-sm text-zen-stone-500 italic">
                    No specific tasks for your plantings this month.
                  </p>
                )}
              </div>
            )}

            {/* Trees & Perennials subsection */}
            {hasPermanentPlantings && (
              <div className={hasAnnualPlantings ? 'mt-6 pt-5 border-t border-zen-moss-200' : ''}>
                <div className="flex items-center mb-3">
                  <TreeDeciduous className="w-4 h-4 text-zen-moss-600 mr-2" />
                  <h4 className="text-sm font-medium text-zen-ink-700">Trees & Perennials</h4>
                </div>

                {/* List user's permanent plantings */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {personalizedMaintenance.plantings.map((area: Area) => (
                    <span
                      key={area.id}
                      className="inline-flex items-center px-2 py-1 rounded-zen bg-white/70 border border-zen-moss-200 text-sm text-zen-ink-700"
                    >
                      {area.kind === 'tree' && '🌳'}
                      {area.kind === 'berry' && '🫐'}
                      {area.kind === 'perennial-bed' && '🥬'}
                      {area.kind === 'herb' && '🌿'}
                      <span className="ml-1">{area.name}</span>
                    </span>
                  ))}
                </div>

                {/* Personalized maintenance tasks */}
                {personalizedMaintenance.tasks.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Maintenance for {data.month}</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {personalizedMaintenance.tasks.map((task, index) => (
                        <MaintenanceCard key={`personal-${task.vegetable.id}-${task.type}-${index}`} task={task} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zen-stone-500 italic">
                    No specific maintenance tasks for your trees and perennials this month.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Planting Calendar */}
        {!isLoading && calendarPlantings.length > 0 && (
          <div className="mb-8">
            <UnifiedCalendar
              plantings={calendarPlantings}
              currentMonth={MONTH_KEYS.indexOf(selectedMonth) + 1}
            />
          </div>
        )}

        {/* No plantings prompt */}
        {!isLoading && !hasAnyPlantings && (
          <div className="zen-card p-6 mb-8 text-center border-zen-water-200 bg-zen-water-50/30">
            <Sprout className="w-10 h-10 text-zen-water-400 mx-auto mb-3" />
            <h3 className="text-lg font-display text-zen-water-800 mb-2">Track Your Garden</h3>
            <p className="text-zen-water-600 mb-4">
              Add your plantings to get personalized recommendations for {data.month}
            </p>
            <Link
              href="/allotment"
              className="zen-btn-primary"
            >
              <MapPin className="w-4 h-4" />
              Manage My Allotment
            </Link>
          </div>
        )}

        {/* Scottish Calendar Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-zen-stone-400" />
          <h2 className="font-display text-zen-ink-700">Scottish Gardening Calendar</h2>
          <span className="text-xs text-zen-stone-400 bg-zen-stone-100 px-2 py-0.5 rounded-full">General guidance</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Sowing Section */}
          <div className="zen-card p-6" data-tour="sowing-section">
            <div className="flex items-center mb-4">
              <Sprout className="w-5 h-5 text-zen-moss-600 mr-2" />
              <h3 className="font-display text-zen-ink-800">What to Sow</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zen-ink-700 mb-2 flex items-center">
                  <Home className="w-4 h-4 mr-1 text-zen-stone-400" /> Indoors
                </h4>
                <TaskList
                  items={data.sowIndoors}
                  emptyMessage="No indoor sowing this month"
                />
              </div>

              <div className="border-t border-zen-stone-100 pt-4">
                <h4 className="text-sm font-medium text-zen-ink-700 mb-2 flex items-center">
                  <Cloud className="w-4 h-4 mr-1 text-zen-stone-400" /> Outdoors
                </h4>
                <TaskList
                  items={data.sowOutdoors}
                  emptyMessage="No outdoor sowing this month"
                />
              </div>
            </div>
          </div>

          {/* Plant Out Section */}
          <div className="zen-card p-6">
            <div className="flex items-center mb-4">
              <Shovel className="w-5 h-5 text-zen-kitsune-600 mr-2" />
              <h3 className="font-display text-zen-ink-800">Plant Out</h3>
            </div>
            <TaskList
              items={data.plantOut}
              emptyMessage="Nothing to plant out this month"
            />
          </div>

          {/* Harvest Section */}
          <div className="zen-card p-6" data-tour="harvest-section">
            <div className="flex items-center mb-4">
              <Carrot className="w-5 h-5 text-zen-kitsune-600 mr-2" />
              <h3 className="font-display text-zen-ink-800">Ready to Harvest</h3>
            </div>
            <TaskList
              items={data.harvest}
              emptyMessage="The hungry gap – not much to harvest"
            />
          </div>

          {/* Key Tasks Section */}
          <div className="zen-card p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-zen-water-600 mr-2" />
              <h3 className="font-display text-zen-ink-800">Key Tasks</h3>
            </div>
            <TaskList items={data.tasks} />
          </div>
        </div>

        {/* Soil Care - Featured Section */}
        <div className="zen-card p-6 mb-8 bg-gradient-to-br from-amber-50 to-orange-50 border-zen-bamboo-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-zen-lg bg-zen-bamboo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-display text-zen-ink-800 mb-2">Soil Care</h3>
              <p className="text-amber-900 leading-relaxed">
                Add compost and organic matter to improve soil structure. Mulch bare soil to retain moisture and suppress weeds.
              </p>
              <p className="text-xs text-amber-700 mt-3 italic">
                Healthy soil grows healthy plants. Feed the soil, and it feeds you.
              </p>
            </div>
          </div>
        </div>

        {/* Specialization Tips - Collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setIsExpertTipsOpen(!isExpertTipsOpen)}
            className="w-full flex items-center justify-between text-lg font-display text-zen-ink-800 mb-4 hover:text-zen-moss-700 transition"
            aria-expanded={isExpertTipsOpen}
            aria-controls="expert-tips-content"
            aria-label="Toggle expert tips section"
          >
            <span>Expert Tips for {data.month}</span>
            {isExpertTipsOpen ? (
              <ChevronUp className="w-5 h-5 text-zen-stone-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zen-stone-500" />
            )}
          </button>
          {isExpertTipsOpen && (
            <div id="expert-tips-content" className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <TipCard
                icon={Recycle}
                title="Composting"
                content={data.composting}
                color="green"
              />
              <TipCard
                icon={RotateCcw}
                title="Crop Rotation"
                content={data.rotation}
                color="blue"
              />
              <TipCard
                icon={Users}
                title="Companions"
                content={data.companions}
                color="purple"
              />
              <TipCard
                icon={Leaf}
                title="Organic"
                content={data.organic}
                color="amber"
              />
            </div>
          )}
        </div>

        {/* Weather & Tip Callouts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weather */}
          <div className="zen-card p-6 bg-zen-water-50/30 border-zen-water-200">
            <div className="flex items-center mb-3">
              <Cloud className="w-5 h-5 text-zen-water-600 mr-2" />
              <h3 className="font-display text-zen-water-800">Weather to Expect</h3>
            </div>
            <p className="text-zen-water-700 leading-relaxed">{data.weather}</p>
          </div>

          {/* Monthly Tip */}
          <div className="zen-card p-6 bg-zen-kitsune-50/30 border-zen-kitsune-200">
            <div className="flex items-center mb-3">
              <Lightbulb className="w-5 h-5 text-zen-kitsune-600 mr-2" />
              <h3 className="font-display text-zen-kitsune-800">Tip of the Month</h3>
            </div>
            <p className="text-zen-kitsune-700 leading-relaxed">{data.tip}</p>
          </div>
        </div>

        {/* Footer Note */}
        <footer className="mt-16 pt-8 border-t border-zen-stone-200 text-center">
          <p className="text-sm text-zen-stone-400">
            All dates are approximate and based on central Scotland conditions.
            Adjust for your local area – highlands may be 2-3 weeks behind,
            coastal areas often milder.
          </p>
        </footer>
      </div>
    </div>
  )
}
