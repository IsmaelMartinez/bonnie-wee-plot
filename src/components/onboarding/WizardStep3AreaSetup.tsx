'use client'

import { useState } from 'react'
import { Plus, Trash2, Grid3x3 } from 'lucide-react'
import { AreaKind } from '@/types/unified-allotment'

interface AreaTemplate {
  id: string
  name: string
  kind: AreaKind
  width?: number
  length?: number
}

interface WizardStep3AreaSetupProps {
  areas: AreaTemplate[]
  onAreasChange: (areas: AreaTemplate[]) => void
  onNext: () => void
  onBack: () => void
}

const QUICK_TEMPLATES = [
  {
    name: 'Small Plot (2-3 beds)',
    areas: [
      { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 3 },
      { id: 'bed-b', name: 'Bed B', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 3 },
      { id: 'compost-1', name: 'Compost Bin', kind: 'infrastructure' as AreaKind },
    ]
  },
  {
    name: 'Medium Allotment (4-6 beds)',
    areas: [
      { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 4 },
      { id: 'bed-b', name: 'Bed B', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 4 },
      { id: 'bed-c', name: 'Bed C', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 4 },
      { id: 'bed-d', name: 'Bed D', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 4 },
      { id: 'berry-1', name: 'Raspberry Patch', kind: 'berry' as AreaKind },
      { id: 'compost-1', name: 'Compost Area', kind: 'infrastructure' as AreaKind },
    ]
  },
  {
    name: 'Large Community Plot (8+ beds)',
    areas: [
      { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'bed-b', name: 'Bed B', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'bed-c', name: 'Bed C', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'bed-d', name: 'Bed D', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'bed-e', name: 'Bed E', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'bed-f', name: 'Bed F', kind: 'rotation-bed' as AreaKind, width: 1.2, length: 5 },
      { id: 'perennial-1', name: 'Perennial Bed', kind: 'perennial-bed' as AreaKind },
      { id: 'tree-1', name: 'Apple Tree', kind: 'tree' as AreaKind },
      { id: 'compost-1', name: 'Compost Bins', kind: 'infrastructure' as AreaKind },
      { id: 'shed-1', name: 'Tool Shed', kind: 'infrastructure' as AreaKind },
    ]
  }
]

const AREA_KIND_OPTIONS: { value: AreaKind; label: string }[] = [
  { value: 'rotation-bed', label: 'Rotation Bed' },
  { value: 'perennial-bed', label: 'Perennial Bed' },
  { value: 'tree', label: 'Fruit Tree' },
  { value: 'berry', label: 'Berry Bush' },
  { value: 'herb', label: 'Herb Garden' },
  { value: 'infrastructure', label: 'Infrastructure' },
]

export default function WizardStep3AreaSetup({
  areas,
  onAreasChange,
  onNext,
  onBack
}: WizardStep3AreaSetupProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddArea = () => {
    const newArea: AreaTemplate = {
      id: `area-${Date.now()}`,
      name: '',
      kind: 'rotation-bed',
    }
    onAreasChange([...areas, newArea])
  }

  const handleRemoveArea = (id: string) => {
    onAreasChange(areas.filter(a => a.id !== id))
  }

  const handleUpdateArea = (id: string, updates: Partial<AreaTemplate>) => {
    onAreasChange(areas.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const handleUseTemplate = (templateAreas: AreaTemplate[]) => {
    onAreasChange(templateAreas)
  }

  const handleNext = () => {
    const newErrors: Record<string, string> = {}

    if (areas.length === 0) {
      newErrors.general = 'Please add at least one area or use a template'
      setErrors(newErrors)
      return
    }

    areas.forEach(area => {
      if (!area.name.trim()) {
        newErrors[`${area.id}-name`] = 'Name is required'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-display text-zen-ink-800 mb-2">
          Set Up Your Areas
        </h2>
        <p className="text-zen-stone-600">
          Add your beds and planting areas (you can change these later)
        </p>
      </div>

      {/* Quick Templates */}
      <div className="bg-zen-moss-50 border border-zen-moss-200 rounded-zen-lg p-4">
        <h3 className="font-medium text-zen-ink-700 mb-3 flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          Quick Start Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {QUICK_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              onClick={() => handleUseTemplate(template.areas)}
              className="text-left px-3 py-2 bg-white border border-zen-moss-300 rounded-zen hover:bg-zen-moss-100 hover:border-zen-moss-400 transition text-sm"
            >
              <div className="font-medium text-zen-ink-800">{template.name}</div>
              <div className="text-xs text-zen-stone-500">{template.areas.length} areas</div>
            </button>
          ))}
        </div>
      </div>

      {/* Areas List */}
      <div className="space-y-3">
        {areas.map((area) => (
          <div key={area.id} className="bg-zen-stone-50 border border-zen-stone-200 rounded-zen-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zen-ink-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={area.name}
                      onChange={(e) => {
                        handleUpdateArea(area.id, { name: e.target.value })
                        if (errors[`${area.id}-name`]) {
                          const newErrors = { ...errors }
                          delete newErrors[`${area.id}-name`]
                          setErrors(newErrors)
                        }
                      }}
                      placeholder="e.g., Bed A"
                      className={`w-full px-3 py-2 text-sm border rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500 ${
                        errors[`${area.id}-name`] ? 'border-red-500' : 'border-zen-stone-300'
                      }`}
                    />
                    {errors[`${area.id}-name`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`${area.id}-name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zen-ink-700 mb-1">
                      Type
                    </label>
                    <select
                      value={area.kind}
                      onChange={(e) => handleUpdateArea(area.id, { kind: e.target.value as AreaKind })}
                      className="w-full px-3 py-2 text-sm border border-zen-stone-300 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
                    >
                      {AREA_KIND_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zen-ink-700 mb-1">
                      Width (m, optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={area.width || ''}
                      onChange={(e) => handleUpdateArea(area.id, { width: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="1.2"
                      className="w-full px-3 py-2 text-sm border border-zen-stone-300 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zen-ink-700 mb-1">
                      Length (m, optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={area.length || ''}
                      onChange={(e) => handleUpdateArea(area.id, { length: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="3.0"
                      className="w-full px-3 py-2 text-sm border border-zen-stone-300 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveArea(area.id)}
                className="p-2 text-zen-stone-400 hover:text-red-600 hover:bg-red-50 rounded-zen transition"
                title="Remove area"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {errors.general && (
          <p className="text-sm text-red-600">{errors.general}</p>
        )}

        <button
          onClick={handleAddArea}
          className="w-full py-3 border-2 border-dashed border-zen-stone-300 text-zen-stone-600 rounded-zen-lg hover:border-zen-moss-400 hover:text-zen-moss-600 hover:bg-zen-moss-50 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Another Area
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-zen-stone-300 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-50 transition font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-4 py-3 bg-zen-moss-600 text-white rounded-zen-lg hover:bg-zen-moss-700 transition font-medium"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
