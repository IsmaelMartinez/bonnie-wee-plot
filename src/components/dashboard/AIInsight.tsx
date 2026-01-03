'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { generateAISuggestions, type GenerateSuggestionsInput } from '@/lib/ai-suggestions'

interface AIInsightProps {
  input: GenerateSuggestionsInput
}

export default function AIInsight({ input }: AIInsightProps) {
  const suggestions = generateAISuggestions(input, 1)
  const topSuggestion = suggestions[0]

  if (!topSuggestion) return null

  const Icon = topSuggestion.icon

  return (
    <div className="zen-card p-5 border-zen-water-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-zen-water-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-zen-water-500" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-zen-stone-500 uppercase tracking-wide mb-1.5">
            Aitor suggests
          </p>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-zen-ink-600 flex-shrink-0" />
            <p className="font-medium text-zen-ink-800">{topSuggestion.title}</p>
          </div>
          <p className="text-sm text-zen-ink-600 leading-relaxed line-clamp-2">
            {topSuggestion.query}
          </p>
        </div>

        <Link
          href={`/ai-advisor?q=${encodeURIComponent(topSuggestion.query)}`}
          className="flex-shrink-0 zen-btn-secondary !p-2"
          title="Ask Aitor"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
