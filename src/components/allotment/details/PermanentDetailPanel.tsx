'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TreeDeciduous, Calendar, Leaf, ExternalLink, Scissors, Droplets, Layers, Pencil, TrendingUp, Trash2, Apple, Info } from 'lucide-react'
import { Area, AreaKind, Planting, CareLogEntry, NewCareLogEntry, NewPlanting } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import { getPerennialStatusFromPlant, getStatusLabel, getStatusColorClasses } from '@/lib/perennial-calculator'
import Tabs, { Tab } from '@/components/ui/Tabs'
import CareLogSection from './CareLogSection'
import HarvestTracker from './HarvestTracker'
import UnderplantingsList from './UnderplantingsList'
import EditAreaForm from '@/components/allotment/EditAreaForm'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'

interface PermanentDetailPanelProps {
  area: Area
  selectedYear: number
  plantings: Planting[]
  careLogs: CareLogEntry[]
  harvestTotal: { quantity: number; unit: string } | null
  onAddPlanting: (areaId: string, planting: NewPlanting) => void
  onRemovePlanting: (areaId: string, plantingId: string) => void
  onAddCareLog: (areaId: string, entry: NewCareLogEntry) => void
  onRemoveCareLog: (areaId: string, entryId: string) => void
  onLogHarvest: (areaId: string, quantity: number, unit: string, date: string) => void
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  onArchiveArea: (areaId: string) => void
}

// Map v10 area.kind to display config
const KIND_CONFIG: Partial<Record<AreaKind, { icon: typeof TreeDeciduous; label: string; color: string }>> = {
  'tree': { icon: TreeDeciduous, label: 'Fruit Tree', color: 'zen-moss' },
  'berry': { icon: Leaf, label: 'Berry', color: 'zen-sakura' },
  'perennial-bed': { icon: Leaf, label: 'Perennial Vegetable', color: 'zen-water' },
  'herb': { icon: Leaf, label: 'Herb', color: 'zen-kitsune' },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// --- Private helper components for tab content ---

interface PerennialStatusCardProps {
  status: ReturnType<typeof getPerennialStatusFromPlant>
}

function PerennialStatusCard({ status }: PerennialStatusCardProps) {
  if (!status) return null
  return (
    <div className={`rounded-zen p-4 ${getStatusColorClasses(status.status).replace('text-', 'border-').replace('-700', '-200')} border`}>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4" />
        <span className={`text-sm font-medium ${getStatusColorClasses(status.status).split(' ')[1]}`}>
          {getStatusLabel(status.status)}
        </span>
      </div>
      <p className="text-sm text-zen-stone-600">{status.description}</p>

      {status.establishmentProgress !== undefined && status.status === 'establishing' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-zen-stone-500 mb-1">
            <span>Establishment progress</span>
            <span>{status.establishmentProgress}%</span>
          </div>
          <div className="h-2 bg-zen-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zen-water-500 transition-all duration-300"
              style={{ width: `${status.establishmentProgress}%` }}
            />
          </div>
          {status.expectedFirstHarvestYear && (
            <p className="text-xs text-zen-stone-500 mt-1">
              First harvest expected: {status.expectedFirstHarvestYear.min}-{status.expectedFirstHarvestYear.max}
            </p>
          )}
        </div>
      )}

      {status.replacementWarning && (
        <div className="mt-3 p-2 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen">
          <p className="text-xs text-zen-kitsune-700">{status.replacementWarning}</p>
        </div>
      )}

      {status.expectedDeclineYear && status.status === 'productive' && !status.needsReplacement && (
        <p className="text-xs text-zen-stone-500 mt-2">
          Expected to remain productive until ~{status.expectedDeclineYear}
        </p>
      )}
    </div>
  )
}

interface MonthlyMaintenanceAlertProps {
  monthName: string
  maintenance: { prune?: boolean; feed?: boolean; mulch?: boolean } | null
}

function MonthlyMaintenanceAlert({ monthName, maintenance }: MonthlyMaintenanceAlertProps) {
  const hasTask = maintenance?.prune || maintenance?.feed || maintenance?.mulch
  if (hasTask) {
    return (
      <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-zen-kitsune-600" />
          <span className="text-sm font-medium text-zen-kitsune-700">{monthName} Tasks</span>
        </div>
        <div className="space-y-2">
          {maintenance?.prune && (
            <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
              <Scissors className="w-4 h-4" />
              <span>Prune this month</span>
            </div>
          )}
          {maintenance?.feed && (
            <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
              <Droplets className="w-4 h-4" />
              <span>Feed this month</span>
            </div>
          )}
          {maintenance?.mulch && (
            <div className="flex items-center gap-2 text-sm text-zen-kitsune-800">
              <Layers className="w-4 h-4" />
              <span>Mulch this month</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-zen-moss-50 border border-zen-moss-200 rounded-zen p-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-zen-moss-600" />
        <span className="text-sm font-medium text-zen-moss-700">{monthName}</span>
      </div>
      <p className="text-sm text-zen-moss-800">
        No specific maintenance tasks this month.
      </p>
    </div>
  )
}

interface CareScheduleProps {
  maintenance: NonNullable<ReturnType<typeof getVegetableById>>['maintenance']
}

function CareSchedule({ maintenance }: CareScheduleProps) {
  if (!maintenance) return null
  return (
    <div className="bg-zen-stone-50 rounded-zen p-3">
      <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Annual Care Schedule</h4>
      <div className="space-y-2 text-sm">
        {maintenance.pruneMonths && maintenance.pruneMonths.length > 0 && (
          <div className="flex items-start gap-2">
            <Scissors className="w-4 h-4 text-zen-sakura-500 mt-0.5" />
            <div>
              <span className="text-zen-stone-500">Prune:</span>
              <span className="ml-1 text-zen-stone-700">
                {maintenance.pruneMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
              </span>
            </div>
          </div>
        )}
        {maintenance.feedMonths && maintenance.feedMonths.length > 0 && (
          <div className="flex items-start gap-2">
            <Droplets className="w-4 h-4 text-zen-water-500 mt-0.5" />
            <div>
              <span className="text-zen-stone-500">Feed:</span>
              <span className="ml-1 text-zen-stone-700">
                {maintenance.feedMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
              </span>
            </div>
          </div>
        )}
        {maintenance.mulchMonths && maintenance.mulchMonths.length > 0 && (
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-zen-kitsune-500 mt-0.5" />
            <div>
              <span className="text-zen-stone-500">Mulch:</span>
              <span className="ml-1 text-zen-stone-700">
                {maintenance.mulchMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
              </span>
            </div>
          </div>
        )}
        {maintenance.notes && maintenance.notes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zen-stone-200">
            <ul className="space-y-1">
              {maintenance.notes.map((note, i) => (
                <li key={i} className="text-zen-stone-600 text-xs">• {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

interface GrowingConditionsProps {
  care: NonNullable<ReturnType<typeof getVegetableById>>['care']
}

function GrowingConditions({ care }: GrowingConditionsProps) {
  if (!care) return null
  return (
    <div className="bg-zen-stone-50 rounded-zen p-3">
      <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Growing Conditions</h4>
      <div className="space-y-1 text-sm text-zen-stone-600">
        <div className="flex items-start gap-2">
          <span className="text-zen-water-500">Water:</span>
          <span>{care.water}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-zen-moss-500">Sun:</span>
          <span>{care.sun}</span>
        </div>
        {care.tips.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zen-stone-200">
            <span className="text-zen-stone-500 text-xs">Tips:</span>
            <ul className="mt-1 space-y-1">
              {care.tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="text-zen-stone-600 text-xs">• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main component ---

export default function PermanentDetailPanel({
  area, selectedYear, plantings, careLogs, harvestTotal,
  onAddPlanting, onRemovePlanting, onAddCareLog, onRemoveCareLog, onLogHarvest,
  onUpdateArea, onArchiveArea,
}: PermanentDetailPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const config = KIND_CONFIG[area.kind] || { icon: Leaf, label: 'Area', color: 'zen-stone' }
  const Icon = config.icon

  // Get vegetable data if primaryPlant.plantId is set
  const vegetableData = useMemo(() => {
    if (!area.primaryPlant?.plantId) return null
    return getVegetableById(area.primaryPlant.plantId)
  }, [area.primaryPlant?.plantId])

  // Get current month (1-12) — always real month for maintenance alerts
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

  // Calculate perennial lifecycle status using selected year
  const perennialStatus = useMemo(() => {
    if (!area.primaryPlant || !vegetableData?.perennialInfo) return null
    return getPerennialStatusFromPlant(area.primaryPlant, vegetableData.perennialInfo, selectedYear)
  }, [area.primaryPlant, vegetableData?.perennialInfo, selectedYear])

  const handleEditSubmit = (areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    onUpdateArea(areaId, updates)
    setIsEditMode(false)
  }

  // Compute harvest log count from care logs
  const harvestLogCount = careLogs.filter(l => l.type === 'harvest').length

  // Build tab definitions — icon-only with tooltip titles
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Info className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {area.description && (
            <p className="text-sm text-zen-stone-600">{area.description}</p>
          )}
          {area.primaryPlant?.plantedYear && (
            <div className="flex items-center gap-2 text-sm text-zen-stone-500">
              <Calendar className="w-4 h-4" />
              <span>Planted in {area.primaryPlant.plantedYear}</span>
            </div>
          )}
          <PerennialStatusCard status={perennialStatus} />
          <MonthlyMaintenanceAlert monthName={monthName} maintenance={maintenanceThisMonth} />
        </div>
      ),
    },
    {
      id: 'care',
      label: 'Harvest & Care',
      icon: <Apple className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <HarvestTracker
            selectedYear={selectedYear}
            harvestTotal={harvestTotal}
            harvestLogCount={harvestLogCount}
            onLogHarvest={(qty, unit, date) => onLogHarvest(area.id, qty, unit, date)}
          />
          <CareLogSection
            selectedYear={selectedYear}
            careLogs={careLogs}
            onAddCareLog={(entry) => onAddCareLog(area.id, entry)}
            onRemoveCareLog={(entryId) => onRemoveCareLog(area.id, entryId)}
          />
          <UnderplantingsList
            parentAreaName={area.name}
            selectedYear={selectedYear}
            plantings={plantings}
            onAddPlanting={(planting) => onAddPlanting(area.id, planting)}
            onRemovePlanting={(plantingId) => onRemovePlanting(area.id, plantingId)}
          />
        </div>
      ),
    },
    {
      id: 'plant-info',
      label: 'Plant Info',
      icon: <Leaf className="w-4 h-4" />,
      content: vegetableData ? (
        <div className="space-y-3">
          <CareSchedule maintenance={vegetableData.maintenance} />
          <GrowingConditions care={vegetableData.care} />
          {vegetableData.planting?.harvestMonths && vegetableData.planting.harvestMonths.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-zen-stone-600">
              <span className="text-zen-kitsune-500">Harvest:</span>
              <span>{vegetableData.planting.harvestMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}</span>
            </div>
          )}
          <Link
            href="/this-month"
            className="flex items-center gap-2 text-sm text-zen-moss-600 hover:text-zen-moss-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
            View full monthly care guide
          </Link>
        </div>
      ) : (
        <div className="text-sm text-zen-stone-400 italic">
          No detailed care information available for this planting.
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="zen-card p-6 sticky top-20">
        {/* Header — always visible above tabs */}
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
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2 text-zen-stone-500 hover:text-zen-moss-600 hover:bg-zen-moss-50 rounded-zen transition"
            title="Edit area details"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Tabbed content */}
        <Tabs tabs={tabs} defaultTab="overview" contentClassName="pt-6" iconOnly />

        {/* Remove Area — always visible below tabs */}
        <div className="mt-6 pt-4 border-t border-zen-stone-100">
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center gap-2 text-sm text-zen-kitsune-600 hover:text-zen-kitsune-700 transition"
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
