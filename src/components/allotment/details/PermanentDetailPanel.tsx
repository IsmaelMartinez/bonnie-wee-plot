'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TreeDeciduous, Calendar, Leaf, ExternalLink, Scissors, Droplets, Layers, Pencil } from 'lucide-react'
import { Area, AreaKind } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import CareLogSection from './CareLogSection'
import HarvestTracker from './HarvestTracker'
import UnderplantingsList from './UnderplantingsList'
import EditAreaForm from '@/components/allotment/EditAreaForm'
import AreaTypeConverter from '@/components/allotment/details/AreaTypeConverter'
import Dialog from '@/components/ui/Dialog'

interface PermanentDetailPanelProps {
  area: Area
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  onAreaTypeConvert?: () => void
}

// Map v10 area.kind to display config
const KIND_CONFIG: Partial<Record<AreaKind, { icon: typeof TreeDeciduous; label: string; color: string }>> = {
  'tree': { icon: TreeDeciduous, label: 'Fruit Tree', color: 'zen-moss' },
  'berry': { icon: Leaf, label: 'Berry', color: 'zen-sakura' },
  'perennial-bed': { icon: Leaf, label: 'Perennial Vegetable', color: 'zen-water' },
  'herb': { icon: Leaf, label: 'Herb', color: 'zen-kitsune' },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PermanentDetailPanel({ area, onUpdateArea, onAreaTypeConvert }: PermanentDetailPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const config = KIND_CONFIG[area.kind] || { icon: Leaf, label: 'Area', color: 'zen-stone' }
  const Icon = config.icon

  // Get vegetable data if primaryPlant.plantId is set
  const vegetableData = useMemo(() => {
    if (!area.primaryPlant?.plantId) return null
    return getVegetableById(area.primaryPlant.plantId)
  }, [area.primaryPlant?.plantId])

  // Get current month (1-12)
  const currentMonth = new Date().getMonth() + 1
  const monthName = new Date().toLocaleString('en-GB', { month: 'long' })

  // Check if any maintenance is due this month
  const maintenanceThisMonth = useMemo(() => {
    if (!vegetableData?.maintenance) return null
    const m = vegetableData.maintenance
    return {
      prune: m.pruneMonths?.includes(currentMonth as 1|2|3|4|5|6|7|8|9|10|11|12),
      feed: m.feedMonths?.includes(currentMonth as 1|2|3|4|5|6|7|8|9|10|11|12),
      mulch: m.mulchMonths?.includes(currentMonth as 1|2|3|4|5|6|7|8|9|10|11|12),
    }
  }, [vegetableData, currentMonth])

  const handleEditSubmit = (areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    onUpdateArea(areaId, updates)
    setIsEditMode(false)
  }

  return (
    <>
      <div className="zen-card p-6 sticky top-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-zen-lg flex items-center justify-center bg-${config.color}-100`}>
            <Icon className={`w-6 h-6 text-${config.color}-600`} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-zen-ink-800">{area.name}</h3>
            <div className={`text-xs text-${config.color}-600 flex items-center gap-1`}>
              {config.label}
              {area.primaryPlant?.variety && <span className="text-zen-stone-400">- {area.primaryPlant.variety}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AreaTypeConverter
              areaId={area.id}
              currentKind={area.kind}
              onConvert={() => {
                setIsEditMode(false)
                onAreaTypeConvert?.()
              }}
            />
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 text-zen-stone-500 hover:text-zen-moss-600 hover:bg-zen-moss-50 rounded-zen transition"
              title="Edit area details"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Description/Notes */}
      {area.description && (
        <p className="text-sm text-zen-stone-600 mb-4">{area.description}</p>
      )}

      {/* Planted Year */}
      {area.primaryPlant?.plantedYear && (
        <div className="flex items-center gap-2 text-sm text-zen-stone-500 mb-4">
          <Calendar className="w-4 h-4" />
          <span>Planted in {area.primaryPlant.plantedYear}</span>
        </div>
      )}

      {/* Monthly Care Section */}
      {vegetableData?.maintenance && (maintenanceThisMonth?.prune || maintenanceThisMonth?.feed || maintenanceThisMonth?.mulch) ? (
        <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zen-kitsune-600" />
            <span className="text-sm font-medium text-zen-kitsune-700">{monthName} Tasks</span>
          </div>
          <div className="space-y-2">
            {maintenanceThisMonth?.prune && (
              <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
                <Scissors className="w-4 h-4" />
                <span>Prune this month</span>
              </div>
            )}
            {maintenanceThisMonth?.feed && (
              <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
                <Droplets className="w-4 h-4" />
                <span>Feed this month</span>
              </div>
            )}
            {maintenanceThisMonth?.mulch && (
              <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
                <Layers className="w-4 h-4" />
                <span>Mulch this month</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zen-moss-50 border border-zen-moss-200 rounded-zen p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zen-moss-600" />
            <span className="text-sm font-medium text-zen-moss-700">{monthName}</span>
          </div>
          <p className="text-sm text-zen-moss-800">
            No specific maintenance tasks this month.
          </p>
        </div>
      )}

      {/* Care Logging Section */}
      <div className="space-y-3 mb-4">
        <HarvestTracker areaId={area.id} />
        <CareLogSection areaId={area.id} />
        <UnderplantingsList parentAreaId={area.id} parentAreaName={area.name} />
      </div>

      {/* Vegetable Info */}
      {vegetableData && (
        <div className="space-y-3">
          {/* Maintenance Schedule */}
          {vegetableData.maintenance && (
            <div className="bg-zen-stone-50 rounded-zen p-3">
              <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Annual Care Schedule</h4>
              <div className="space-y-2 text-sm">
                {vegetableData.maintenance.pruneMonths && vegetableData.maintenance.pruneMonths.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Scissors className="w-4 h-4 text-zen-sakura-500 mt-0.5" />
                    <div>
                      <span className="text-zen-stone-500">Prune:</span>
                      <span className="ml-1 text-zen-stone-700">
                        {vegetableData.maintenance.pruneMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {vegetableData.maintenance.feedMonths && vegetableData.maintenance.feedMonths.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Droplets className="w-4 h-4 text-zen-water-500 mt-0.5" />
                    <div>
                      <span className="text-zen-stone-500">Feed:</span>
                      <span className="ml-1 text-zen-stone-700">
                        {vegetableData.maintenance.feedMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {vegetableData.maintenance.mulchMonths && vegetableData.maintenance.mulchMonths.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-zen-kitsune-500 mt-0.5" />
                    <div>
                      <span className="text-zen-stone-500">Mulch:</span>
                      <span className="ml-1 text-zen-stone-700">
                        {vegetableData.maintenance.mulchMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {vegetableData.maintenance.notes && vegetableData.maintenance.notes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zen-stone-200">
                    <ul className="space-y-1">
                      {vegetableData.maintenance.notes.map((note, i) => (
                        <li key={i} className="text-zen-stone-600 text-xs">• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Care Info */}
          {vegetableData.care && (
            <div className="bg-zen-stone-50 rounded-zen p-3">
              <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Growing Conditions</h4>
              <div className="space-y-1 text-sm text-zen-stone-600">
                <div className="flex items-start gap-2">
                  <span className="text-zen-water-500">Water:</span>
                  <span>{vegetableData.care.water}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-zen-moss-500">Sun:</span>
                  <span>{vegetableData.care.sun}</span>
                </div>
                {vegetableData.care.tips.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zen-stone-200">
                    <span className="text-zen-stone-500 text-xs">Tips:</span>
                    <ul className="mt-1 space-y-1">
                      {vegetableData.care.tips.slice(0, 3).map((tip, i) => (
                        <li key={i} className="text-zen-stone-600 text-xs">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Harvest info */}
          {vegetableData.planting?.harvestMonths && vegetableData.planting.harvestMonths.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-zen-stone-600">
              <span className="text-zen-kitsune-500">🍎 Harvest:</span>
              <span>{vegetableData.planting.harvestMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}</span>
            </div>
          )}

          {/* Link to full care page */}
          <Link
            href="/this-month"
            className="flex items-center gap-2 text-sm text-zen-moss-600 hover:text-zen-moss-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
            View full monthly care guide
          </Link>
        </div>
      )}

      {/* No vegetable data linked */}
      {!vegetableData && (
        <div className="text-sm text-zen-stone-400 italic">
          No detailed care information available for this planting.
        </div>
      )}
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
  </>
  )
}
