'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, X, Sprout, Leaf, TreeDeciduous, Warehouse, ArrowRight, Trash2 } from 'lucide-react'
import { AllotmentItemRef, RotationGroup } from '@/types/garden-planner'
import { Area, AreaSeason, Planting, PlantingUpdate, AreaNote, NewAreaNote, AreaNoteUpdate } from '@/types/unified-allotment'
import { BED_COLORS } from '@/data/allotment-layout'
import { getVegetableName } from '@/lib/vegetable-loader'
import { getNextRotationGroup, ROTATION_GROUP_DISPLAY, getVegetablesForRotationGroup } from '@/lib/rotation'
import PlantingCard from './PlantingCard'
import PlantingDetailDialog from './PlantingDetailDialog'
import BedNotes from './BedNotes'
import { ConfirmDialog } from '@/components/ui/Dialog'

interface MobileAreaBottomSheetProps {
  selectedItemRef: AllotmentItemRef | null
  getArea: (id: string) => Area | undefined
  getAreaSeason: (areaId: string) => AreaSeason | undefined
  getPlantings: (areaId: string) => Planting[]
  getAreaNotes: (areaId: string) => AreaNote[]
  getPreviousYearRotation: (areaId: string) => RotationGroup | null
  selectedYear: number
  onAddPlanting: () => void
  onDeletePlanting: (plantingId: string) => void
  onUpdatePlanting: (plantingId: string, updates: PlantingUpdate) => void
  onAddNote: (note: NewAreaNote) => void
  onUpdateNote: (noteId: string, updates: AreaNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
  onEditArea: () => void
  onArchiveArea: (areaId: string) => void
  onClose: () => void
}

function getAreaIcon(area: Area) {
  if (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') {
    return <Sprout className="w-5 h-5" />
  } else if (area.kind === 'tree') {
    return <TreeDeciduous className="w-5 h-5" />
  } else if (area.kind === 'berry' || area.kind === 'herb') {
    return <Leaf className="w-5 h-5" />
  } else if (area.kind === 'infrastructure') {
    return <Warehouse className="w-5 h-5" />
  }
  return <Sprout className="w-5 h-5" />
}

function getAreaSubtitle(area: Area, areaSeason: AreaSeason | null | undefined): string {
  if (area.kind === 'rotation-bed') {
    return areaSeason?.rotationGroup
      ? ROTATION_GROUP_DISPLAY[areaSeason.rotationGroup]?.name || 'Rotation Bed'
      : 'Rotation Bed'
  }
  if (area.kind === 'perennial-bed') return 'Perennial Bed'
  if (area.kind === 'tree') return 'Fruit Tree'
  if (area.kind === 'berry') return 'Berry'
  if (area.kind === 'herb') return 'Herb'
  if (area.kind === 'infrastructure') {
    const subtypes: Record<string, string> = {
      shed: 'Shed',
      compost: 'Compost',
      'water-butt': 'Water Storage',
      path: 'Path',
      greenhouse: 'Greenhouse',
      pond: 'Pond',
      wildlife: 'Wildlife Area',
      other: 'Infrastructure',
    }
    return subtypes[area.infrastructureSubtype || 'other'] || 'Infrastructure'
  }
  return 'Area'
}

export default function MobileAreaBottomSheet({
  selectedItemRef,
  getArea,
  getAreaSeason,
  getPlantings,
  getAreaNotes,
  getPreviousYearRotation,
  selectedYear,
  onAddPlanting,
  onDeletePlanting,
  onUpdatePlanting,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onUpdateRotation,
  onAutoRotate,
  onEditArea,
  onArchiveArea,
  onClose,
}: MobileAreaBottomSheetProps) {
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const area = selectedItemRef ? getArea(selectedItemRef.id) : undefined
  const areaSeason = area ? getAreaSeason(area.id) : null
  const plantings = area ? getPlantings(area.id) : []
  const notes = area ? getAreaNotes(area.id) : []
  const previousYearRotation = area ? getPreviousYearRotation(area.id) : null

  // Calculate rotation suggestion
  const rotationInfo = useMemo(() => {
    if (!previousYearRotation || area?.kind !== 'rotation-bed') return null
    const suggested = getNextRotationGroup(previousYearRotation)
    const lastDisplay = ROTATION_GROUP_DISPLAY[previousYearRotation]
    const nextDisplay = ROTATION_GROUP_DISPLAY[suggested]
    const suggestedVegIds = getVegetablesForRotationGroup(suggested)
    const suggestedVegNames = suggestedVegIds
      .slice(0, 3)
      .map(id => getVegetableName(id))
      .filter(Boolean)
    return { lastYear: previousYearRotation, suggested, lastDisplay, nextDisplay, suggestedVegNames }
  }, [previousYearRotation, area?.kind])

  if (!area) return null

  const isRotationOrPerennialBed = area.kind === 'rotation-bed' || area.kind === 'perennial-bed'
  const canAddPlantings = isRotationOrPerennialBed || area.kind === 'berry'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-zen-stone-300 rounded-full" />
        </div>

        {/* Header with quick actions */}
        <div className="px-4 pb-3 border-b border-zen-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            {/* Area Icon */}
            <div
              className="w-12 h-12 rounded-zen-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: area.color || BED_COLORS[area.id] || '#6b7280' }}
            >
              {area.icon ? (
                <span className="text-xl">{area.icon}</span>
              ) : (
                getAreaIcon(area)
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <h2 id="sheet-title" className="font-display text-lg text-zen-ink-800 truncate">
                {area.name}
              </h2>
              <p className="text-sm text-zen-stone-500">
                {getAreaSubtitle(area, areaSeason)}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onEditArea}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-zen-stone-500 hover:text-zen-moss-600 hover:bg-zen-moss-50 rounded-zen transition"
                aria-label="Edit area"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-zen-stone-400 hover:text-zen-stone-600 hover:bg-zen-stone-100 rounded-zen transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-4">
            {/* Rotation Guide for rotation beds */}
            {rotationInfo && (
              <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3">
                <div className="text-xs text-zen-kitsune-700 font-medium mb-2">Rotation Suggestion</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1">
                    <span>{rotationInfo.lastDisplay?.emoji}</span>
                    <span className="text-zen-stone-600">{selectedYear - 1}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-zen-kitsune-500" />
                  <span className="flex items-center gap-1 font-medium text-zen-kitsune-700">
                    <span>{rotationInfo.nextDisplay?.emoji}</span>
                    <span>{rotationInfo.nextDisplay?.name}</span>
                  </span>
                </div>
                {rotationInfo.suggestedVegNames.length > 0 && (
                  <p className="text-xs text-zen-stone-500 mt-2">
                    Try: {rotationInfo.suggestedVegNames.join(', ')}
                  </p>
                )}
                <button
                  onClick={onAutoRotate}
                  className="mt-2 w-full py-2 text-sm bg-zen-kitsune-100 text-zen-kitsune-700 rounded-zen hover:bg-zen-kitsune-200 transition font-medium"
                >
                  Apply Rotation
                </button>
              </div>
            )}

            {/* Rotation Type Selector for rotation beds */}
            {area.kind === 'rotation-bed' && (
              <div>
                <label htmlFor="mobile-rotation-type" className="block text-xs font-medium text-zen-stone-500 mb-1">
                  Rotation Type
                </label>
                <select
                  id="mobile-rotation-type"
                  value={areaSeason?.rotationGroup || 'legumes'}
                  onChange={(e) => onUpdateRotation(e.target.value as RotationGroup)}
                  className="zen-select text-sm w-full"
                >
                  <option value="legumes">Legumes</option>
                  <option value="brassicas">Brassicas</option>
                  <option value="roots">Roots</option>
                  <option value="solanaceae">Solanaceae</option>
                  <option value="alliums">Alliums</option>
                  <option value="cucurbits">Cucurbits</option>
                </select>
              </div>
            )}

            {/* Description */}
            {area.description && (
              <p className="text-sm text-zen-stone-600">{area.description}</p>
            )}

            {/* Notes section for beds */}
            {isRotationOrPerennialBed && (
              <BedNotes
                notes={notes}
                onAdd={onAddNote}
                onUpdate={onUpdateNote}
                onRemove={onRemoveNote}
              />
            )}

            {/* Plantings Section */}
            {canAddPlantings && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zen-ink-700 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-zen-moss-600" />
                    {selectedYear} Plantings
                  </h3>
                  <button
                    onClick={onAddPlanting}
                    className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-zen-moss-600 text-white rounded-zen hover:bg-zen-moss-700 transition text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Plant
                  </button>
                </div>

                {plantings.length > 0 ? (
                  <div className="space-y-2">
                    {plantings.map(p => (
                      <PlantingCard
                        key={p.id}
                        planting={p}
                        onUpdate={(updates) => onUpdatePlanting(p.id, updates)}
                        otherPlantings={plantings}
                        onClick={() => setSelectedPlanting(p)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-zen-stone-50 rounded-zen p-4 text-center">
                    <Sprout className="w-8 h-8 text-zen-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-zen-stone-500">No plantings yet</p>
                    <p className="text-xs text-zen-stone-400 mt-1">Tap &quot;Add Plant&quot; to get started</p>
                  </div>
                )}
              </div>
            )}

            {/* Infrastructure info */}
            {area.kind === 'infrastructure' && (
              <div className="bg-zen-stone-50 rounded-zen p-4">
                <p className="text-sm text-zen-stone-600">
                  {area.infrastructureSubtype === 'shed' && 'Store tools and garden supplies.'}
                  {area.infrastructureSubtype === 'water-butt' && 'Collect rainwater for irrigation.'}
                  {area.infrastructureSubtype === 'path' && 'Access route through the allotment.'}
                  {area.infrastructureSubtype === 'greenhouse' && 'Protected growing space for tender plants.'}
                  {area.infrastructureSubtype === 'compost' && 'Recycle garden and kitchen waste into nutrient-rich compost.'}
                  {area.infrastructureSubtype === 'pond' && 'Water feature supporting wildlife and beneficial insects.'}
                  {area.infrastructureSubtype === 'wildlife' && 'Habitat area for pollinators and beneficial creatures.'}
                  {(!area.infrastructureSubtype || area.infrastructureSubtype === 'other') && 'Part of your allotment layout.'}
                </p>
              </div>
            )}

            {/* Permanent planting info for trees/berries/herbs */}
            {(area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb') && area.primaryPlant && (
              <div className="bg-zen-stone-50 rounded-zen p-4">
                {area.primaryPlant.variety && (
                  <p className="text-sm font-medium text-zen-ink-700 mb-1">{area.primaryPlant.variety}</p>
                )}
                {area.primaryPlant.plantedYear && (
                  <p className="text-xs text-zen-stone-500">
                    Planted in {area.primaryPlant.plantedYear}
                  </p>
                )}
              </div>
            )}

            {/* Remove Area Button */}
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-zen-kitsune-600 hover:text-zen-kitsune-700 hover:bg-zen-kitsune-50 rounded-zen transition"
            >
              <Trash2 className="w-4 h-4" />
              Remove Area
            </button>
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>

      {/* Planting Detail Dialog */}
      <PlantingDetailDialog
        planting={selectedPlanting}
        isOpen={!!selectedPlanting}
        onClose={() => setSelectedPlanting(null)}
        onUpdate={(updates) => {
          if (selectedPlanting) {
            onUpdatePlanting(selectedPlanting.id, updates)
          }
        }}
        onDelete={() => {
          if (selectedPlanting) {
            onDeletePlanting(selectedPlanting.id)
            setSelectedPlanting(null)
          }
        }}
        otherPlantings={plantings}
      />

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={() => {
          if (area) {
            onArchiveArea(area.id)
            setShowArchiveConfirm(false)
            onClose()
          }
        }}
        title="Remove Area"
        message={`Are you sure you want to remove "${area.name}"? This will archive the area and hide it from the layout. Historical data will be preserved.`}
        confirmText="Remove"
        variant="danger"
      />
    </>
  )
}
