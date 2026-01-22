'use client'

import { useMemo } from 'react'
import { Calendar, Sprout, Sun, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Vegetable } from '@/types/garden-planner'
import { SowMethod } from '@/types/unified-allotment'
import {
  calculatePlantingDates,
  validateSowDate,
  getGerminationDays,
} from '@/lib/date-calculator'

interface PlantingTimelineProps {
  sowDate: string
  sowMethod: SowMethod
  vegetable: Vegetable
  transplantDate?: string
}

/**
 * Displays calculated harvest timeline and validation warnings
 * when a user enters sow date information in the planting form.
 */
export default function PlantingTimeline({
  sowDate,
  sowMethod,
  vegetable,
  transplantDate,
}: PlantingTimelineProps) {
  // Calculate dates and validation
  const { dates, validation, germination } = useMemo(() => {
    const calculatedDates = calculatePlantingDates({
      sowDate,
      sowMethod,
      vegetable,
      transplantDate,
    })

    const sowValidation = validateSowDate(sowDate, sowMethod, vegetable)
    const germinationDays = getGerminationDays(vegetable.category)

    return {
      dates: calculatedDates,
      validation: sowValidation,
      germination: germinationDays,
    }
  }, [sowDate, sowMethod, vegetable, transplantDate])

  // Format date for display
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Calculate germination end date for indoor sowings
  const germinationEndDate = useMemo(() => {
    if (sowMethod !== 'indoor') return null
    const start = new Date(sowDate)
    start.setDate(start.getDate() + germination.max)
    return start.toISOString().split('T')[0]
  }, [sowDate, sowMethod, germination.max])

  return (
    <div className="bg-zen-stone-50 rounded-zen p-3 space-y-3">
      {/* Validation Status */}
      {validation.isValid ? (
        <div className="flex items-center gap-2 text-sm text-zen-moss-700">
          <CheckCircle className="w-4 h-4" />
          <span>
            Good time to {sowMethod === 'indoor' ? 'start indoors' : sowMethod === 'outdoor' ? 'sow outdoors' : 'plant'}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-sm text-zen-kitsune-700 bg-zen-kitsune-50 rounded-zen p-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            {validation.errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
            {validation.suggestions?.earliestRecommended && (
              <p className="text-xs mt-1 text-zen-kitsune-600">
                Recommended: {formatDisplayDate(validation.suggestions.earliestRecommended)} - {formatDisplayDate(validation.suggestions.latestRecommended || validation.suggestions.earliestRecommended)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.map((warning, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-zen-tanuki-700 bg-zen-tanuki-50 rounded-zen p-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      ))}

      {/* Timeline */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-zen-stone-600 uppercase tracking-wide">
          Expected Timeline
        </h4>

        <div className="space-y-1.5 text-sm">
          {/* Germination (for indoor sowings) */}
          {sowMethod === 'indoor' && germinationEndDate && (
            <div className="flex items-center gap-2 text-zen-stone-600">
              <Sprout className="w-4 h-4 text-zen-moss-500" />
              <span>Germination:</span>
              <span className="font-medium">
                {formatDisplayDate(sowDate)} - {formatDisplayDate(germinationEndDate)}
              </span>
            </div>
          )}

          {/* Transplant date (for indoor sowings) */}
          {sowMethod === 'indoor' && (
            <div className="flex items-center gap-2 text-zen-stone-600">
              <Sun className="w-4 h-4 text-zen-tanuki-500" />
              <span>Ready to transplant:</span>
              <span className="font-medium">
                {transplantDate
                  ? formatDisplayDate(transplantDate)
                  : `~${formatDisplayDate(germinationEndDate || sowDate)} (estimated)`}
              </span>
            </div>
          )}

          {/* Harvest window */}
          <div className="flex items-center gap-2 text-zen-stone-600">
            <Calendar className="w-4 h-4 text-zen-moss-600" />
            <span>Harvest window:</span>
            <span className="font-medium text-zen-moss-700">
              {formatDisplayDate(dates.expectedHarvestStart)} - {formatDisplayDate(dates.expectedHarvestEnd)}
            </span>
          </div>
        </div>

        {/* Days to harvest summary */}
        <p className="text-xs text-zen-stone-500 pt-1 border-t border-zen-stone-200">
          {vegetable.planting.daysToHarvest.min}-{vegetable.planting.daysToHarvest.max} days to harvest
          {dates.calculation.includes('fall adjustment') && ' (includes fall adjustment)'}
        </p>
      </div>
    </div>
  )
}
