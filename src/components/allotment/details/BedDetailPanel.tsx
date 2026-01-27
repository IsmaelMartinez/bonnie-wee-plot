'use client'

import { useMemo, useState } from 'react'
import { Sprout, Plus, ArrowRight, Leaf, Pencil, Trash2 } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { getVegetableById } from '@/lib/vegetable-database'
import { getNextRotationGroup, ROTATION_GROUP_DISPLAY, getVegetablesForRotationGroup } from '@/lib/rotation'
import { RotationGroup } from '@/types/garden-planner'
import { Planting, PlantingUpdate, Area, AreaSeason, AreaNote, NewAreaNote, AreaNoteUpdate } from '@/types/unified-allotment'
import BedNotes from '@/components/allotment/BedNotes'
import PlantingCard from '@/components/allotment/PlantingCard'
import PlantingDetailDialog from '@/components/allotment/PlantingDetailDialog'
import EditAreaForm from '@/components/allotment/EditAreaForm'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'

interface BedDetailPanelProps {
  area: Area
  areaSeason: AreaSeason | null
  plantings: Planting[]
  notes: AreaNote[]
  selectedYear: number
  previousYearRotation?: RotationGroup | null
  onAddPlanting: () => void
  onDeletePlanting: (plantingId: string) => void
  onUpdatePlanting: (plantingId: string, updates: PlantingUpdate) => void
  onAddNote: (note: NewAreaNote) => void
  onUpdateNote: (noteId: string, updates: AreaNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  onArchiveArea: (areaId: string) => void
}

export default function BedDetailPanel({
  area,
  areaSeason,
  plantings,
  notes,
  selectedYear,
  previousYearRotation,
  onAddPlanting,
  onDeletePlanting,
  onUpdatePlanting,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onUpdateRotation,
  onAutoRotate,
  onUpdateArea,
  onArchiveArea,
}: BedDetailPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  // Determine if this is a rotation bed (vs perennial bed)
  const isRotationBed = area.kind === 'rotation-bed'

  // Compute auto-rotate info
  const autoRotateInfo = useMemo(() => {
    if (!previousYearRotation) return null

    const suggestedGroup = getNextRotationGroup(previousYearRotation)
    const suggestedVegetables = getVegetablesForRotationGroup(suggestedGroup)

    return {
      previousYear: selectedYear - 1,
      previousGroup: previousYearRotation,
      suggestedGroup,
      suggestedVegetables,
    }
  }, [previousYearRotation, selectedYear])

  // Compute rotation indicator
  const rotationInfo = useMemo(() => {
    if (!previousYearRotation || !isRotationBed) return null

    const suggested = getNextRotationGroup(previousYearRotation)
    const lastDisplay = ROTATION_GROUP_DISPLAY[previousYearRotation]
    const nextDisplay = ROTATION_GROUP_DISPLAY[suggested]
    const suggestedVegIds = getVegetablesForRotationGroup(suggested)
    const suggestedVegNames = suggestedVegIds
      .slice(0, 4)
      .map(id => getVegetableById(id)?.name)
      .filter(Boolean)

    return { lastYear: previousYearRotation, suggested, lastDisplay, nextDisplay, suggestedVegNames }
  }, [previousYearRotation, isRotationBed])

  const handleEditSubmit = (areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    onUpdateArea(areaId, updates)
    setIsEditMode(false)
  }

  return (
    <>
      <div className="zen-card p-6 sticky top-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-zen-lg flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: area.color || BED_COLORS[area.id] || '#6b7280' }}
          >
            {area.icon || area.id.replace('-prime', "'").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-zen-ink-800">{area.name}</h3>
            <div className={`text-xs flex items-center gap-1 ${
              !isRotationBed ? 'text-zen-sakura-600' : 'text-zen-moss-600'
            }`}>
              {!isRotationBed && <Leaf className="w-3 h-3" />}
              {!isRotationBed ? 'Perennial' : areaSeason?.rotationGroup || 'Rotation'}
            </div>
          </div>
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-zen-stone-500 hover:text-zen-moss-600 hover:bg-zen-moss-50 rounded-zen transition"
            title="Edit area details"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>

      {/* Rotation Type Selector - Only for rotation beds */}
      {isRotationBed && (
        <div className="mb-4">
          <label htmlFor="rotation-type" className="block text-xs font-medium text-zen-stone-500 mb-1">
            Rotation Type
          </label>
          <select
            id="rotation-type"
            value={areaSeason?.rotationGroup || 'legumes'}
            onChange={(e) => onUpdateRotation(e.target.value as RotationGroup)}
            className="zen-select text-sm"
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

      {/* Rotation Guide */}
      {rotationInfo && (
        <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
          <div className="text-xs text-zen-kitsune-700 font-medium mb-1">Rotation Guide</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <span>{rotationInfo.lastDisplay?.emoji}</span>
              <span className="text-zen-stone-600">{selectedYear - 1}: {rotationInfo.lastDisplay?.name}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-zen-kitsune-500" />
            <span className="flex items-center gap-1 font-medium text-zen-kitsune-700">
              <span>{rotationInfo.nextDisplay?.emoji}</span>
              <span>{selectedYear}: {rotationInfo.nextDisplay?.name}</span>
            </span>
          </div>
          {rotationInfo.suggestedVegNames.length > 0 && (
            <div className="text-xs text-zen-stone-500 mt-2">
              Consider: {rotationInfo.suggestedVegNames.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {area.description && (
        <p className="text-sm text-zen-stone-600 mb-4">{area.description}</p>
      )}

      {/* Bed Notes */}
      <div className="mb-4">
        <BedNotes
          notes={notes}
          onAdd={onAddNote}
          onUpdate={onUpdateNote}
          onRemove={onRemoveNote}
        />
      </div>

      {/* Plantings Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-zen-ink-700 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-zen-moss-600" />
            {selectedYear} Plantings
          </h4>
          <div className="flex items-center gap-1">
            {autoRotateInfo && (
              <button
                onClick={onAutoRotate}
                className="flex items-center gap-1.5 text-xs px-3 py-2.5 min-h-[44px] bg-zen-water-100 text-zen-water-700 rounded-zen hover:bg-zen-water-200 transition"
                title={`Rotate from ${ROTATION_GROUP_DISPLAY[autoRotateInfo.previousGroup]?.name} to ${ROTATION_GROUP_DISPLAY[autoRotateInfo.suggestedGroup]?.name}`}
              >
                <ArrowRight className="w-4 h-4" />
                Auto-rotate
              </button>
            )}
            <button
              onClick={onAddPlanting}
              className="flex items-center gap-1.5 text-xs px-3 py-2.5 min-h-[44px] bg-zen-moss-100 text-zen-moss-700 rounded-zen hover:bg-zen-moss-200 transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
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
          <div className="text-sm text-zen-stone-400 italic">
            No plantings recorded. Click Add to start planning.
          </div>
        )}
      </div>

      {/* Remove Area */}
      <div className="mt-6 pt-4 border-t border-zen-stone-100">
        <button
          onClick={() => setShowArchiveConfirm(true)}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove this area</span>
        </button>
      </div>
    </div>

    {/* Edit Dialog */}
    <Dialog
      isOpen={isEditMode}
      onClose={() => setIsEditMode(false)}
      title="Edit Area"
      description="Update the details for this area."
      maxWidth="lg"
    >
      <EditAreaForm
        area={area}
        onSubmit={handleEditSubmit}
        onCancel={() => setIsEditMode(false)}
      />
    </Dialog>

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
        onArchiveArea(area.id)
        setShowArchiveConfirm(false)
      }}
      title="Remove Area"
      message={`Are you sure you want to remove "${area.name}"? This will archive the area and hide it from the layout. Historical data will be preserved.`}
      confirmText="Remove"
      variant="danger"
    />
  </>
  )
}
