'use client'

import Link from 'next/link'
import { Calendar, Package, ArrowRight } from 'lucide-react'
import { SEASONAL_PHASES } from '@/lib/seasons'
import { myVarieties } from '@/data/my-varieties'

interface SeasonStatusWidgetProps {
  bedsNeedingRotation: number
  totalRotationBeds: number
  currentYear: number
}

export default function SeasonStatusWidget({
  bedsNeedingRotation,
  totalRotationBeds,
  currentYear
}: SeasonStatusWidgetProps) {
  const month = new Date().getMonth()
  const phase = SEASONAL_PHASES[month]
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' })

  // Calculate seeds needed (varieties used in past years that user might need to reorder)
  const varietiesUsedLastYear = myVarieties.filter(v => v.yearsUsed.includes(currentYear - 1))

  return (
    <div className="zen-card p-4 border-zen-moss-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{phase.emoji}</span>
          <div>
            <div className="flex items-center gap-2 text-zen-ink-700">
              <Calendar className="w-4 h-4 text-zen-stone-400" />
              <span className="font-medium">{monthName}</span>
              <span className="text-zen-stone-300">·</span>
              <span className="text-zen-moss-600">{phase.name}</span>
            </div>
            <p className="text-sm text-zen-stone-500 mt-0.5">{phase.action}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/seeds"
            className="flex items-center gap-2 px-3 py-1.5 rounded-zen text-zen-ink-600 hover:bg-zen-stone-100 transition"
          >
            <Package className="w-4 h-4 text-zen-stone-400" />
            <span>{varietiesUsedLastYear.length} varieties</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 text-zen-ink-600">
            <ArrowRight className="w-4 h-4 text-zen-stone-400" />
            <span>{bedsNeedingRotation}/{totalRotationBeds} to rotate</span>
          </div>
        </div>
      </div>
    </div>
  )
}
