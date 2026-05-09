'use client'

import { Calendar, Camera, RotateCcw, Sprout, type LucideIcon } from 'lucide-react'

interface QuickTopicsProps {
  onSelectTopic: (query: string) => void
}

interface QuickPrompt {
  icon: LucideIcon
  title: string
  query: string
  borderColor: string
}

const PROMPTS: QuickPrompt[] = [
  {
    icon: Calendar,
    title: 'What can I plant in May?',
    query: 'What can I plant in May?',
    borderColor: 'border-l-emerald-400',
  },
  {
    icon: Camera,
    title: 'Diagnose this leaf',
    query: 'Diagnose this leaf',
    borderColor: 'border-l-violet-400',
  },
  {
    icon: RotateCcw,
    title: 'Plan my next rotation',
    query: 'Plan my next rotation',
    borderColor: 'border-l-amber-400',
  },
  {
    icon: Sprout,
    title: 'Why is my chard bolting?',
    query: 'Why is my chard bolting?',
    borderColor: 'border-l-orange-400',
  },
]

function TopicButton({ prompt, onSelect }: { prompt: QuickPrompt; onSelect: () => void }) {
  const Icon = prompt.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`bg-white p-3 sm:p-4 rounded-lg shadow-md border border-l-4 ${prompt.borderColor} hover:shadow-lg transition text-left group min-h-[88px]`}
    >
      <div className="flex items-center mb-2">
        <Icon className="w-5 h-5 text-zen-moss-600 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" aria-hidden="true" />
        <span className="font-medium text-sm sm:text-base text-zen-ink-800">{prompt.title}</span>
      </div>
    </button>
  )
}

export default function QuickTopics({ onSelectTopic }: QuickTopicsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-zen-ink-800">Popular Topics</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROMPTS.map((prompt) => (
          <TopicButton
            key={prompt.title}
            prompt={prompt}
            onSelect={() => onSelectTopic(prompt.query)}
          />
        ))}
      </div>
    </div>
  )
}
