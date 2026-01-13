'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Warehouse, Droplets, ExternalLink, Recycle, Footprints, HelpCircle, Flower2, Fish, Bird, Pencil } from 'lucide-react'
import { Area, InfrastructureSubtype } from '@/types/unified-allotment'
import { useCompost } from '@/hooks/useCompost'
import EditAreaForm from '@/components/allotment/EditAreaForm'
import Dialog from '@/components/ui/Dialog'

interface InfrastructureDetailPanelProps {
  area: Area
  onUpdateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
}

const SUBTYPE_CONFIG: Record<InfrastructureSubtype, { icon: typeof Warehouse; label: string; color: string }> = {
  'shed': { icon: Warehouse, label: 'Shed', color: 'zen-stone' },
  'compost': { icon: Recycle, label: 'Compost', color: 'zen-kitsune' },
  'water-butt': { icon: Droplets, label: 'Water Storage', color: 'zen-water' },
  'path': { icon: Footprints, label: 'Path', color: 'zen-stone' },
  'greenhouse': { icon: Flower2, label: 'Greenhouse', color: 'zen-moss' },
  'pond': { icon: Fish, label: 'Pond', color: 'zen-water' },
  'wildlife': { icon: Bird, label: 'Wildlife Area', color: 'zen-moss' },
  'other': { icon: HelpCircle, label: 'Area', color: 'zen-stone' },
}

function CompostSummary() {
  const { data, getActivePiles, getPilesByStatus } = useCompost()

  const stats = useMemo(() => {
    if (!data) return { activeCount: 0, turningDue: 0, harvestable: 0, totalPiles: 0 }

    const activePiles = getActivePiles()
    const harvestable = getPilesByStatus('ready').length

    // Count piles that need turning (active piles not turned in last 14 days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const turningDue = activePiles.filter(pile => {
      const turnEvents = pile.events?.filter(e => e.type === 'turn') || []
      if (turnEvents.length === 0) return true
      const lastTurn = new Date(turnEvents[turnEvents.length - 1].date)
      return lastTurn < twoWeeksAgo
    }).length

    return {
      activeCount: activePiles.length,
      turningDue,
      harvestable,
      totalPiles: data.piles.length,
    }
  }, [data, getActivePiles, getPilesByStatus])

  const { activeCount, turningDue, harvestable } = stats

  if (!data || data.piles.length === 0) {
    return (
      <div className="text-sm text-zen-stone-500 italic">
        No compost piles tracked yet. Visit the compost page to start tracking.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zen-moss-50 rounded-zen p-2 text-center">
          <div className="text-lg font-bold text-zen-moss-600">{activeCount}</div>
          <div className="text-xs text-zen-moss-700">Active</div>
        </div>
        <div className={`rounded-zen p-2 text-center ${turningDue > 0 ? 'bg-zen-kitsune-50' : 'bg-zen-stone-50'}`}>
          <div className={`text-lg font-bold ${turningDue > 0 ? 'text-zen-kitsune-600' : 'text-zen-stone-400'}`}>{turningDue}</div>
          <div className={`text-xs ${turningDue > 0 ? 'text-zen-kitsune-700' : 'text-zen-stone-500'}`}>Need Turn</div>
        </div>
        <div className={`rounded-zen p-2 text-center ${harvestable > 0 ? 'bg-zen-sakura-50' : 'bg-zen-stone-50'}`}>
          <div className={`text-lg font-bold ${harvestable > 0 ? 'text-zen-sakura-600' : 'text-zen-stone-400'}`}>{harvestable}</div>
          <div className={`text-xs ${harvestable > 0 ? 'text-zen-sakura-700' : 'text-zen-stone-500'}`}>Ready</div>
        </div>
      </div>

      {turningDue > 0 && (
        <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3">
          <p className="text-sm text-zen-kitsune-700">
            {turningDue} pile{turningDue > 1 ? 's' : ''} need turning to speed up decomposition
          </p>
        </div>
      )}

      {harvestable > 0 && (
        <div className="bg-zen-sakura-50 border border-zen-sakura-200 rounded-zen p-3">
          <p className="text-sm text-zen-sakura-700">
            {harvestable} pile{harvestable > 1 ? 's are' : ' is'} ready to harvest!
          </p>
        </div>
      )}
    </div>
  )
}

export default function InfrastructureDetailPanel({ area, onUpdateArea }: InfrastructureDetailPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const subtype = area.infrastructureSubtype || 'other'
  const config = SUBTYPE_CONFIG[subtype]
  const Icon = config.icon
  const isCompost = subtype === 'compost'

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
            <div className={`text-xs text-${config.color}-600`}>{config.label}</div>
          </div>
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2 text-zen-stone-500 hover:text-zen-moss-600 hover:bg-zen-moss-50 rounded-zen transition"
            title="Edit area details"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

      {/* Type-specific description */}
      <p className="text-sm text-zen-stone-600 mb-4">
        {subtype === 'shed' && 'Store tools and garden supplies.'}
        {subtype === 'water-butt' && 'Collect rainwater for irrigation.'}
        {subtype === 'path' && 'Access route through the allotment.'}
        {subtype === 'greenhouse' && 'Protected growing space.'}
        {subtype === 'compost' && 'Recycle garden and kitchen waste.'}
        {subtype === 'pond' && 'Water feature supporting wildlife and beneficial insects.'}
        {subtype === 'wildlife' && 'Habitat area for pollinators and beneficial creatures.'}
        {subtype === 'other' && 'Part of your allotment layout.'}
      </p>

      {/* Compost-specific content */}
      {isCompost && (
        <div className="space-y-4">
          <CompostSummary />
          <Link
            href="/compost"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-zen-kitsune-100 text-zen-kitsune-700 rounded-zen hover:bg-zen-kitsune-200 transition text-sm font-medium"
          >
            <Recycle className="w-4 h-4" />
            Manage Compost
            <ExternalLink className="w-3 h-3" />
          </Link>
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
