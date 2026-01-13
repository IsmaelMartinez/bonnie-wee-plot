'use client'

import { useTodayData } from '@/hooks/useTodayData'
import { generateAISuggestions, hasPersonalizedData, type AISuggestion } from '@/lib/ai-suggestions'

interface QuickTopicsProps {
  onSelectTopic: (query: string) => void
}

function TopicButton({ suggestion, onSelect }: { suggestion: AISuggestion; onSelect: () => void }) {
  const Icon = suggestion.icon

  // Category-based styling
  const categoryStyles: Record<AISuggestion['category'], string> = {
    seasonal: 'border-l-amber-400',
    harvest: 'border-l-orange-400',
    planting: 'border-l-emerald-400',
    maintenance: 'border-l-violet-400',
    general: 'border-l-gray-300',
  }

  return (
    <button
      onClick={onSelect}
      className={`bg-white p-3 sm:p-4 rounded-lg shadow-md border border-l-4 ${categoryStyles[suggestion.category]} hover:shadow-lg transition text-left group min-h-[88px]`}
    >
      <div className="flex items-center mb-2">
        <Icon className="w-5 h-5 text-primary-600 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base text-gray-800">{suggestion.title}</span>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{suggestion.query}</p>
    </button>
  )
}

export default function QuickTopics({ onSelectTopic }: QuickTopicsProps) {
  const todayData = useTodayData()

  const suggestions = generateAISuggestions({
    seasonalPhase: todayData.seasonalPhase,
    currentMonth: todayData.currentMonth,
    harvestReady: todayData.harvestReady,
    needsAttention: todayData.needsAttention,
    maintenanceTasks: todayData.maintenanceTasks,
  })

  const isPersonalized = hasPersonalizedData({
    seasonalPhase: todayData.seasonalPhase,
    currentMonth: todayData.currentMonth,
    harvestReady: todayData.harvestReady,
    needsAttention: todayData.needsAttention,
    maintenanceTasks: todayData.maintenanceTasks,
  })

  if (todayData.isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🌿 Suggested Topics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {isPersonalized ? '🎯 Suggested for You' : '🌿 Popular Topics'}
        </h2>
        {isPersonalized && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Based on your allotment
          </span>
        )}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <TopicButton
            key={`${suggestion.category}-${index}`}
            suggestion={suggestion}
            onSelect={() => onSelectTopic(suggestion.query)}
          />
        ))}
      </div>
    </div>
  )
}
