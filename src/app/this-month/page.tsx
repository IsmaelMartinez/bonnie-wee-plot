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
  MapPin
} from 'lucide-react'
import GuideCTA from '@/components/GuideCTA'
import UnifiedCalendar from '@/components/garden-planner/UnifiedCalendar'
import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableById, getMaintenanceForMonth, type MaintenanceTask } from '@/lib/vegetable-database'
import { Area, AreaSeason } from '@/types/unified-allotment'
import {
  scotlandMonthlyCalendar,
  MONTH_KEYS,
  getCurrentMonthKey,
  type MonthKey
} from '@/data/scotland-calendar'
import { BED_COLORS } from '@/data/allotment-layout'
import { Scissors, Droplet, TreeDeciduous, Layers } from 'lucide-react'

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

// Personalized planting card
function PersonalizedPlanting({
  bedId,
  vegetableName,
  varietyName
}: {
  bedId: string
  vegetableName: string
  varietyName?: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/80 rounded-zen border border-zen-moss-200">
      <div className="flex-1">
        <div className="font-medium text-zen-ink-800">{vegetableName}</div>
        {varietyName && <div className="text-xs text-zen-stone-500">{varietyName}</div>}
        <div className="text-xs text-zen-moss-600 mt-1">Bed {bedId}</div>
      </div>
    </div>
  )
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

  // Load allotment data for personalization
  const { data: allotmentData, currentSeason, selectedYear, isLoading, getAreasByKind } = useAllotment()

  // Auto-select current month on page load
  useEffect(() => {
    setSelectedMonth(getCurrentMonthKey())
  }, [])

  const data = scotlandMonthlyCalendar[selectedMonth]
  const isCurrentMonth = selectedMonth === getCurrentMonthKey()

  // Get maintenance tasks for trees, shrubs, and perennials this month
  const maintenanceTasks = useMemo(() => {
    const monthIndex = MONTH_KEYS.indexOf(selectedMonth) + 1
    return getMaintenanceForMonth(monthIndex)
  }, [selectedMonth])

  // Get personalized maintenance for user's permanent plantings (trees, berries, perennials)
  const personalizedMaintenance = useMemo(() => {
    const treeAreas = getAreasByKind('tree')
    const berryAreas = getAreasByKind('berry')
    const herbAreas = getAreasByKind('herb')
    const permanentAreas: Area[] = [...treeAreas, ...berryAreas, ...herbAreas]
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
  
  // Get personalized tasks based on user's plantings
  const personalizedData = useMemo(() => {
    if (!currentSeason || !allotmentData) return null

    const allPlantings: Array<{
      areaId: string
      plantId: string
      vegetableName: string
      varietyName?: string
      harvestMonths: number[]
      sowMonths: number[]
      category: string
    }> = []

    for (const areaSeason of currentSeason.areas) {
      for (const planting of areaSeason.plantings) {
        const veg = getVegetableById(planting.plantId)
        if (veg) {
          allPlantings.push({
            areaId: areaSeason.areaId,
            plantId: planting.plantId,
            vegetableName: veg.name,
            varietyName: planting.varietyName,
            harvestMonths: veg.planting?.harvestMonths || [],
            sowMonths: [...(veg.planting?.sowIndoorsMonths || []), ...(veg.planting?.sowOutdoorsMonths || [])],
            category: veg.category
          })
        }
      }
    }

    // Get month index (1-12) for comparison
    const monthIndex = MONTH_KEYS.indexOf(selectedMonth) + 1

    // Get plantings that might be ready to harvest this month
    const readyToHarvest = allPlantings.filter(p => {
      // Check if current month is within harvest months
      return p.harvestMonths.includes(monthIndex) ||
             p.harvestMonths.includes(monthIndex + 1) ||
             p.harvestMonths.includes(monthIndex - 1)
    })

    // Get plantings that need attention (sowing season)
    const needsAttention = allPlantings.filter(p => {
      return p.sowMonths.includes(monthIndex) ||
             p.sowMonths.includes(monthIndex + 1) ||
             p.sowMonths.includes(monthIndex - 1)
    })

    return {
      plantingCount: allPlantings.length,
      areaCount: currentSeason.areas.filter((a: AreaSeason) => a.plantings.length > 0).length,
      readyToHarvest: readyToHarvest.slice(0, 4),
      needsAttention: needsAttention.slice(0, 4),
      allPlantings: allPlantings.slice(0, 6)
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
          varietyName: planting.varietyName
        })
      }
    }

    return entries
  }, [currentSeason, allotmentData])
  
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-baseline gap-3 mb-2">
            <Calendar className="w-6 h-6 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">This Month</h1>
          </div>
          <p className="text-zen-stone-500 text-lg">
            Seasonal tasks for Scottish gardens
          </p>
        </header>

        {/* Month Selector */}
        <div className="mb-8">
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
        <div className="zen-card p-6 mb-8">
          <div className="flex items-start">
            <span className="text-4xl mr-4">{data.emoji}</span>
            <div>
              <h2 className="text-xl font-display text-zen-ink-800 mb-2">{data.month}</h2>
              <p className="text-zen-stone-600 leading-relaxed">{data.overview}</p>
            </div>
          </div>
        </div>

        {/* Personalized Section - Your Garden This Month */}
        {!isLoading && personalizedData && personalizedData.plantingCount > 0 && (
          <div className="zen-card p-6 mb-8 border-zen-moss-200 bg-zen-moss-50/30">
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

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/60 rounded-zen p-3 text-center">
                <div className="text-2xl font-bold text-zen-moss-600">{personalizedData.plantingCount}</div>
                <div className="text-xs text-zen-stone-600">Plantings in {selectedYear}</div>
              </div>
              <div className="bg-white/60 rounded-zen p-3 text-center">
                <div className="text-2xl font-bold text-zen-moss-600">{personalizedData.areaCount}</div>
                <div className="text-xs text-zen-stone-600">Active Areas</div>
              </div>
              <div className="bg-white/60 rounded-zen p-3 text-center">
                <div className="text-2xl font-bold text-zen-moss-600">{personalizedData.readyToHarvest.length}</div>
                <div className="text-xs text-zen-stone-600">May Be Ready</div>
              </div>
            </div>

            {/* Your Plantings */}
            {personalizedData.allPlantings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Your Current Plantings</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {personalizedData.allPlantings.map((p, i) => (
                    <PersonalizedPlanting
                      key={i}
                      bedId={p.areaId}
                      vegetableName={p.vegetableName}
                      varietyName={p.varietyName}
                    />
                  ))}
                </div>
              </div>
            )}

            {personalizedData.readyToHarvest.length > 0 && (
              <div className="mt-4 p-3 bg-zen-kitsune-50 rounded-zen border border-zen-kitsune-200">
                <div className="flex items-center text-zen-kitsune-700 font-medium mb-1">
                  <Carrot className="w-4 h-4 mr-2" />
                  Might be ready to harvest soon
                </div>
                <p className="text-sm text-zen-kitsune-600">
                  {personalizedData.readyToHarvest.map(p => p.vegetableName).join(', ')}
                </p>
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
        {!isLoading && (!personalizedData || personalizedData.plantingCount === 0) && (
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Sowing Section */}
          <div className="zen-card p-6">
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
          <div className="zen-card p-6">
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
        
        {/* Personalized Trees & Perennials Maintenance */}
        {!isLoading && personalizedMaintenance.plantings.length > 0 && (
          <div className="zen-card p-6 mb-8 border-zen-sakura-200 bg-zen-sakura-50/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TreeDeciduous className="w-5 h-5 text-zen-sakura-600 mr-2" />
                <h3 className="font-display text-zen-ink-800">Your Trees & Perennials</h3>
              </div>
              <Link
                href="/allotment"
                className="text-sm text-zen-sakura-600 hover:text-zen-sakura-700"
              >
                View in Allotment →
              </Link>
            </div>

            {/* List user's permanent plantings */}
            <div className="flex flex-wrap gap-2 mb-4">
              {personalizedMaintenance.plantings.map((area: Area) => (
                <span
                  key={area.id}
                  className="inline-flex items-center px-2 py-1 rounded-zen bg-white/70 border border-zen-sakura-200 text-sm text-zen-ink-700"
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
                <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Tasks for {data.month}</h4>
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

        {/* Generic Trees & Shrubs Maintenance Section */}
        {maintenanceTasks.length > 0 && (
          <div className="zen-card p-6 mb-8">
            <div className="flex items-center mb-4">
              <TreeDeciduous className="w-5 h-5 text-zen-moss-700 mr-2" />
              <h3 className="font-display text-zen-ink-800">All Trees & Perennials Care</h3>
            </div>
            <p className="text-zen-stone-600 text-sm mb-4">
              General maintenance tasks for fruit trees, berry bushes, and perennials this month.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {maintenanceTasks.map((task, index) => (
                <MaintenanceCard key={`${task.vegetable.id}-${task.type}-${index}`} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Soil Care - Featured Section */}
        <div className="zen-card p-6 mb-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-zen-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
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

        {/* Specialization Tips */}
        <div className="mb-8">
          <h3 className="text-lg font-display text-zen-ink-800 mb-4 text-center">
            Expert Tips for {data.month}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* CTA to AI Advisor */}
        <GuideCTA
          icon={Calendar}
          title="Need Personalized Advice?"
          description="Aitor can give you tailored recommendations based on your specific plot, the vegetables you're growing, and your local conditions."
          bulletPoints={[
            '• What to prioritize on your plot this month',
            '• Troubleshooting specific problems',
            '• Planning your sowing and harvesting schedule',
            '• Adapting tasks for your microclimate'
          ]}
          buttonText="Ask Aitor for Help"
          gradientFrom="from-green-600"
          gradientTo="to-blue-600"
        />

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

