'use client'

import {
  Leaf,
  TreeDeciduous,
  Cherry,
  Flower2,
  Warehouse,
  HelpCircle,
  Recycle,
  Droplets,
  Footprints,
  Fish,
  Bird
} from 'lucide-react'
import { Area, AreaKind, InfrastructureSubtype } from '@/types/unified-allotment'
import { RotationGroup } from '@/types/garden-planner'
import { ROTATION_GROUP_NAMES } from '@/lib/rotation'
import { useAllotment } from '@/hooks/useAllotment'
import { useFormState } from '@/hooks/useFormState'

interface AddAreaFormProps {
  onSubmit: (area: Omit<Area, 'id'>) => void
  onCancel: () => void
  existingAreas: Area[]
}

type AddAreaFormFields = {
  name: string
  shortId: string
  kind: AreaKind
  description: string
  rotationGroup: RotationGroup
  infrastructureSubtype: InfrastructureSubtype
  createdYear: number | undefined
}

const AREA_KIND_OPTIONS: { kind: AreaKind; label: string; icon: typeof Leaf; description: string }[] = [
  { kind: 'rotation-bed', label: 'Rotation Bed', icon: Leaf, description: 'Annual crops with rotation tracking' },
  { kind: 'perennial-bed', label: 'Perennial Bed', icon: Flower2, description: 'Perennial vegetables like asparagus, rhubarb' },
  { kind: 'tree', label: 'Fruit Tree', icon: TreeDeciduous, description: 'Apple, plum, damson, etc.' },
  { kind: 'berry', label: 'Berry Area', icon: Cherry, description: 'Raspberries, currants, gooseberries' },
  { kind: 'herb', label: 'Herb Area', icon: Leaf, description: 'Perennial herbs' },
  { kind: 'infrastructure', label: 'Infrastructure', icon: Warehouse, description: 'Shed, compost, paths, etc.' },
  { kind: 'other', label: 'Other', icon: HelpCircle, description: 'Custom area type' },
]

const INFRASTRUCTURE_OPTIONS: { subtype: InfrastructureSubtype; label: string; icon: typeof Warehouse }[] = [
  { subtype: 'shed', label: 'Shed', icon: Warehouse },
  { subtype: 'compost', label: 'Compost', icon: Recycle },
  { subtype: 'water-butt', label: 'Water Storage', icon: Droplets },
  { subtype: 'path', label: 'Path', icon: Footprints },
  { subtype: 'greenhouse', label: 'Greenhouse', icon: Flower2 },
  { subtype: 'pond', label: 'Pond', icon: Fish },
  { subtype: 'wildlife', label: 'Wildlife Area', icon: Bird },
  { subtype: 'other', label: 'Other', icon: HelpCircle },
]

// Default icons and colors for each area kind
const AREA_KIND_DEFAULTS: Record<AreaKind, { icon: string; color: string }> = {
  'rotation-bed': { icon: '🌱', color: 'zen-moss' },      // Green
  'perennial-bed': { icon: '🌿', color: 'zen-ume' },      // Purple/Plum
  'tree': { icon: '🍎', color: 'zen-kitsune' },           // Orange
  'berry': { icon: '🫐', color: 'zen-sakura' },           // Pink
  'herb': { icon: '🪴', color: 'zen-water' },             // Blue
  'infrastructure': { icon: '🏠', color: 'zen-stone' },   // Gray
  'other': { icon: '🌾', color: 'zen-moss' },             // Green (can duplicate for 'other')
}

export default function AddAreaForm({
  onSubmit,
  onCancel,
  existingAreas
}: AddAreaFormProps) {
  const { data } = useAllotment()
  const currentYear = data?.currentYear ?? new Date().getFullYear()

  const { fields, setField, errors, setError, handleSubmit, isSubmitting } = useFormState<AddAreaFormFields>({
    initialValues: {
      name: '',
      shortId: '',
      kind: 'rotation-bed' as AreaKind,
      description: '',
      rotationGroup: 'legumes' as RotationGroup,
      infrastructureSubtype: 'shed' as InfrastructureSubtype,
      createdYear: undefined,
    },
    validators: {
      name: (value, allFields) => {
        const trimmed = (value as string).trim()
        // For infrastructure, name is optional
        if ((allFields.kind as AreaKind) !== 'infrastructure' && !trimmed) {
          return 'Area name is required'
        }
        if (trimmed && existingAreas.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
          return 'An area with this name already exists'
        }
      },
      shortId: (value) => {
        const id = (value as string).trim()
        if (id && existingAreas.some(a => a.shortId?.toLowerCase() === id.toLowerCase())) {
          return 'This short ID is already in use'
        }
      },
      createdYear: (value) => {
        const year = value as number | undefined
        if (year !== undefined && (year < 1900 || year > currentYear + 10)) {
          return `Year must be between 1900 and ${currentYear + 10}`
        }
      },
    },
    onSubmit: (values) => {
      // For infrastructure, name is optional - use subtype label if not provided
      let finalName = values.name.trim()
      if (values.kind === 'infrastructure' && !finalName) {
        const infraOption = INFRASTRUCTURE_OPTIONS.find(o => o.subtype === values.infrastructureSubtype)
        finalName = infraOption?.label || 'Infrastructure'
      }

      // Find next available grid position (simple: place at end)
      const maxY = Math.max(0, ...existingAreas.map(a => (a.gridPosition?.y ?? 0) + (a.gridPosition?.h ?? 1)))

      // Get default icon and color for the selected kind
      const defaults = AREA_KIND_DEFAULTS[values.kind]

      const newArea: Omit<Area, 'id'> = {
        name: finalName,
        shortId: values.shortId.trim() || undefined,
        kind: values.kind,
        description: values.description.trim() || undefined,
        icon: defaults.icon,
        color: defaults.color,
        canHavePlantings: values.kind !== 'infrastructure',
        gridPosition: {
          x: 0,
          y: maxY,
          w: 2,
          h: 1,  // v14: reduced from h:2 (100px) to h:1 (50px) for more compact layout
        },
        ...(values.kind === 'rotation-bed' && { rotationGroup: values.rotationGroup }),
        ...(values.kind === 'infrastructure' && { infrastructureSubtype: values.infrastructureSubtype }),
        createdYear: values.createdYear,
      }

      onSubmit(newArea)
    },
  })

  // Computed duplicate checks for inline error display (shown while typing)
  const isDuplicateName = fields.name.trim() !== '' && existingAreas.some(
    a => a.name.toLowerCase() === fields.name.trim().toLowerCase()
  )
  const isDuplicateShortId = fields.shortId.trim() !== '' && existingAreas.some(
    a => a.shortId?.toLowerCase() === fields.shortId.trim().toLowerCase()
  )

  const handleCreatedYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    if (input === '') {
      setField('createdYear', undefined)
      return
    }

    const parsed = parseInt(input, 10)
    if (isNaN(parsed)) {
      setError('createdYear', 'Please enter a valid year')
      return
    }

    if (parsed < 1900) {
      setField('createdYear', 1900)
      setError('createdYear', 'Year cannot be before 1900')
    } else if (parsed > currentYear + 10) {
      setField('createdYear', currentYear + 10)
      setError('createdYear', `Year cannot be after ${currentYear + 10}`)
    } else {
      setField('createdYear', parsed)
    }
  }

  const selectedKindOption = AREA_KIND_OPTIONS.find(o => o.kind === fields.kind)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Area Type Selection */}
      <div>
        <label className="block text-sm font-medium text-zen-ink-700 mb-2">
          Area Type *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {AREA_KIND_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = fields.kind === option.kind
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => setField('kind', option.kind)}
                className={`flex items-center gap-2 p-3 rounded-zen border text-left transition ${
                  isSelected
                    ? 'border-zen-moss-500 bg-zen-moss-50 text-zen-moss-700'
                    : 'border-zen-stone-200 hover:border-zen-stone-300 text-zen-ink-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-zen-moss-600' : 'text-zen-stone-400'}`} />
                <div>
                  <div className="font-medium text-sm">{option.label}</div>
                </div>
              </button>
            )
          })}
        </div>
        {selectedKindOption && (
          <p className="text-xs text-zen-stone-500 mt-2">{selectedKindOption.description}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="area-name" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Name {fields.kind !== 'infrastructure' && '*'}
        </label>
        <input
          id="area-name"
          type="text"
          value={fields.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder={
            fields.kind === 'infrastructure'
              ? `Optional (defaults to ${INFRASTRUCTURE_OPTIONS.find(o => o.subtype === fields.infrastructureSubtype)?.label || 'type'})`
              : fields.kind === 'rotation-bed'
              ? 'e.g., Bed F'
              : fields.kind === 'tree'
              ? 'e.g., Pear Tree'
              : 'e.g., New Area'
          }
          required={fields.kind !== 'infrastructure'}
          className="zen-input"
        />
        {isDuplicateName && (
          <p className="text-xs text-red-500 mt-1">An area with this name already exists</p>
        )}
      </div>

      {/* Short ID */}
      <div>
        <label htmlFor="area-short-id" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Short ID
        </label>
        <input
          id="area-short-id"
          type="text"
          value={fields.shortId}
          onChange={(e) => setField('shortId', e.target.value)}
          placeholder="e.g., A, B1, C"
          className="zen-input"
          maxLength={10}
        />
        {isDuplicateShortId && (
          <p className="text-xs text-red-500 mt-1">This short ID is already in use</p>
        )}
        <p className="text-xs text-zen-stone-500 mt-1">
          Optional short identifier for the AI advisor (e.g., &quot;A&quot;, &quot;B1&quot;)
        </p>
      </div>

      {/* Rotation Group (for rotation beds) */}
      {fields.kind === 'rotation-bed' && (
        <div>
          <label htmlFor="rotation-group" className="block text-sm font-medium text-zen-ink-700 mb-1">
            Rotation Group
          </label>
          <select
            id="rotation-group"
            value={fields.rotationGroup}
            onChange={(e) => setField('rotationGroup', e.target.value as RotationGroup)}
            className="zen-select"
          >
            {(Object.keys(ROTATION_GROUP_NAMES) as RotationGroup[]).map((group) => (
              <option key={group} value={group}>
                {ROTATION_GROUP_NAMES[group]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Infrastructure Subtype */}
      {fields.kind === 'infrastructure' && (
        <>
          <div>
            <label htmlFor="infra-subtype" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Infrastructure Type
            </label>
            <select
              id="infra-subtype"
              value={fields.infrastructureSubtype}
              onChange={(e) => setField('infrastructureSubtype', e.target.value as InfrastructureSubtype)}
              className="zen-select"
            >
              {INFRASTRUCTURE_OPTIONS.map((option) => (
                <option key={option.subtype} value={option.subtype}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Description */}
      <div>
        <label htmlFor="area-description" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Description
        </label>
        <textarea
          id="area-description"
          value={fields.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
          placeholder="Optional notes about this area..."
          className="zen-input"
        />
      </div>

      {/* Temporal Metadata */}
      <div className="border-t border-zen-stone-200 pt-4">
        <div>
          <label htmlFor="created-year" className="block text-sm font-medium text-zen-ink-700 mb-1">
            Built in year (optional)
          </label>
          <input
            id="created-year"
            type="number"
            min={1900}
            max={currentYear + 10}
            value={fields.createdYear ?? ''}
            onChange={handleCreatedYearChange}
            placeholder="Leave empty if unknown"
            className="zen-input"
          />
          {errors.createdYear && (
            <p className="text-sm text-zen-kitsune-600 mt-1">{errors.createdYear}</p>
          )}
          <p className="text-xs text-zen-stone-500 mt-1">
            {fields.createdYear
              ? `This area will only appear in ${fields.createdYear} and later years`
              : 'This area will appear in all years'
            }
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="zen-btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (fields.kind !== 'infrastructure' && !fields.name.trim()) ||
            isDuplicateName ||
            isDuplicateShortId ||
            !!errors.createdYear
          }
          className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Add Area
        </button>
      </div>
    </form>
  )
}
