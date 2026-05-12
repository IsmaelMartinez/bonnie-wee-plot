'use client'

import { useId, useState } from 'react'
import { Sparkles, Plus, Sprout, ChevronRight, ChevronDown } from 'lucide-react'
import type { Planting, StoredVariety } from '@/types/unified-allotment'
import { getBoostSuggestions } from '@/lib/boost-suggestions'

interface BoostThisBedProps {
  plantings: Planting[]
  varieties: StoredVariety[]
  selectedYear: number
  onAddSuggestion: (plantId: string) => void
}

export default function BoostThisBed({
  plantings,
  varieties,
  selectedYear,
  onAddSuggestion,
}: BoostThisBedProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const listId = useId()
  const suggestions = getBoostSuggestions(plantings, varieties, selectedYear)
  if (suggestions.length === 0) return null

  return (
    <div className="bg-zen-moss-50 border border-zen-moss-100 rounded-zen p-3 mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={listId}
        className="w-full flex items-center justify-between gap-2 min-h-[44px] text-xs font-medium text-zen-moss-700 hover:text-zen-moss-800 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Boost this bed
          <span className="text-zen-stone-500 font-normal">({suggestions.length})</span>
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zen-moss-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zen-moss-600" />
        )}
      </button>
      {isExpanded && (
        <ul id={listId} className="space-y-1.5 mt-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.plantId} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddSuggestion(suggestion.plantId)}
                className="flex-1 flex items-center justify-between gap-2 text-left px-2 py-2 min-h-[44px] rounded-zen bg-white hover:bg-zen-moss-100 border border-zen-moss-100 transition"
                title={`Pairs with ${suggestion.pairsWith.join(', ')}`}
              >
                <span className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-sm text-zen-ink-800">
                    <span className="font-medium">{suggestion.plantName}</span>
                    {suggestion.hasSeed && (
                      <span
                        className="inline-flex items-center gap-0.5 text-xs text-zen-moss-700"
                        title="You have seed for this"
                      >
                        <Sprout className="w-3 h-3" />
                        seed
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zen-stone-500">{suggestion.reason}</span>
                </span>
                <Plus className="w-4 h-4 text-zen-moss-600 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
