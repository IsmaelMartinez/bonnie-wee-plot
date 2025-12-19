'use client'

import { useState, useEffect } from 'react'
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
  Home
} from 'lucide-react'
import GuideCTA from '@/components/GuideCTA'
import { 
  scotlandMonthlyCalendar, 
  MONTH_KEYS, 
  getCurrentMonthKey,
  type MonthKey 
} from '@/data/scotland-calendar'

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

export default function ThisMonthPage() {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('january')
  
  // Auto-select current month on page load
  useEffect(() => {
    setSelectedMonth(getCurrentMonthKey())
  }, [])
  
  const data = scotlandMonthlyCalendar[selectedMonth]
  const isCurrentMonth = selectedMonth === getCurrentMonthKey()
  
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
            Seasonal gardening tasks and tips tailored for Scotland's climate. 
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
              You're viewing the current month
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

