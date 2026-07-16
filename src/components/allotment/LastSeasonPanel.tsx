'use client'

/**
 * Last-season panel (Season Observer Phase 3) — shown on /allotment when the
 * user is planning a year that has a previous season on record. Surfaces the
 * concrete, rule-derived suggestions from `useLastSeasonAdjustments` (the
 * shared cache-first weather → findings → adjustments hook, also feeding the
 * Add Planting flow's per-crop nudges) where planting decisions are made.
 *
 * Everything is computed on demand; nothing here is persisted to the Yjs
 * doc. Dismissal is per plan-year in localStorage. Renders nothing at all
 * when the previous season yields no actionable adjustments — silence over
 * noise.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpenCheck, X } from 'lucide-react'
import type { Area, SeasonRecord } from '@/types/unified-allotment'
import type { PlotCoordinates } from '@/lib/weather/open-meteo-archive'
import type { FindingSeverity } from '@/lib/season-review/findings'
import type { PlanAdjustmentContext } from '@/lib/season-review/plan-adjustments'
import { useLastSeasonAdjustments } from '@/hooks/useLastSeasonAdjustments'

const DISMISS_KEY_PREFIX = 'bwp-plan-feedback-dismissed:'

function isDismissed(planYear: number): boolean {
  try {
    return localStorage.getItem(`${DISMISS_KEY_PREFIX}${planYear}`) === '1'
  } catch {
    return false
  }
}

function persistDismissed(planYear: number): void {
  try {
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${planYear}`, '1')
  } catch {
    // Quota/privacy-mode failure just means the panel returns next visit.
  }
}

const SEVERITY_DOT: Record<FindingSeverity, string> = {
  warning: 'bg-zen-kitsune-500',
  notice: 'bg-zen-ink-500',
  info: 'bg-zen-stone-400',
}

interface LastSeasonPanelProps {
  /**
   * The year being planned (the selected year on /allotment). Mount the
   * panel with `key={planYear}` so a year switch remounts it — dismissal
   * and weather state initialize per instance rather than tracking changes.
   */
  planYear: number
  /** All areas, for resolving bed names in findings. */
  areas: Area[]
  /** The previous year's season record, or null when there isn't one. */
  seasonRecord: SeasonRecord | null
  /** Coordinates from meta — re-validated here before any fetch. */
  coordinates?: PlotCoordinates | null
  /** Average frost dates from meta, when known. */
  frostDates?: PlanAdjustmentContext['frostDates']
}

export default function LastSeasonPanel({
  planYear,
  areas,
  seasonRecord,
  coordinates,
  frostDates,
}: LastSeasonPanelProps) {
  const reviewYear = planYear - 1
  const [dismissed, setDismissed] = useState(() => isDismissed(planYear))
  const { settled, adjustments } = useLastSeasonAdjustments({
    planYear,
    areas,
    seasonRecord,
    coordinates,
    frostDates,
  })

  if (!seasonRecord || dismissed || !settled || adjustments.length === 0) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      <section className="zen-card p-4 border-zen-moss-200" aria-label={`Learning from ${reviewYear}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-zen-moss-600" />
            <h2 className="font-medium text-zen-ink-800">Learning from {reviewYear}</h2>
          </div>
          <button
            onClick={() => {
              setDismissed(true)
              persistDismissed(planYear)
            }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-zen text-zen-stone-400 hover:text-zen-ink-700 hover:bg-zen-stone-100 transition"
            aria-label={`Dismiss last season's suggestions for ${planYear}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="space-y-3">
          {adjustments.map((adj) => (
            <li key={adj.id} className="flex items-start gap-2.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${SEVERITY_DOT[adj.severity]}`}
                aria-hidden="true"
              />
              <div className="text-sm">
                <p className="text-zen-stone-600">{adj.observed}</p>
                <p className="text-zen-ink-800 font-medium mt-0.5">{adj.action}</p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/season-review"
          className="mt-3 inline-flex items-center gap-1 text-sm text-zen-moss-700 hover:text-zen-moss-800"
        >
          Full season review
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
