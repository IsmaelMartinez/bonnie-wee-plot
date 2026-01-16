'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Trash2, Droplets, Sun } from 'lucide-react'
import { getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusForPlanting } from '@/lib/companion-utils'
import { Planting } from '@/types/unified-allotment'
import { ConfirmDialog } from '@/components/ui/Dialog'

interface PlantingCardProps {
  planting: Planting
  onDelete: () => void
  onUpdateSuccess: (success: Planting['success']) => void
  otherPlantings?: Planting[]
}

export default function PlantingCard({
  planting,
  onDelete,
  onUpdateSuccess,
  otherPlantings = []
}: PlantingCardProps) {
  const veg = getVegetableById(planting.plantId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { goods, bads } = getCompanionStatusForPlanting(planting, otherPlantings)

  return (
    <>
      <div className={`rounded-zen p-3 ${bads.length > 0 ? 'bg-zen-kitsune-50 border border-zen-kitsune-200' : 'bg-zen-stone-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-zen-ink-800">
              {veg?.name || planting.plantId}
            </div>
            {planting.varietyName && (
              <div className="text-xs text-zen-stone-500">{planting.varietyName}</div>
            )}

            {/* Care requirements */}
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

            {/* Companion Status */}
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
          </div>

          {/* Actions - always visible for accessibility and mobile */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor={`success-${planting.id}`} className="sr-only">
              Rate success for {veg?.name || planting.plantId}
            </label>
            <select
              id={`success-${planting.id}`}
              value={planting.success || ''}
              onChange={(e) => onUpdateSuccess((e.target.value || undefined) as Planting['success'])}
              className="text-xs px-2 py-2.5 min-h-[44px] border border-zen-stone-200 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
              aria-label="Rate planting success"
            >
              <option value="">Rate...</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 min-w-[44px] min-h-[44px] text-zen-ume-500 hover:bg-zen-ume-50 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-ume-500 flex items-center justify-center"
              aria-label={`Delete ${veg?.name || planting.plantId}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={onDelete}
        title="Delete Planting"
        message={`Are you sure you want to delete "${veg?.name || planting.plantId}"${planting.varietyName ? ` (${planting.varietyName})` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </>
  )
}
