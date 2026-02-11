'use client'

import { Map } from 'lucide-react'
import { AllotmentItemRef, RotationGroup } from '@/types/garden-planner'
import { Planting, PlantingUpdate, Area, AreaSeason, AreaNote, NewAreaNote, AreaNoteUpdate, NewPlanting, CareLogEntry, NewCareLogEntry } from '@/types/unified-allotment'
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
  // Care log / harvest getters (for permanent panels)
  getCareLogs: (areaId: string) => CareLogEntry[]
  getHarvestTotal: (areaId: string) => { quantity: number; unit: string } | null
  // Event handlers
  selectedYear: number
  onAddPlanting: () => void
  onAddPlantingToArea: (areaId: string, planting: NewPlanting) => void
  onDeletePlanting: (plantingId: string) => void
  onRemovePlantingFromArea: (areaId: string, plantingId: string) => void
  onUpdatePlanting: (plantingId: string, updates: PlantingUpdate) => void
  onAddNote: (note: NewAreaNote) => void
  onUpdateNote: (noteId: string, updates: AreaNoteUpdate) => void
  onRemoveNote: (noteId: string) => void
  onUpdateRotation: (group: RotationGroup) => void
  onAutoRotate: () => void
  onArchiveArea: (areaId: string) => void
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  onAddCareLog: (areaId: string, entry: NewCareLogEntry) => void
  onRemoveCareLog: (areaId: string, entryId: string) => void
  onLogHarvest: (areaId: string, quantity: number, unit: string, date: string) => void
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
  getCareLogs,
  getHarvestTotal,
  selectedYear,
  onAddPlanting,
  onAddPlantingToArea,
  onDeletePlanting,
  onRemovePlantingFromArea,
  onUpdatePlanting,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onUpdateRotation,
  onAutoRotate,
  onArchiveArea,
  onUpdateArea,
  onAddCareLog,
  onRemoveCareLog,
  onLogHarvest,
  quickStats,
}: ItemDetailSwitcherProps) {
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
        key={`${area.id}-${area.kind}`}
        area={area}
        areaSeason={getAreaSeason(area.id) || null}
        plantings={getPlantings(area.id)}
        notes={getAreaNotes(area.id)}
        selectedYear={selectedYear}
        previousYearRotation={getPreviousYearRotation(area.id)}
        onAddPlanting={onAddPlanting}
        onDeletePlanting={onDeletePlanting}
        onUpdatePlanting={onUpdatePlanting}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onRemoveNote={onRemoveNote}
        onUpdateRotation={onUpdateRotation}
        onAutoRotate={onAutoRotate}
        onUpdateArea={onUpdateArea}
        onArchiveArea={onArchiveArea}
      />
    )
  } else if (isPermanentPlanting) {
    detailPanel = (
      <PermanentDetailPanel
        key={`${area.id}-${area.kind}`}
        area={area}
        selectedYear={selectedYear}
        plantings={getPlantings(area.id)}
        careLogs={getCareLogs(area.id)}
        harvestTotal={getHarvestTotal(area.id)}
        onAddPlanting={onAddPlantingToArea}
        onRemovePlanting={onRemovePlantingFromArea}
        onAddCareLog={onAddCareLog}
        onRemoveCareLog={onRemoveCareLog}
        onLogHarvest={onLogHarvest}
        onUpdateArea={onUpdateArea}
        onArchiveArea={onArchiveArea}
      />
    )
  } else if (isInfrastructure) {
    detailPanel = <InfrastructureDetailPanel key={`${area.id}-${area.kind}`} area={area} onUpdateArea={onUpdateArea} onArchiveArea={onArchiveArea} />
  } else {
    return <EmptyState stats={quickStats} />
  }

  return detailPanel
}
