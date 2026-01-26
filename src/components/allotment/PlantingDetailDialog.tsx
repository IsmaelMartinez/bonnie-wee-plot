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
  Info,
  Leaf,
} from 'lucide-react'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import { Planting, PlantingUpdate, SowMethod } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusForPlanting } from '@/lib/companion-utils'
import { getPlantingPhase, getSowMethodLabel, getPhaseIcon, getPhaseColors, formatDate, formatDateForInput } from '@/lib/planting-utils'
import { getCrossYearDisplayInfo } from '@/lib/date-calculator'

interface PlantingDetailDialogProps {
  planting: Planting | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: PlantingUpdate) => void
  onDelete: () => void
  otherPlantings?: Planting[]
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
  const [localSowDate, setLocalSowDate] = useState(formatDateForInput(planting?.sowDate))
  const [localTransplantDate, setLocalTransplantDate] = useState(formatDateForInput(planting?.transplantDate))
  const [localHarvestStart, setLocalHarvestStart] = useState(formatDateForInput(planting?.actualHarvestStart))
  const [localHarvestEnd, setLocalHarvestEnd] = useState(formatDateForInput(planting?.actualHarvestEnd))

  useEffect(() => {
    setLocalNotes(planting?.notes || '')
    setLocalSowDate(formatDateForInput(planting?.sowDate))
    setLocalTransplantDate(formatDateForInput(planting?.transplantDate))
    setLocalHarvestStart(formatDateForInput(planting?.actualHarvestStart))
    setLocalHarvestEnd(formatDateForInput(planting?.actualHarvestEnd))
  }, [planting?.notes, planting?.sowDate, planting?.transplantDate, planting?.actualHarvestStart, planting?.actualHarvestEnd])

  const veg = planting ? getVegetableById(planting.plantId) : null
  const { goods, bads } = planting
    ? getCompanionStatusForPlanting(planting, otherPlantings)
    : { goods: [], bads: [] }
  const phaseInfo = planting ? getPlantingPhase(planting) : null
  const crossYearInfo = planting ? getCrossYearDisplayInfo(planting) : null
  const PhaseIcon = phaseInfo ? getPhaseIcon(phaseInfo.phase) : Leaf

  const handleNotesBlur = useCallback(() => {
    if (planting && localNotes !== planting.notes) {
      onUpdate({ notes: localNotes || undefined })
    }
  }, [planting, localNotes, onUpdate])


  const handleDateChange = useCallback(
    (field: keyof PlantingUpdate, value: string) => {
      if (field === 'sowDate') setLocalSowDate(value)
      else if (field === 'transplantDate') setLocalTransplantDate(value)
      else if (field === 'actualHarvestStart') setLocalHarvestStart(value)
      else if (field === 'actualHarvestEnd') setLocalHarvestEnd(value)
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

          {veg && (
            <section>
              <h3 className="text-sm font-medium text-zen-stone-500 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Plant Info
              </h3>
              <div className="bg-zen-stone-50 rounded-zen p-4 space-y-3">
                {veg.description && (
                  <p className="text-sm text-zen-stone-600">{veg.description}</p>
                )}

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
                      <span className="text-zen-stone-600">{veg.care.spacing.between}cm apart</span>
                    </span>
                  )}
                </div>

                {veg.planting.daysToHarvest && (
                  <div className="text-sm text-zen-stone-600">
                    <span className="font-medium">Days to harvest:</span>{' '}
                    {veg.planting.daysToHarvest.min}-{veg.planting.daysToHarvest.max} days
                  </div>
                )}

                {(goods.length > 0 || bads.length > 0) && (
                  <div className="space-y-1">
                    {goods.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Check className="w-4 h-4 text-zen-moss-600" />
                        <span className="text-zen-moss-700">Good with {goods.join(', ')}</span>
                      </div>
                    )}
                    {bads.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="w-4 h-4 text-zen-kitsune-500" />
                        <span className="text-zen-kitsune-600">Conflicts with {bads.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-medium text-zen-stone-500 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Dates
            </h3>
            <div className="bg-zen-stone-50 rounded-zen p-4 space-y-4">
              <div>
                <label htmlFor="sow-date" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  Sow Date
                </label>
                <input
                  id="sow-date"
                  type="date"
                  value={localSowDate}
                  onChange={(e) => handleDateChange('sowDate', e.target.value)}
                  className="zen-input text-sm w-full"
                />
              </div>

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
                  <p className="text-xs text-zen-stone-500 mt-1">{getSowMethodLabel(planting.sowMethod)}</p>
                )}
              </div>

              {planting.sowMethod === 'indoor' && (
                <div>
                  <label htmlFor="transplant-date" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Transplant Date
                  </label>
                  <input
                    id="transplant-date"
                    type="date"
                    value={localTransplantDate}
                    onChange={(e) => handleDateChange('transplantDate', e.target.value)}
                    className="zen-input text-sm w-full"
                  />
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="harvest-start" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Harvest Started
                  </label>
                  <input
                    id="harvest-start"
                    type="date"
                    value={localHarvestStart}
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
                    value={localHarvestEnd}
                    onChange={(e) => handleDateChange('actualHarvestEnd', e.target.value)}
                    className="zen-input text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </section>

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

          <section>
            <h3 className="text-sm font-medium text-zen-stone-500 mb-2">Notes</h3>
            <textarea
              id="planting-notes"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this planting..."
              rows={3}
              className="zen-input text-sm w-full resize-none"
            />
          </section>

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
