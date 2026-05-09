'use client'

import { Sparkles, X } from 'lucide-react'

interface AitorOptInBannerProps {
  onEnable: () => void
  onDismiss: () => void
}

export default function AitorOptInBanner({ onEnable, onDismiss }: AitorOptInBannerProps) {
  return (
    <div className="zen-card p-4 bg-zen-moss-50 border border-zen-moss-100 flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-zen-moss-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-ink-700">
          Try Aitor, your AI gardening companion?
        </p>
        <p className="text-xs text-zen-stone-500 mt-1">
          Ask seasonal questions, plan rotations, or upload a photo for plant diagnosis. You can turn this off any time.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onEnable}
            className="px-3 py-2 min-h-[44px] text-xs bg-zen-moss-600 hover:bg-zen-moss-700 text-white rounded-zen transition-colors"
          >
            Try Aitor
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-2 min-h-[44px] text-xs text-zen-stone-600 hover:text-zen-stone-800 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-zen-stone-400 hover:text-zen-stone-600 transition-colors"
        aria-label="Dismiss Aitor opt-in prompt"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
