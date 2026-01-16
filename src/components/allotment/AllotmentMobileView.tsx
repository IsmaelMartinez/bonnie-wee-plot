'use client'

import { useId } from 'react'
import { Area, Planting } from '@/types/unified-allotment'
import { AllotmentItemRef } from '@/types/garden-planner'
import { GridItemConfig } from '@/data/allotment-layout'
import BedItem from './BedItem'

interface AllotmentMobileViewProps {
  areas: Area[]
  selectedItemRef?: AllotmentItemRef | null
  onItemSelect?: (ref: AllotmentItemRef | null) => void
  getPlantingsForBed?: (bedId: string) => Planting[]
  selectedYear: number
}

// Convert Area to GridItemConfig for rendering with BedItem
function areaToGridConfig(area: Area): GridItemConfig {
  let type: GridItemConfig['type'] = 'area'
  if (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') {
    type = 'bed'
  } else if (area.kind === 'tree') {
    type = 'tree'
  } else if (area.kind === 'berry' || area.kind === 'herb') {
    type = 'perennial'
  } else if (area.kind === 'infrastructure') {
    type = 'infrastructure'
  }

  return {
    i: area.id,
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    label: area.name,
    type,
    icon: area.icon,
    color: area.color,
    bedId: (area.kind === 'rotation-bed' || area.kind === 'perennial-bed' || area.kind === 'berry')
      ? area.id as GridItemConfig['bedId']
      : undefined,
  }
}

export default function AllotmentMobileView({
  areas,
  selectedItemRef,
  onItemSelect,
  getPlantingsForBed,
  selectedYear
}: AllotmentMobileViewProps) {
  // Generate unique IDs for aria-labelledby associations
  const baseId = useId()

  // Group areas by type
  const rotationBeds = areas.filter(a => a.kind === 'rotation-bed')
  const perennialBeds = areas.filter(a => a.kind === 'perennial-bed')
  const trees = areas.filter(a => a.kind === 'tree')
  const berries = areas.filter(a => a.kind === 'berry')
  const herbs = areas.filter(a => a.kind === 'herb')
  const infrastructure = areas.filter(a => a.kind === 'infrastructure')
  const other = areas.filter(a => a.kind === 'other')

  const handleItemClick = (area: Area) => {
    if (!onItemSelect) return

    if (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') {
      onItemSelect({ type: 'bed', id: area.id })
    } else if (area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb') {
      onItemSelect({ type: 'permanent', id: area.id })
    } else if (area.kind === 'infrastructure') {
      onItemSelect({ type: 'infrastructure', id: area.id })
    } else {
      onItemSelect({ type: 'bed', id: area.id })
    }
  }

  const renderAreaGroup = (title: string, areaList: Area[], emoji: string, groupKey: string) => {
    if (areaList.length === 0) return null

    const headingId = `${baseId}-${groupKey}-heading`

    return (
      <section key={title} className="space-y-2" aria-labelledby={headingId}>
        <h3 id={headingId} className="text-sm font-medium text-zen-ink-700 flex items-center gap-2">
          <span aria-hidden="true">{emoji}</span>
          <span>{title}</span>
          <span className="text-zen-stone-400">({areaList.length})</span>
        </h3>
        <ul className="grid grid-cols-2 gap-2" role="list">
          {areaList.map(area => {
            const item = areaToGridConfig(area)
            const plantings = getPlantingsForBed ? getPlantingsForBed(area.id) : []
            const isSelected = selectedItemRef?.id === area.id
            const plantingsCount = plantings.length
            const plantingsSummary = plantingsCount > 0
              ? `. ${plantingsCount} planting${plantingsCount > 1 ? 's' : ''}`
              : ''
            const ariaLabel = `${area.name}${plantingsSummary}${isSelected ? '. Currently selected' : ''}`

            return (
              <li key={area.id}>
                <button
                  onClick={() => handleItemClick(area)}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  className="w-full h-24 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg"
                >
                  <BedItem
                    item={item}
                    isSelected={isSelected}
                    isEditing={false}
                    plantings={plantings}
                    area={area}
                    selectedYear={selectedYear}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className="space-y-6" role="region" aria-label={`Mobile view of allotment areas for ${selectedYear}`}>
      <div className="text-sm text-zen-stone-600 bg-zen-water-50 border border-zen-water-200 rounded-lg p-3" role="note">
        <p className="font-medium text-zen-water-800 mb-1">Mobile View</p>
        <p className="text-xs">Tap any area to view and manage its details. Grid editing is only available on larger screens.</p>
      </div>

      <div className="space-y-6">
        {renderAreaGroup('Rotation Beds', rotationBeds, '🌱', 'rotation')}
        {renderAreaGroup('Perennial Beds', perennialBeds, '🌿', 'perennial')}
        {renderAreaGroup('Trees', trees, '🌳', 'trees')}
        {renderAreaGroup('Berries', berries, '🫐', 'berries')}
        {renderAreaGroup('Herbs', herbs, '🌿', 'herbs')}
        {renderAreaGroup('Infrastructure', infrastructure, '🏗️', 'infra')}
        {renderAreaGroup('Other', other, '📦', 'other')}
      </div>

      {areas.length === 0 && (
        <div className="text-center text-zen-stone-500 py-8" role="status">
          <p>No areas to display for {selectedYear}</p>
        </div>
      )}
    </div>
  )
}
