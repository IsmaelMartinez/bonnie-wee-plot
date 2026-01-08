'use client'

import { useState } from 'react'
import { ArrowRightLeft, TreeDeciduous, Grid3X3, Warehouse, X, Check } from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { Area, BedArea, PermanentArea, InfrastructureArea } from '@/types/unified-allotment'

interface AreaTypeConverterProps {
  areaId: string
  currentType: Area['type']
  onConvert?: () => void
}

const TYPE_OPTIONS: Array<{
  type: Area['type']
  label: string
  icon: typeof TreeDeciduous
  description: string
}> = [
  {
    type: 'bed',
    label: 'Rotation Bed',
    icon: Grid3X3,
    description: 'Annual crops with rotation tracking',
  },
  {
    type: 'permanent',
    label: 'Permanent Planting',
    icon: TreeDeciduous,
    description: 'Fruit trees, berries, perennials',
  },
  {
    type: 'infrastructure',
    label: 'Infrastructure',
    icon: Warehouse,
    description: 'Shed, compost, paths, etc.',
  },
]

const PERMANENT_SUBTYPES: Array<{ value: PermanentArea['plantingType']; label: string }> = [
  { value: 'fruit-tree', label: 'Fruit Tree' },
  { value: 'berry', label: 'Berry' },
  { value: 'perennial-veg', label: 'Perennial Veg' },
  { value: 'herb', label: 'Herb' },
]

const INFRASTRUCTURE_SUBTYPES: Array<{ value: InfrastructureArea['infrastructureType']; label: string }> = [
  { value: 'shed', label: 'Shed' },
  { value: 'compost', label: 'Compost' },
  { value: 'water-butt', label: 'Water Butt' },
  { value: 'path', label: 'Path' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'pond', label: 'Pond' },
  { value: 'wildlife', label: 'Wildlife Area' },
  { value: 'other', label: 'Other' },
]

export default function AreaTypeConverter({
  areaId,
  currentType,
  onConvert,
}: AreaTypeConverterProps) {
  const { convertAreaType } = useAllotment()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Area['type']>(currentType)
  const [permanentSubtype, setPermanentSubtype] = useState<PermanentArea['plantingType']>('fruit-tree')
  const [infraSubtype, setInfraSubtype] = useState<InfrastructureArea['infrastructureType']>('other')

  const handleConvert = () => {
    if (selectedType === currentType) {
      setIsOpen(false)
      return
    }

    let typeConfig: Partial<BedArea | PermanentArea | InfrastructureArea> | undefined

    if (selectedType === 'permanent') {
      typeConfig = { plantingType: permanentSubtype }
    } else if (selectedType === 'infrastructure') {
      typeConfig = { infrastructureType: infraSubtype }
    }

    convertAreaType(areaId, selectedType, typeConfig)
    setIsOpen(false)
    onConvert?.()
  }

  const currentTypeInfo = TYPE_OPTIONS.find(t => t.type === currentType)

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
          Currently: <span className="font-medium">{currentTypeInfo?.label}</span>
        </p>

        <div className="space-y-2 mb-4">
          {TYPE_OPTIONS.map(option => {
            const Icon = option.icon
            const isSelected = selectedType === option.type
            const isCurrent = currentType === option.type

            return (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
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

        {selectedType === 'permanent' && selectedType !== currentType && (
          <div className="mb-4">
            <label className="block text-xs text-zen-stone-600 mb-1">Planting type:</label>
            <select
              value={permanentSubtype}
              onChange={e => setPermanentSubtype(e.target.value as PermanentArea['plantingType'])}
              className="w-full text-sm px-3 py-2 border border-zen-stone-200 rounded-zen"
            >
              {PERMANENT_SUBTYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedType === 'infrastructure' && selectedType !== currentType && (
          <div className="mb-4">
            <label className="block text-xs text-zen-stone-600 mb-1">Infrastructure type:</label>
            <select
              value={infraSubtype}
              onChange={e => setInfraSubtype(e.target.value as InfrastructureArea['infrastructureType'])}
              className="w-full text-sm px-3 py-2 border border-zen-stone-200 rounded-zen"
            >
              {INFRASTRUCTURE_SUBTYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedType !== currentType && (
          <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
            <p className="text-xs text-zen-kitsune-700">
              Converting will change how this area is tracked. Existing care logs and data will be preserved where possible.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            disabled={selectedType === currentType}
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
