'use client'

import { useState, useEffect } from 'react'
import { CloudRain, X } from 'lucide-react'

interface LocationPromptBannerProps {
  onRequestLocation: () => void
}

const DISMISSED_KEY = 'bwp-location-prompt-dismissed'

export default function LocationPromptBanner({ onRequestLocation }: LocationPromptBannerProps) {
  // Mount-only check to keep server and first client render identical.
  // Banner shows briefly until the localStorage flag is read in useEffect.
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') {
        setDismissed(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  if (dismissed) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // ignore storage errors
    }
    setDismissed(true)
  }

  return (
    <div className="zen-card p-4 bg-zen-water-50 border border-zen-water-100 flex items-start gap-3">
      <CloudRain className="w-5 h-5 text-zen-water-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-ink-700">
          Use rainfall to skip unnecessary watering reminders
        </p>
        <p className="text-xs text-zen-stone-500 mt-1">
          We&apos;ll fetch local rainfall from Open-Meteo. Your location stays on your device.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onRequestLocation}
            className="px-3 py-2 min-h-[36px] text-xs bg-zen-water-600 hover:bg-zen-water-700 text-white rounded-zen transition-colors"
          >
            Enable rainfall hints
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 min-h-[36px] text-xs text-zen-stone-600 hover:text-zen-stone-800 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-zen-stone-400 hover:text-zen-stone-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
