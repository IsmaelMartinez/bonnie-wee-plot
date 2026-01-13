'use client'

import { useState } from 'react'
import { Map, Trash2 } from 'lucide-react'
import { AllotmentItemRef, RotationGroup } from '@/types/garden-planner'
import { Planting, Area, AreaSeason, AreaNote, NewAreaNote, AreaNoteUpdate } from '@/types/unified-allotment'
import { ConfirmDialog } from '@/components/ui/Dialog'
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
  // v10 unified getters
  getArea: (id: string) => Area | undefined
  getAreaSeason: (areaId: string) => AreaSeason | undefined
  getPlantings: (areaId: string) => Planting[]
  getAreaNotes: (areaId: string) => AreaNote[]
  getPreviousYearRotation: (areaId: string) => RotationGroup | null
  // Event handlers
  selectedYear: number
  onAddPlanting: () => void
  onDeletePlanting: (plantingId: string) => void
  onUpdateSuccess: (plantingId: string, success: Planting['success']) => void
  onAddNote: (note: NewAreaNote) => void
  onUpdateNote: (noteId: string, updates: AreaNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
  onArchiveArea: (areaId: string) => void
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
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
  getArea,
  getAreaSeason,
  getPlantings,
  getAreaNotes,
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
  onArchiveArea,
  onUpdateArea,
  quickStats,
}: ItemDetailSwitcherProps) {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  if (!selectedItemRef) {
    return <EmptyState stats={quickStats} />
  }

  // Get the area by ID
  const area = getArea(selectedItemRef.id)
  if (!area) return <EmptyState stats={quickStats} />

  // Route based on area.kind
  const isRotationOrPerennialBed = area.kind === 'rotation-bed' || area.kind === 'perennial-bed'
  const isPermanentPlanting = area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb'
  const isInfrastructure = area.kind === 'infrastructure'

  // Determine which detail panel to render
  let detailPanel: React.ReactNode = null

  if (isRotationOrPerennialBed) {
    detailPanel = (
      <BedDetailPanel
        area={area}
        areaSeason={getAreaSeason(area.id) || null}
        plantings={getPlantings(area.id)}
        notes={getAreaNotes(area.id)}
        selectedYear={selectedYear}
        previousYearRotation={getPreviousYearRotation(area.id)}
        onAddPlanting={onAddPlanting}
        onDeletePlanting={onDeletePlanting}
        onUpdateSuccess={onUpdateSuccess}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onRemoveNote={onRemoveNote}
        onUpdateRotation={onUpdateRotation}
        onAutoRotate={onAutoRotate}
        onUpdateArea={onUpdateArea}
      />
    )
  } else if (isPermanentPlanting) {
    detailPanel = <PermanentDetailPanel area={area} onUpdateArea={onUpdateArea} />
  } else if (isInfrastructure) {
    detailPanel = <InfrastructureDetailPanel area={area} onUpdateArea={onUpdateArea} />
  } else {
    return <EmptyState stats={quickStats} />
  }

  const handleArchiveConfirm = () => {
    onArchiveArea(area.id)
    setShowArchiveConfirm(false)
  }

  return (
    <div className="space-y-4">
      {detailPanel}

      {/* Archive/Delete Section */}
      <div className="zen-card p-4">
        <button
          onClick={() => setShowArchiveConfirm(true)}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove this area</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchiveConfirm}
        title="Remove Area"
        message={`Are you sure you want to remove "${area.name}"? This will archive the area and hide it from the layout. Historical data will be preserved.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}
