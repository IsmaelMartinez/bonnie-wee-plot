'use client'

import { useState } from 'react'
import { Sprout, Leaf } from 'lucide-react'
import { Planting } from '@/types/unified-allotment'

interface PlantingProgressProps {
  planting: Planting
}

const DAY_MS = 24 * 60 * 60 * 1000

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Visual strip for a planting's life: sow → (transplant) → expected harvest
 * window, with the actual harvest period overlaid and a "today" line.
 *
 * Hidden when the planting lacks the minimum data to draw something useful
 * (sowDate plus expectedHarvestStart). The Dates tab still shows the raw
 * fields when this strip is missing.
 */
export default function PlantingProgress({ planting }: PlantingProgressProps) {
  // Captured once on mount so renders are pure (per the react-hooks/purity
  // rule) — if the dialog is kept open across midnight the line is at most
  // one day off.
  const [today] = useState(() => Date.now())

  const {
    sowDate,
    transplantDate,
    expectedHarvestStart,
    expectedHarvestEnd,
    actualHarvestStart,
    actualHarvestEnd,
  } = planting

  if (!sowDate || !expectedHarvestStart) return null

  const start = new Date(sowDate).getTime()
  const harvestStart = new Date(expectedHarvestStart).getTime()
  const harvestEnd = expectedHarvestEnd ? new Date(expectedHarvestEnd).getTime() : harvestStart
  const actualEndTs = actualHarvestEnd ? new Date(actualHarvestEnd).getTime() : 0
  // Add a small tail past the harvest window so the "today" line has somewhere
  // to sit when we're at or just past the end of the expected window.
  const end = Math.max(harvestEnd, actualEndTs, harvestStart + 7 * DAY_MS)

  const totalSpan = end - start
  if (totalSpan <= 0) return null

  const pct = (ts: number) => Math.max(0, Math.min(100, ((ts - start) / totalSpan) * 100))

  const todayPct = pct(today)
  const isTodayWithinRange = today >= start && today <= end
  const harvestStartPct = pct(harvestStart)
  const harvestEndPct = pct(harvestEnd)
  const transplantPct = transplantDate ? pct(new Date(transplantDate).getTime()) : null
  const actualStartPct = actualHarvestStart ? pct(new Date(actualHarvestStart).getTime()) : null
  const actualEndPct = actualHarvestEnd ? pct(new Date(actualHarvestEnd).getTime()) : null

  return (
    <div className="my-3" role="region" aria-label="Planting progress">
      <div className="relative h-2 rounded-full bg-zen-stone-100">
        {/* Expected harvest window */}
        <div
          className="absolute top-0 h-full bg-zen-moss-200 rounded-full"
          style={{
            left: `${harvestStartPct}%`,
            width: `${Math.max(2, harvestEndPct - harvestStartPct)}%`,
          }}
          aria-label={`Expected harvest ${fmt(harvestStart)}${
            harvestEnd > harvestStart ? ` to ${fmt(harvestEnd)}` : ''
          }`}
        />

        {/* Actual harvest period overlaid darker */}
        {actualStartPct !== null && (
          <div
            className="absolute top-0 h-full bg-zen-moss-500 rounded-full"
            style={{
              left: `${actualStartPct}%`,
              width: `${Math.max(2, (actualEndPct ?? todayPct) - actualStartPct)}%`,
            }}
            aria-label="Actual harvest"
          />
        )}

        {/* Transplant marker */}
        {transplantPct !== null && transplantDate && (
          <div
            className="absolute top-[-2px] w-1.5 h-3 -ml-[3px] rounded-sm bg-zen-water-400"
            style={{ left: `${transplantPct}%` }}
            title={`Transplanted ${fmt(new Date(transplantDate).getTime())}`}
          />
        )}

        {/* Today line */}
        {isTodayWithinRange && (
          <div
            className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-zen-water-600"
            style={{ left: `${todayPct}%` }}
            title={`Today, ${fmt(today)}`}
            aria-label="Today"
          />
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-zen-stone-500">
        <span className="flex items-center gap-1">
          <Sprout className="w-3 h-3" />
          {fmt(start)}
        </span>
        <span className="flex items-center gap-1">
          <Leaf className="w-3 h-3 text-zen-moss-600" />
          {fmt(harvestStart)}
          {harvestEnd > harvestStart && <> – {fmt(harvestEnd)}</>}
        </span>
      </div>
    </div>
  )
}
