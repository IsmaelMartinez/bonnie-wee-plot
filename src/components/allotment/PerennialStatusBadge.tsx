'use client'

import { useMemo } from 'react'
import { Area } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import {
  getPerennialStatusFromPlant,
  getStatusLabel,
  getStatusColorClasses,
  PerennialStatusResult,
} from '@/lib/perennial-calculator'

interface PerennialStatusBadgeProps {
  area: Area
  currentYear: number
  /** Show only the badge, not additional info */
  compact?: boolean
}

/**
 * Displays lifecycle status badge for perennial areas (trees, berries, perennial beds)
 */
export default function PerennialStatusBadge({
  area,
  currentYear,
  compact = true,
}: PerennialStatusBadgeProps) {
  // Calculate perennial status if applicable
  const statusResult = useMemo((): PerennialStatusResult | null => {
    // Only applicable for areas with primary plants
    if (!area.primaryPlant?.plantId || !area.primaryPlant.plantedYear) {
      return null
    }

    // Get vegetable info to check for perennialInfo
    const vegetable = getVegetableById(area.primaryPlant.plantId)
    if (!vegetable?.perennialInfo) {
      return null
    }

    return getPerennialStatusFromPlant(
      area.primaryPlant,
      vegetable.perennialInfo,
      currentYear
    )
  }, [area.primaryPlant, currentYear])

  // Don't render if no status or plant removed
  if (!statusResult || statusResult.status === 'removed') {
    return null
  }

  const colorClasses = getStatusColorClasses(statusResult.status)
  const label = getStatusLabel(statusResult.status)

  if (compact) {
    return (
      <span
        className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${colorClasses}`}
        title={statusResult.description}
      >
        {label}
      </span>
    )
  }

  // Expanded view with more details
  return (
    <div className={`text-xs px-2 py-1 rounded-zen ${colorClasses}`}>
      <div className="font-medium">{label}</div>
      <div className="opacity-80">{statusResult.description}</div>
      {statusResult.replacementWarning && (
        <div className="mt-1 text-zen-kitsune-600 font-medium">
          ⚠️ {statusResult.replacementWarning}
        </div>
      )}
    </div>
  )
}
