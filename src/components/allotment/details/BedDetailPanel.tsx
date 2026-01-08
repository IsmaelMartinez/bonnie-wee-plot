'use client'

import { useMemo } from 'react'
import { Sprout, Plus, ArrowRight, Leaf } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { getVegetableById } from '@/lib/vegetable-database'
import { getNextRotationGroup, ROTATION_GROUP_DISPLAY, getVegetablesForRotationGroup } from '@/lib/rotation'
import { PhysicalBedId, RotationGroup } from '@/types/garden-planner'
import { Planting, BedSeason, BedNote, NewBedNote, BedNoteUpdate, BedArea } from '@/types/unified-allotment'
import BedNotes from '@/components/allotment/BedNotes'
import PlantingCard from '@/components/allotment/PlantingCard'

interface BedDetailPanelProps {
  bed: BedArea
  bedId: PhysicalBedId
  bedSeason: BedSeason | null
  plantings: Planting[]
  notes: BedNote[]
  selectedYear: number
  previousYearRotation?: RotationGroup | null
  onAddPlanting: () => void
  onDeletePlanting: (plantingId: string) => void
  onUpdateSuccess: (plantingId: string, success: Planting['success']) => void
  onAddNote: (note: NewBedNote) => void
  onUpdateNote: (noteId: string, updates: BedNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
}

export default function BedDetailPanel({
  bed,
  bedId,
  bedSeason,
  plantings,
  notes,
  selectedYear,
  previousYearRotation,
  onAddPlanting,
  onDeletePlanting,
  onUpdateSuccess,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onUpdateRotation,
  onAutoRotate,
}: BedDetailPanelProps) {
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
    if (!previousYearRotation || bed.status !== 'rotation') return null

    const suggested = getNextRotationGroup(previousYearRotation)
    const lastDisplay = ROTATION_GROUP_DISPLAY[previousYearRotation]
    const nextDisplay = ROTATION_GROUP_DISPLAY[suggested]
    const suggestedVegIds = getVegetablesForRotationGroup(suggested)
    const suggestedVegNames = suggestedVegIds
      .slice(0, 4)
      .map(id => getVegetableById(id)?.name)
      .filter(Boolean)

    return { lastYear: previousYearRotation, suggested, lastDisplay, nextDisplay, suggestedVegNames }
  }, [previousYearRotation, bed.status])

  return (
    <div className="zen-card p-6 sticky top-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-zen-lg flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: BED_COLORS[bedId] }}
        >
          {bedId.replace('-prime', "'")}
        </div>
        <div>
          <h3 className="font-display text-zen-ink-800">{bed.name}</h3>
          <div className={`text-xs flex items-center gap-1 ${
            bed.status === 'perennial' ? 'text-zen-sakura-600' : 'text-zen-moss-600'
          }`}>
            {bed.status === 'perennial' && <Leaf className="w-3 h-3" />}
            {bed.status === 'perennial' ? 'Perennial' : bedSeason?.rotationGroup || 'Rotation'}
          </div>
        </div>
      </div>

      {/* Rotation Type Selector */}
      <div className="mb-4">
        <label htmlFor="rotation-type" className="block text-xs font-medium text-zen-stone-500 mb-1">
          Rotation Type
        </label>
        <select
          id="rotation-type"
          value={bedSeason?.rotationGroup || ''}
          onChange={(e) => onUpdateRotation(e.target.value as RotationGroup)}
          className="zen-select text-sm"
        >
          <option value="">Not specified</option>
          <option value="legumes">Legumes</option>
          <option value="brassicas">Brassicas</option>
          <option value="roots">Roots</option>
          <option value="solanaceae">Solanaceae</option>
          <option value="alliums">Alliums</option>
          <option value="cucurbits">Cucurbits</option>
          <option value="permanent">Permanent</option>
        </select>
      </div>

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
      <p className="text-sm text-zen-stone-600 mb-4">{bed.description}</p>

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
                className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-water-100 text-zen-water-700 rounded-zen hover:bg-zen-water-200 transition"
                title={`Rotate from ${ROTATION_GROUP_DISPLAY[autoRotateInfo.previousGroup]?.name} to ${ROTATION_GROUP_DISPLAY[autoRotateInfo.suggestedGroup]?.name}`}
              >
                <ArrowRight className="w-3 h-3" />
                Auto-rotate
              </button>
            )}
            <button
              onClick={onAddPlanting}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-moss-100 text-zen-moss-700 rounded-zen hover:bg-zen-moss-200 transition"
            >
              <Plus className="w-3 h-3" />
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
                onDelete={() => onDeletePlanting(p.id)}
                onUpdateSuccess={(success) => onUpdateSuccess(p.id, success)}
                otherPlantings={plantings}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-zen-stone-400 italic">
            No plantings recorded. Click Add to start planning.
          </div>
        )}
      </div>
    </div>
  )
}
