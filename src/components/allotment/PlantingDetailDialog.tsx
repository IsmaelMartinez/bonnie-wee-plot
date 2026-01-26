'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Droplets,
  Sun,
  Calendar,
  ArrowRight,
  Check,
  AlertTriangle,
  Trash2,
  Ruler,
  Leaf,
  Home,
  Sprout,
  Info,
} from 'lucide-react'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import { Planting, PlantingUpdate, SowMethod } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusForPlanting } from '@/lib/companion-utils'
import { getPlantingPhase, getSowMethodLabel, PlantingPhaseInfo } from '@/lib/planting-utils'
import { getCrossYearDisplayInfo } from '@/lib/date-calculator'

interface PlantingDetailDialogProps {
  planting: Planting | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: PlantingUpdate) => void
  onDelete: () => void
  otherPlantings?: Planting[]
}

/**
 * Get the Tailwind color classes for a phase badge
 */
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

/**
 * Get the icon for a planting phase
 */
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

/**
 * Format a date string for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a date for input field (YYYY-MM-DD)
 */
function formatDateForInput(dateStr: string | undefined): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function PlantingDetailDialog({
  planting,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  otherPlantings = [],
}: PlantingDetailDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localNotes, setLocalNotes] = useState(planting?.notes || '')
  const [localHarvestNotes, setLocalHarvestNotes] = useState(planting?.harvestNotes || '')

  // Sync local state when planting changes
  useEffect(() => {
    setLocalNotes(planting?.notes || '')
    setLocalHarvestNotes(planting?.harvestNotes || '')
  }, [planting?.notes, planting?.harvestNotes])

  const veg = planting ? getVegetableById(planting.plantId) : null
  const { goods, bads } = planting
    ? getCompanionStatusForPlanting(planting, otherPlantings)
    : { goods: [], bads: [] }
  const phaseInfo = planting ? getPlantingPhase(planting) : null
  const crossYearInfo = planting ? getCrossYearDisplayInfo(planting) : null
  const PhaseIcon = phaseInfo ? getPhaseIcon(phaseInfo.phase) : Leaf

  // Debounced update for notes
  const handleNotesBlur = useCallback(() => {
    if (planting && localNotes !== planting.notes) {
      onUpdate({ notes: localNotes || undefined })
    }
  }, [planting, localNotes, onUpdate])

  const handleHarvestNotesBlur = useCallback(() => {
    if (planting && localHarvestNotes !== planting.harvestNotes) {
      onUpdate({ harvestNotes: localHarvestNotes || undefined })
    }
  }, [planting, localHarvestNotes, onUpdate])

  const handleDateChange = useCallback(
    (field: keyof PlantingUpdate, value: string) => {
      onUpdate({ [field]: value || undefined })
    },
    [onUpdate]
  )

  const handleSowMethodChange = useCallback(
    (method: SowMethod) => {
      onUpdate({ sowMethod: method })
    },
    [onUpdate]
  )

  const handleSuccessChange = useCallback(
    (success: Planting['success']) => {
      onUpdate({ success: success || undefined })
    },
    [onUpdate]
  )

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(false)
    onDelete()
    onClose()
  }, [onDelete, onClose])

  if (!planting || !isOpen) return null

  const title = `${veg?.name || planting.plantId}${planting.varietyName ? ` - ${planting.varietyName}` : ''}`

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        variant="bottom-sheet"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Phase Badge and Status */}
          <div className="flex flex-wrap items-center gap-2">
            {phaseInfo && (
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${getPhaseColors(phaseInfo.color)}`}
                title={phaseInfo.description}
              >
                <PhaseIcon className="w-4 h-4" />
                {phaseInfo.label}
              </span>
            )}
            {crossYearInfo?.isCrossYear && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-zen-water-100 text-zen-water-700">
                {crossYearInfo.label}
              </span>
            )}
          </div>

          {/* Plant Info Section */}
          {veg && (
            <section>
              <h3 className="text-sm font-medium text-zen-stone-500 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Plant Info
              </h3>
              <div className="bg-zen-stone-50 rounded-zen p-4 space-y-3">
                {/* Description */}
                {veg.description && (
                  <p className="text-sm text-zen-stone-600">{veg.description}</p>
                )}

                {/* Care Requirements */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5" title={`Water: ${veg.care.water}`}>
                    <Droplets
                      className={`w-4 h-4 ${
                        veg.care.water === 'high'
                          ? 'text-zen-water-600'
                          : veg.care.water === 'moderate'
                            ? 'text-zen-water-500'
                            : 'text-zen-water-400'
                      }`}
                    />
                    <span className="text-zen-stone-600 capitalize">{veg.care.water} water</span>
                  </span>
                  <span className="flex items-center gap-1.5" title={`Sun: ${veg.care.sun}`}>
                    <Sun
                      className={`w-4 h-4 ${
                        veg.care.sun === 'full-sun' ? 'text-zen-kitsune-500' : 'text-zen-kitsune-400'
                      }`}
                    />
                    <span className="text-zen-stone-600">
                      {veg.care.sun === 'full-sun' ? 'Full sun' : 'Partial shade'}
                    </span>
                  </span>
                  {veg.care.spacing && (
                    <span className="flex items-center gap-1.5" title="Spacing">
                      <Ruler className="w-4 h-4 text-zen-stone-400" />
                      <span className="text-zen-stone-600">
                        {veg.care.spacing.between}cm apart
                      </span>
                    </span>
                  )}
                </div>

                {/* Days to Harvest */}
                {veg.planting.daysToHarvest && (
                  <div className="text-sm text-zen-stone-600">
                    <span className="font-medium">Days to harvest:</span>{' '}
                    {veg.planting.daysToHarvest.min}-{veg.planting.daysToHarvest.max} days
                  </div>
                )}

                {/* Companion Status */}
                {(goods.length > 0 || bads.length > 0) && (
                  <div className="space-y-1">
                    {goods.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Check className="w-4 h-4 text-zen-moss-600" />
                        <span className="text-zen-moss-700">
                          Good with {goods.join(', ')}
                        </span>
                      </div>
                    )}
                    {bads.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="w-4 h-4 text-zen-kitsune-500" />
                        <span className="text-zen-kitsune-600">
                          Conflicts with {bads.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Dates Section */}
          <section>
            <h3 className="text-sm font-medium text-zen-stone-500 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Dates
            </h3>
            <div className="bg-zen-stone-50 rounded-zen p-4 space-y-4">
              {/* Sow Date */}
              <div>
                <label htmlFor="sow-date" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  Sow Date
                </label>
                <input
                  id="sow-date"
                  type="date"
                  value={formatDateForInput(planting.sowDate)}
                  onChange={(e) => handleDateChange('sowDate', e.target.value)}
                  className="zen-input text-sm w-full"
                />
              </div>

              {/* Sow Method */}
              <div>
                <label htmlFor="sow-method" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  Sow Method
                </label>
                <select
                  id="sow-method"
                  value={planting.sowMethod || ''}
                  onChange={(e) => handleSowMethodChange(e.target.value as SowMethod)}
                  className="zen-select text-sm w-full"
                >
                  <option value="">Select method...</option>
                  <option value="indoor">Indoor (start indoors)</option>
                  <option value="outdoor">Outdoor (direct sow)</option>
                  <option value="transplant-purchased">Purchased transplant</option>
                </select>
                {planting.sowMethod && (
                  <p className="text-xs text-zen-stone-500 mt-1">
                    {getSowMethodLabel(planting.sowMethod)}
                  </p>
                )}
              </div>

              {/* Transplant Date - only show for indoor sowing */}
              {planting.sowMethod === 'indoor' && (
                <div>
                  <label htmlFor="transplant-date" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Transplant Date
                  </label>
                  <input
                    id="transplant-date"
                    type="date"
                    value={formatDateForInput(planting.transplantDate)}
                    onChange={(e) => handleDateChange('transplantDate', e.target.value)}
                    className="zen-input text-sm w-full"
                  />
                </div>
              )}

              {/* Expected Harvest (calculated, read-only) */}
              {(planting.expectedHarvestStart || planting.expectedHarvestEnd) && (
                <div className="bg-zen-moss-50 rounded-zen p-3">
                  <div className="text-xs font-medium text-zen-moss-600 mb-1">Expected Harvest</div>
                  <div className="flex items-center gap-2 text-sm text-zen-moss-700">
                    <ArrowRight className="w-4 h-4" />
                    {formatDate(planting.expectedHarvestStart)}
                    {planting.expectedHarvestEnd && planting.expectedHarvestEnd !== planting.expectedHarvestStart && (
                      <> - {formatDate(planting.expectedHarvestEnd)}</>
                    )}
                  </div>
                </div>
              )}

              {/* Actual Harvest Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="harvest-start" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Harvest Started
                  </label>
                  <input
                    id="harvest-start"
                    type="date"
                    value={formatDateForInput(planting.actualHarvestStart)}
                    onChange={(e) => handleDateChange('actualHarvestStart', e.target.value)}
                    className="zen-input text-sm w-full"
                  />
                </div>
                <div>
                  <label htmlFor="harvest-end" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Harvest Finished
                  </label>
                  <input
                    id="harvest-end"
                    type="date"
                    value={formatDateForInput(planting.actualHarvestEnd)}
                    onChange={(e) => handleDateChange('actualHarvestEnd', e.target.value)}
                    className="zen-input text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Success Rating */}
          <section>
            <h3 className="text-sm font-medium text-zen-stone-500 mb-2">Success Rating</h3>
            <div className="flex flex-wrap gap-2">
              {(['excellent', 'good', 'fair', 'poor'] as const).map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleSuccessChange(planting.success === rating ? undefined : rating)}
                  className={`px-4 py-2.5 min-h-[44px] text-sm rounded-zen capitalize transition ${
                    planting.success === rating
                      ? rating === 'excellent'
                        ? 'bg-zen-moss-600 text-white'
                        : rating === 'good'
                          ? 'bg-zen-water-600 text-white'
                          : rating === 'fair'
                            ? 'bg-zen-kitsune-500 text-white'
                            : 'bg-zen-ume-600 text-white'
                      : 'bg-zen-stone-100 text-zen-stone-600 hover:bg-zen-stone-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </section>

          {/* Notes Section */}
          <section>
            <h3 className="text-sm font-medium text-zen-stone-500 mb-2">Notes</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="planting-notes" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  General Notes
                </label>
                <textarea
                  id="planting-notes"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add notes about this planting..."
                  rows={3}
                  className="zen-input text-sm w-full resize-none"
                />
              </div>
              <div>
                <label htmlFor="harvest-notes" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  Harvest Notes
                </label>
                <textarea
                  id="harvest-notes"
                  value={localHarvestNotes}
                  onChange={(e) => setLocalHarvestNotes(e.target.value)}
                  onBlur={handleHarvestNotesBlur}
                  placeholder="Notes about the harvest (yield, quality, timing)..."
                  rows={2}
                  className="zen-input text-sm w-full resize-none"
                />
              </div>
            </div>
          </section>

          {/* Delete Button */}
          <section className="pt-4 border-t border-zen-stone-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-zen-ume-600 border border-zen-ume-200 rounded-zen hover:bg-zen-ume-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Planting
            </button>
          </section>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Planting"
        message={`Are you sure you want to delete "${veg?.name || planting.plantId}"${planting.varietyName ? ` (${planting.varietyName})` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </>
  )
}
