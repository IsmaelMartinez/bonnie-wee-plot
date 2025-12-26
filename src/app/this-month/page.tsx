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
import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableById, getMaintenanceForMonth, type MaintenanceTask } from '@/lib/vegetable-database'
import { 
  scotlandMonthlyCalendar, 
  MONTH_KEYS, 
  getCurrentMonthKey,
  type MonthKey 
} from '@/data/scotland-calendar'
import { Scissors, Droplet, TreeDeciduous } from 'lucide-react'

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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
        isSelected 
          ? 'bg-green-600 text-white shadow-md' 
          : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
      }`}
    >
      {data.emoji} {data.month.slice(0, 3)}
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
    return <p className="text-gray-500 text-sm italic">{emptyMessage}</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span className="text-green-500 mr-2 mt-1">•</span>
          <span className="text-gray-700 text-sm">{item}</span>
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
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  }
  const iconColors: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600'
  }
  
  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center mb-2">
        <Icon className={`w-5 h-5 mr-2 ${iconColors[color]}`} />
        <h4 className="font-semibold">{title}</h4>
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
    <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-green-200">
      <div className="flex-1">
        <div className="font-medium text-gray-800">{vegetableName}</div>
        {varietyName && <div className="text-xs text-gray-500">{varietyName}</div>}
        <div className="text-xs text-green-600 mt-1">Bed {bedId}</div>
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
    prune: 'text-purple-600 bg-purple-50 border-purple-200',
    feed: 'text-blue-600 bg-blue-50 border-blue-200',
    mulch: 'text-amber-600 bg-amber-50 border-amber-200'
  }
  
  const Icon = typeIcons[task.type]
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${typeColors[task.type]}`}>
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
  const { data: allotmentData, currentSeason, selectedYear, isLoading } = useAllotment()
  
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
  
  // Get personalized tasks based on user's plantings
  const personalizedData = useMemo(() => {
    if (!currentSeason || !allotmentData) return null
    
    const allPlantings: Array<{
      bedId: string
      vegetableId: string
      vegetableName: string
      varietyName?: string
      harvestMonths: number[]
      sowMonths: number[]
      category: string
    }> = []
    
    for (const bed of currentSeason.beds) {
      for (const planting of bed.plantings) {
        const veg = getVegetableById(planting.vegetableId)
        if (veg) {
          allPlantings.push({
            bedId: bed.bedId,
            vegetableId: planting.vegetableId,
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
      bedCount: currentSeason.beds.filter(b => b.plantings.length > 0).length,
      readyToHarvest: readyToHarvest.slice(0, 4),
      needsAttention: needsAttention.slice(0, 4),
      allPlantings: allPlantings.slice(0, 6)
    }
  }, [currentSeason, allotmentData, selectedMonth])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-green-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              This Month in the Scottish Allotment
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Seasonal gardening tasks and tips tailored for Scotland&apos;s climate. 
            Select a month to plan ahead or see what needs doing now.
          </p>
        </div>

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
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              You&apos;re viewing the current month
            </div>
          </div>
        )}

        {/* Month Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start">
            <span className="text-4xl mr-4">{data.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{data.month}</h2>
              <p className="text-gray-600 leading-relaxed">{data.overview}</p>
            </div>
          </div>
        </div>

        {/* Personalized Section - Your Garden This Month */}
        {!isLoading && personalizedData && personalizedData.plantingCount > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-emerald-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Your Garden in {data.month}</h3>
              </div>
              <Link 
                href="/allotment" 
                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                View All →
              </Link>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/60 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{personalizedData.plantingCount}</div>
                <div className="text-xs text-gray-600">Plantings in {selectedYear}</div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{personalizedData.bedCount}</div>
                <div className="text-xs text-gray-600">Active Beds</div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{personalizedData.readyToHarvest.length}</div>
                <div className="text-xs text-gray-600">May Be Ready</div>
              </div>
            </div>
            
            {/* Your Plantings */}
            {personalizedData.allPlantings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Current Plantings</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {personalizedData.allPlantings.map((p, i) => (
                    <PersonalizedPlanting
                      key={i}
                      bedId={p.bedId}
                      vegetableName={p.vegetableName}
                      varietyName={p.varietyName}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {personalizedData.readyToHarvest.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center text-orange-700 font-medium mb-1">
                  <Carrot className="w-4 h-4 mr-2" />
                  Might be ready to harvest soon
                </div>
                <p className="text-sm text-orange-600">
                  {personalizedData.readyToHarvest.map(p => p.vegetableName).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* No plantings prompt */}
        {!isLoading && (!personalizedData || personalizedData.plantingCount === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
            <Sprout className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Track Your Garden</h3>
            <p className="text-blue-600 mb-4">
              Add your plantings to get personalized recommendations for {data.month}
            </p>
            <Link 
              href="/allotment" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Manage My Allotment
            </Link>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sowing Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Sprout className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">What to Sow</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Home className="w-4 h-4 mr-1" /> Indoors
                </h4>
                <TaskList 
                  items={data.sowIndoors} 
                  emptyMessage="No indoor sowing this month" 
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Cloud className="w-4 h-4 mr-1" /> Outdoors
                </h4>
                <TaskList 
                  items={data.sowOutdoors} 
                  emptyMessage="No outdoor sowing this month" 
                />
              </div>
            </div>
          </div>

          {/* Plant Out Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shovel className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">Plant Out</h3>
            </div>
            <TaskList 
              items={data.plantOut} 
              emptyMessage="Nothing to plant out this month" 
            />
          </div>

          {/* Harvest Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Carrot className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">Ready to Harvest</h3>
            </div>
            <TaskList 
              items={data.harvest} 
              emptyMessage="The hungry gap – not much to harvest" 
            />
          </div>

          {/* Key Tasks Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">Key Tasks</h3>
            </div>
            <TaskList items={data.tasks} />
          </div>
        </div>
        
        {/* Trees & Shrubs Maintenance Section */}
        {maintenanceTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <TreeDeciduous className="w-6 h-6 text-green-700 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">Trees & Perennials Care</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Maintenance tasks for your fruit trees, berry bushes, and perennials this month.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {maintenanceTasks.map((task, index) => (
                <MaintenanceCard key={`${task.vegetable.id}-${task.type}-${index}`} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Specialization Tips */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Cloud className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Weather to Expect</h3>
            </div>
            <p className="text-blue-700 leading-relaxed">{data.weather}</p>
          </div>

          {/* Monthly Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Lightbulb className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className="text-lg font-semibold text-amber-800">Tip of the Month</h3>
            </div>
            <p className="text-amber-700 leading-relaxed">{data.tip}</p>
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
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            All dates are approximate and based on central Scotland conditions. 
            Adjust for your local area – highlands may be 2-3 weeks behind, 
            coastal areas often milder.
          </p>
        </div>
      </div>
    </div>
  )
}

