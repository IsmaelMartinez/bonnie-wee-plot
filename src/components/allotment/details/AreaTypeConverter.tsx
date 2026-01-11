'use client'

import { useState } from 'react'
import { ArrowRightLeft, TreeDeciduous, Grid3X3, Warehouse, Flower2, Leaf, X, Check } from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { AreaKind } from '@/types/unified-allotment'
import { RotationGroup } from '@/types/garden-planner'

interface AreaTypeConverterProps {
  areaId: string
  currentKind: AreaKind
  onConvert?: () => void
}

const KIND_OPTIONS: Array<{
  kind: AreaKind
  label: string
  icon: typeof TreeDeciduous
  description: string
}> = [
  {
    kind: 'rotation-bed',
    label: 'Rotation Bed',
    icon: Grid3X3,
    description: 'Annual crops with rotation tracking',
  },
  {
    kind: 'perennial-bed',
    label: 'Perennial Bed',
    icon: Leaf,
    description: 'Asparagus, rhubarb, artichokes',
  },
  {
    kind: 'tree',
    label: 'Fruit Tree',
    icon: TreeDeciduous,
    description: 'Apple, pear, plum, etc.',
  },
  {
    kind: 'berry',
    label: 'Berry',
    icon: Flower2,
    description: 'Raspberries, blackberries, currants',
  },
  {
    kind: 'infrastructure',
    label: 'Infrastructure',
    icon: Warehouse,
    description: 'Shed, compost, paths, etc.',
  },
]

const ROTATION_GROUPS: Array<{ value: RotationGroup; label: string }> = [
  { value: 'brassicas', label: 'Brassicas' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'roots', label: 'Roots' },
  { value: 'alliums', label: 'Alliums' },
  { value: 'solanaceae', label: 'Solanaceae' },
  { value: 'cucurbits', label: 'Cucurbits' },
]

export default function AreaTypeConverter({
  areaId,
  currentKind,
  onConvert,
}: AreaTypeConverterProps) {
  const { changeAreaKind } = useAllotment()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedKind, setSelectedKind] = useState<AreaKind>(currentKind)
  const [rotationGroup, setRotationGroup] = useState<RotationGroup>('legumes')

  const handleConvert = () => {
    if (selectedKind === currentKind) {
      setIsOpen(false)
      return
    }

    const options = selectedKind === 'rotation-bed' ? { rotationGroup } : undefined
    changeAreaKind(areaId, selectedKind, options)
    setIsOpen(false)
    onConvert?.()
  }

  const currentKindInfo = KIND_OPTIONS.find(k => k.kind === currentKind)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-zen-stone-500 hover:text-zen-stone-700"
        title="Convert area type"
      >
        <ArrowRightLeft className="w-3 h-3" />
        Convert
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-zen-lg shadow-lg max-w-sm w-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-zen-ink-800">Convert Area Type</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zen-stone-400 hover:text-zen-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zen-stone-600 mb-4">
          Currently: <span className="font-medium">{currentKindInfo?.label}</span>
        </p>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {KIND_OPTIONS.map(option => {
            const Icon = option.icon
            const isSelected = selectedKind === option.kind
            const isCurrent = currentKind === option.kind

            return (
              <button
                key={option.kind}
                onClick={() => setSelectedKind(option.kind)}
                className={`w-full flex items-start gap-3 p-3 rounded-zen border text-left transition ${
                  isSelected
                    ? 'border-zen-moss-500 bg-zen-moss-50'
                    : 'border-zen-stone-200 hover:border-zen-stone-300'
                } ${isCurrent ? 'opacity-50' : ''}`}
                disabled={isCurrent}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-zen-moss-600' : 'text-zen-stone-400'}`} />
                <div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-zen-moss-700' : 'text-zen-ink-700'}`}>
                    {option.label}
                    {isCurrent && ' (current)'}
                  </div>
                  <div className="text-xs text-zen-stone-500">{option.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {selectedKind === 'rotation-bed' && selectedKind !== currentKind && (
          <div className="mb-4">
            <label className="block text-xs text-zen-stone-600 mb-1">Initial rotation group:</label>
            <select
              value={rotationGroup}
              onChange={e => setRotationGroup(e.target.value as RotationGroup)}
              className="w-full text-sm px-3 py-2 border border-zen-stone-200 rounded-zen"
            >
              {ROTATION_GROUPS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedKind !== currentKind && (
          <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
            <p className="text-xs text-zen-kitsune-700">
              Converting will change how this area is tracked. Existing plantings and care logs will be preserved.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            disabled={selectedKind === currentKind}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zen-moss-500 text-white rounded-zen hover:bg-zen-moss-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Check className="w-4 h-4" />
            Convert
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 bg-zen-stone-200 text-zen-stone-700 rounded-zen hover:bg-zen-stone-300 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
