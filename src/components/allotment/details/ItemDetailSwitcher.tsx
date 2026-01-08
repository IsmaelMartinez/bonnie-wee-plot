'use client'

import { Map } from 'lucide-react'
import { AllotmentItemRef, PhysicalBedId, RotationGroup } from '@/types/garden-planner'
import { Planting, BedSeason, BedNote, NewBedNote, BedNoteUpdate, BedArea, PermanentArea, InfrastructureArea } from '@/types/unified-allotment'
import BedDetailPanel from './BedDetailPanel'
import PermanentDetailPanel from './PermanentDetailPanel'
import InfrastructureDetailPanel from './InfrastructureDetailPanel'

interface QuickStats {
  rotationBeds: number
  perennialBeds: number
  permanentPlantings: number
}

interface ItemDetailSwitcherProps {
  selectedItemRef: AllotmentItemRef | null
  // Data getters - using Area types
  getBedArea: (bedId: string) => BedArea | undefined
  getBedSeason: (bedId: PhysicalBedId) => BedSeason | undefined
  getPlantings: (bedId: PhysicalBedId) => Planting[]
  getBedNotes: (bedId: PhysicalBedId) => BedNote[]
  getPermanentArea: (id: string) => PermanentArea | undefined
  getInfrastructureArea: (id: string) => InfrastructureArea | undefined
  getPreviousYearRotation: (bedId: PhysicalBedId) => RotationGroup | null
  // Event handlers for beds
  selectedYear: number
  onAddPlanting: () => void
  onDeletePlanting: (plantingId: string) => void
  onUpdateSuccess: (plantingId: string, success: Planting['success']) => void
  onAddNote: (note: NewBedNote) => void
  onUpdateNote: (noteId: string, updates: BedNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
  // Quick stats for empty state
  quickStats: QuickStats
}

function EmptyState({ stats }: { stats: QuickStats }) {
  return (
    <div className="zen-card p-6 sticky top-20">
      <div className="text-center text-zen-stone-400">
        <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium text-zen-ink-600">Select an item</p>
        <p className="text-sm">Click on any bed, tree, or area in the layout to see its details</p>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-zen-stone-100">
        <h4 className="font-medium text-zen-ink-700 mb-3">Quick Stats</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zen-moss-50 rounded-zen p-3 text-center">
            <div className="text-2xl font-bold text-zen-moss-600">{stats.rotationBeds}</div>
            <div className="text-xs text-zen-moss-700">Rotation Beds</div>
          </div>
          <div className="bg-zen-sakura-50 rounded-zen p-3 text-center">
            <div className="text-2xl font-bold text-zen-sakura-600">{stats.perennialBeds}</div>
            <div className="text-xs text-zen-sakura-700">Perennials</div>
          </div>
          <div className="bg-zen-kitsune-50 rounded-zen p-3 text-center">
            <div className="text-2xl font-bold text-zen-kitsune-600">{stats.permanentPlantings}</div>
            <div className="text-xs text-zen-kitsune-700">Permanent</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ItemDetailSwitcher({
  selectedItemRef,
  getBedArea,
  getBedSeason,
  getPlantings,
  getBedNotes,
  getPermanentArea,
  getInfrastructureArea,
  getPreviousYearRotation,
  selectedYear,
  onAddPlanting,
  onDeletePlanting,
  onUpdateSuccess,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onUpdateRotation,
  onAutoRotate,
  quickStats,
}: ItemDetailSwitcherProps) {
  if (!selectedItemRef) {
    return <EmptyState stats={quickStats} />
  }

  // Bed detail panel
  if (selectedItemRef.type === 'bed') {
    const bedId = selectedItemRef.id as PhysicalBedId
    const bed = getBedArea(bedId)
    if (!bed) return <EmptyState stats={quickStats} />

    return (
      <BedDetailPanel
        bed={bed}
        bedId={bedId}
        bedSeason={getBedSeason(bedId) || null}
        plantings={getPlantings(bedId)}
        notes={getBedNotes(bedId)}
        selectedYear={selectedYear}
        previousYearRotation={getPreviousYearRotation(bedId)}
        onAddPlanting={onAddPlanting}
        onDeletePlanting={onDeletePlanting}
        onUpdateSuccess={onUpdateSuccess}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onRemoveNote={onRemoveNote}
        onUpdateRotation={onUpdateRotation}
        onAutoRotate={onAutoRotate}
      />
    )
  }

  // Permanent planting detail panel
  if (selectedItemRef.type === 'permanent') {
    const planting = getPermanentArea(selectedItemRef.id)
    if (!planting) return <EmptyState stats={quickStats} />

    return <PermanentDetailPanel planting={planting} />
  }

  // Infrastructure detail panel
  if (selectedItemRef.type === 'infrastructure') {
    const item = getInfrastructureArea(selectedItemRef.id)
    if (!item) return <EmptyState stats={quickStats} />

    return <InfrastructureDetailPanel item={item} />
  }

  return <EmptyState stats={quickStats} />
}
