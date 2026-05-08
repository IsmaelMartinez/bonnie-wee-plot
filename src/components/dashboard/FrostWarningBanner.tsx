'use client'

import { useEffect, useState } from 'react'
import { Snowflake, X } from 'lucide-react'

const DISMISSED_KEY_PREFIX = 'bwp-frost-banner-dismissed-'

export interface FrostAffectedArea {
  areaId: string
  areaName: string
  plantNames: string[]
}

interface FrostWarningBannerProps {
  forecastMinC: number
  affectedAreas: FrostAffectedArea[]
  /** YYYY-MM-DD for today; passed in for test determinism. */
  todayIso: string
}

export default function FrostWarningBanner({
  forecastMinC,
  affectedAreas,
  todayIso,
}: FrostWarningBannerProps) {
  const dismissedKey = `${DISMISSED_KEY_PREFIX}${todayIso}`
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissedKey) === 'true') {
        setDismissed(true)
      }
    } catch {
      // ignore
    }
  }, [dismissedKey])

  if (forecastMinC > 0) return null
  if (affectedAreas.length === 0) return null
  if (dismissed) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissedKey, 'true')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  return (
    <div
      className="zen-card p-4 bg-zen-tanuki-50 border border-zen-tanuki-200 flex items-start gap-3"
      role="alert"
    >
      <Snowflake className="w-5 h-5 text-zen-tanuki-700 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zen-ink-900">
          Frost tonight — protect your tender crops
        </p>
        <p className="text-xs text-zen-stone-600 mt-1">
          Forecast minimum: {Math.round(forecastMinC)}°C. Cover or move tender plants tonight.
        </p>
        <ul className="mt-2 text-xs text-zen-ink-700 space-y-0.5">
          {affectedAreas.map((area) => (
            <li key={area.areaId}>
              <span className="font-medium">{area.areaName}:</span>{' '}
              {area.plantNames.join(', ')}
            </li>
          ))}
        </ul>
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
