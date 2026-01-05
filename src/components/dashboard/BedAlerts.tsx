'use client'

import { Carrot, Sprout } from 'lucide-react'
import { Planting } from '@/types/unified-allotment'
import { getVegetableById } from '@/lib/vegetable-database'
import { getPlantEmoji } from '@/lib/plant-emoji'
import { SeasonalTheme } from '@/lib/seasonal-theme'

interface BedAlertsProps {
  harvestReady: Planting[]
  needsAttention: Planting[]
  theme: SeasonalTheme
}

function PlantingChip({ planting }: { planting: Planting }) {
  const vegetable = getVegetableById(planting.plantId)
  const emoji = getPlantEmoji(planting.plantId)
  const name = vegetable?.name || planting.plantId

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-zen text-sm border border-zen-stone-200">
      <span>{emoji}</span>
      <span className="text-zen-ink-600">{name}</span>
    </span>
  )
}

function Section({
  icon: Icon,
  title,
  children,
  accentClass = 'text-zen-moss-600',
}: {
  icon: typeof Sprout
  title: string
  children: React.ReactNode
  accentClass?: string
}) {
  return (
    <div className="py-4 border-b border-zen-stone-100 last:border-0 last:pb-0 first:pt-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accentClass}`} />
        <h4 className="text-sm font-medium text-zen-ink-700">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function HarvestSection({ plantings }: { plantings: Planting[] }) {
  if (plantings.length === 0) return null

  const unique = plantings.reduce((acc, p) => {
    if (!acc.find((existing) => existing.plantId === p.plantId)) {
      acc.push(p)
    }
    return acc
  }, [] as Planting[])

  return (
    <Section icon={Carrot} title="Ready to harvest" accentClass="text-zen-kitsune-600">
      <div className="flex flex-wrap gap-2">
        {unique.slice(0, 4).map((planting) => (
          <PlantingChip key={planting.id} planting={planting} />
        ))}
        {unique.length > 4 && (
          <span className="text-xs text-zen-stone-500 self-center px-2">
            +{unique.length - 4} more
          </span>
        )}
      </div>
    </Section>
  )
}

function AttentionSection({ plantings }: { plantings: Planting[] }) {
  if (plantings.length === 0) return null

  const unique = plantings.reduce((acc, p) => {
    if (!acc.find((existing) => existing.plantId === p.plantId)) {
      acc.push(p)
    }
    return acc
  }, [] as Planting[])

  return (
    <Section icon={Sprout} title="Sowing window open" accentClass="text-zen-moss-600">
      <div className="flex flex-wrap gap-2">
        {unique.slice(0, 4).map((planting) => (
          <PlantingChip key={planting.id} planting={planting} />
        ))}
        {unique.length > 4 && (
          <span className="text-xs text-zen-stone-500 self-center px-2">
            +{unique.length - 4} more
          </span>
        )}
      </div>
    </Section>
  )
}

export default function BedAlerts({ harvestReady, needsAttention }: BedAlertsProps) {
  const hasContent = harvestReady.length > 0 || needsAttention.length > 0

  if (!hasContent) {
    return (
      <div className="zen-card p-6">
        <h3 className="text-lg text-zen-ink-700 mb-4">Garden</h3>
        <div className="text-center py-8">
          <span className="text-3xl block mb-3">🌱</span>
          <p className="text-zen-stone-500 text-sm">All is well</p>
          <p className="text-zen-stone-400 text-xs mt-1">Growing quietly</p>
        </div>
      </div>
    )
  }

  return (
    <div className="zen-card p-6">
      <h3 className="text-lg text-zen-ink-700 mb-2">Garden</h3>

      <div>
        <HarvestSection plantings={harvestReady} />
        <AttentionSection plantings={needsAttention} />
      </div>
    </div>
  )
}
