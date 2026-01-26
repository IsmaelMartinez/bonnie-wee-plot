'use client'

import { useMemo } from 'react'
import { AlertTriangle, Check, Droplets, Sun, Calendar, ArrowRight, Sprout, Leaf, Home } from 'lucide-react'
import { getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusForPlanting } from '@/lib/companion-utils'
import { getCrossYearDisplayInfo } from '@/lib/date-calculator'
import { getPlantingPhase, getSowMethodShortLabel, PlantingPhaseInfo } from '@/lib/planting-utils'
import { Planting, PlantingUpdate } from '@/types/unified-allotment'

function getPhaseIcon(phase: PlantingPhaseInfo['phase']) {
  switch (phase) {
    case 'planned':
      return Calendar
    case 'germinating':
    case 'growing-indoor':
      return Home
    case 'ready-to-transplant':
      return Sprout
    case 'growing':
    case 'ready-to-harvest':
    case 'harvesting':
      return Leaf
    default:
      return Leaf
  }
}

function getPhaseColors(color: PlantingPhaseInfo['color']): string {
  switch (color) {
    case 'gray':
      return 'bg-zen-stone-100 text-zen-stone-700'
    case 'blue':
      return 'bg-zen-water-100 text-zen-water-700'
    case 'green':
      return 'bg-zen-moss-100 text-zen-moss-700'
    case 'yellow':
      return 'bg-yellow-100 text-yellow-700'
    case 'orange':
      return 'bg-zen-kitsune-100 text-zen-kitsune-700'
    case 'red':
      return 'bg-zen-ume-100 text-zen-ume-700'
    default:
      return 'bg-zen-stone-100 text-zen-stone-700'
  }
}

interface PlantingCardProps {
  planting: Planting
  onUpdate: (updates: PlantingUpdate) => void
  otherPlantings?: Planting[]
  onClick?: () => void
}

export default function PlantingCard({
  planting,
  onUpdate,
  otherPlantings = [],
  onClick,
}: PlantingCardProps) {
  const veg = getVegetableById(planting.plantId)
  const { goods, bads } = getCompanionStatusForPlanting(planting, otherPlantings)
  const crossYearInfo = useMemo(() => getCrossYearDisplayInfo(planting), [planting])
  const phaseInfo = useMemo(() => getPlantingPhase(planting), [planting])
  const PhaseIcon = getPhaseIcon(phaseInfo.phase)

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('select')
    ) {
      return
    }
    onClick?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      className={`rounded-zen p-3 ${bads.length > 0 ? 'bg-zen-kitsune-50 border border-zen-kitsune-200' : 'bg-zen-stone-50'} ${
        onClick ? 'cursor-pointer hover:bg-zen-stone-100/50 focus-within:ring-2 focus-within:ring-zen-moss-500 focus-within:ring-offset-2 transition' : ''
      }`}
      onClick={handleCardClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View details for ${veg?.name || planting.plantId}${planting.varietyName ? ` (${planting.varietyName})` : ''}` : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zen-ink-800">
              {veg?.name || planting.plantId}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getPhaseColors(phaseInfo.color)}`}
              title={phaseInfo.description}
            >
              <PhaseIcon className="w-3 h-3" />
              {phaseInfo.label}
            </span>
          </div>

          {planting.varietyName && (
            <div className="text-xs text-zen-stone-500">{planting.varietyName}</div>
          )}

          {phaseInfo.phase === 'planned' && planting.sowMethod && (
            <div className="text-xs text-zen-stone-500 mt-1">
              Plan: {getSowMethodShortLabel(planting.sowMethod)}
            </div>
          )}

          {(planting.sowDate || planting.expectedHarvestStart) && (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zen-stone-500">
              {planting.sowDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Sown {new Date(planting.sowDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {planting.sowMethod && planting.sowMethod !== 'outdoor' && (
                    <span className="text-zen-water-600">({planting.sowMethod === 'indoor' ? 'indoors' : 'transplant'})</span>
                  )}
                </span>
              )}
              {planting.expectedHarvestStart && planting.expectedHarvestEnd && (
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Harvest {new Date(planting.expectedHarvestStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {' - '}
                  {new Date(planting.expectedHarvestEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )}

          {crossYearInfo.isCrossYear && (
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-zen-water-100 text-zen-water-700">
                {crossYearInfo.label}
              </span>
            </div>
          )}

          {veg && (
            <div className="flex items-center gap-2 mt-1 text-xs text-zen-stone-500">
              <span className="flex items-center gap-0.5" title={`Water: ${veg.care.water}`}>
                <Droplets className={`w-3 h-3 ${
                  veg.care.water === 'high' ? 'text-zen-water-600' :
                  veg.care.water === 'moderate' ? 'text-zen-water-500' : 'text-zen-water-400'
                }`} />
                {veg.care.water === 'high' ? 'High' : veg.care.water === 'moderate' ? 'Med' : 'Low'}
              </span>
              <span className="flex items-center gap-0.5" title={`Sun: ${veg.care.sun}`}>
                <Sun className={`w-3 h-3 ${
                  veg.care.sun === 'full-sun' ? 'text-zen-kitsune-500' : 'text-zen-kitsune-400'
                }`} />
                {veg.care.sun === 'full-sun' ? 'Full' : 'Partial'}
              </span>
            </div>
          )}

          {goods.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Check className="w-3 h-3 text-zen-moss-600" />
              <span className="text-xs text-zen-moss-700">Good with {goods.join(', ')}</span>
            </div>
          )}
          {bads.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-zen-kitsune-500" />
              <span className="text-xs text-zen-kitsune-600">Conflicts with {bads.join(', ')}</span>
            </div>
          )}

          {planting.success && (
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              planting.success === 'excellent' ? 'bg-zen-moss-100 text-zen-moss-700' :
              planting.success === 'good' ? 'bg-zen-water-100 text-zen-water-700' :
              planting.success === 'fair' ? 'bg-zen-kitsune-100 text-zen-kitsune-700' :
              'bg-zen-ume-100 text-zen-ume-700'
            }`}>
              {planting.success}
            </span>
          )}

          {planting.notes && (
            <div className="text-xs text-zen-stone-400 mt-1 line-clamp-2">{planting.notes}</div>
          )}

          {phaseInfo.canAdvanceTo && phaseInfo.canAdvanceTo.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {phaseInfo.phase === 'ready-to-transplant' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({
                      transplantDate: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="text-xs px-2 py-1 bg-zen-moss-100 text-zen-moss-700 rounded-zen hover:bg-zen-moss-200 transition"
                >
                  Mark as Transplanted
                </button>
              )}

              {phaseInfo.phase === 'ready-to-harvest' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({
                      actualHarvestStart: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="text-xs px-2 py-1 bg-zen-kitsune-100 text-zen-kitsune-700 rounded-zen hover:bg-zen-kitsune-200 transition"
                >
                  Start Harvest
                </button>
              )}

              {phaseInfo.phase === 'harvesting' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({
                      actualHarvestEnd: new Date().toISOString().split('T')[0],
                      status: 'harvested'
                    })
                  }}
                  className="text-xs px-2 py-1 bg-zen-kitsune-100 text-zen-kitsune-700 rounded-zen hover:bg-zen-kitsune-200 transition"
                >
                  Complete Harvest
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
