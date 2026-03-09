'use client'

import Link from 'next/link'
import Dialog from '@/components/ui/Dialog'
import MonthBar from '@/components/plants/MonthBar'
import { getVegetableById } from '@/lib/vegetable-database'

interface PlantSummaryDialogProps {
  plantId: string | null
  isOpen: boolean
  onClose: () => void
}

function formatDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function difficultyColor(d: string): string {
  if (d === 'beginner') return 'zen-badge-moss'
  if (d === 'intermediate') return 'zen-badge-kitsune'
  return 'zen-badge-sakura'
}

function formatSun(sun: string): string {
  return sun
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function PlantSummaryDialog({ plantId, isOpen, onClose }: PlantSummaryDialogProps) {
  if (!plantId) return null
  const plant = getVegetableById(plantId)
  if (!plant) return null

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={plant.name} maxWidth="lg">
      {/* Header info */}
      <div className="flex items-baseline gap-2 mb-4 flex-wrap">
        <span className={difficultyColor(plant.care.difficulty)}>
          {formatDifficulty(plant.care.difficulty)}
        </span>
        {plant.botanicalName && (
          <span className="text-sm text-zen-stone-500 italic">{plant.botanicalName}</span>
        )}
      </div>

      {/* Key facts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-zen-stone-500 mb-1">Sun</div>
          <div className="text-sm text-zen-ink-700">{formatSun(plant.care.sun)}</div>
        </div>
        <div>
          <div className="text-xs text-zen-stone-500 mb-1">Water</div>
          <div className="text-sm text-zen-ink-700">
            {plant.care.water.charAt(0).toUpperCase() + plant.care.water.slice(1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zen-stone-500 mb-1">Spacing</div>
          <div className="text-sm text-zen-ink-700">{plant.care.spacing.between}cm</div>
        </div>
        <div>
          <div className="text-xs text-zen-stone-500 mb-1">Depth</div>
          <div className="text-sm text-zen-ink-700">{plant.care.depth}cm</div>
        </div>
      </div>

      {/* Planting calendar */}
      <div className="space-y-2 mb-4">
        <MonthBar
          label="Sow Indoors"
          months={plant.planting.sowIndoorsMonths}
          color="bg-zen-water-200 text-zen-water-800"
        />
        <MonthBar
          label="Sow Outdoors"
          months={plant.planting.sowOutdoorsMonths}
          color="bg-zen-moss-200 text-zen-moss-800"
        />
        <MonthBar
          label="Transplant"
          months={plant.planting.transplantMonths}
          color="bg-zen-bamboo-200 text-zen-bamboo-800"
        />
        <MonthBar
          label="Harvest"
          months={plant.planting.harvestMonths}
          color="bg-zen-kitsune-200 text-zen-kitsune-800"
        />
      </div>

      {/* Days to harvest */}
      <p className="text-sm text-zen-stone-500 mb-4">
        {plant.planting.daysToHarvest.min}&ndash;{plant.planting.daysToHarvest.max} days to harvest
      </p>

      {/* View full details link */}
      <Link
        href={`/plants/${plantId}`}
        onClick={onClose}
        className="text-zen-moss-600 hover:text-zen-moss-700 text-sm font-medium transition"
      >
        View full details &rarr;
      </Link>
    </Dialog>
  )
}
