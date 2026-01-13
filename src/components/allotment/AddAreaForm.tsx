'use client'

import { useState } from 'react'
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

interface AddAreaFormProps {
  onSubmit: (area: Omit<Area, 'id'>) => void
  onCancel: () => void
  existingAreas: Area[]
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

const TREE_TYPE_OPTIONS = [
  'Apple',
  'Pear',
  'Plum',
  'Damson',
  'Cherry',
  'Apricot',
  'Peach',
  'Fig',
  'Quince',
  'Medlar',
  'Other',
]

const EMOJI_OPTIONS = ['🌱', '🥬', '🥕', '🍅', '🫛', '🧅', '🥔', '🍎', '🍐', '🫐', '🌿', '🏠', '🪴', '🌻', '🌾']

const COLOR_OPTIONS = [
  { value: 'zen-moss', label: 'Green' },
  { value: 'zen-water', label: 'Blue' },
  { value: 'zen-sakura', label: 'Pink' },
  { value: 'zen-kitsune', label: 'Orange' },
  { value: 'zen-stone', label: 'Gray' },
]

export default function AddAreaForm({
  onSubmit,
  onCancel,
  existingAreas
}: AddAreaFormProps) {
  const { data } = useAllotment()
  const currentYear = data?.currentYear ?? new Date().getFullYear()

  const [name, setName] = useState('')
  const [kind, setKind] = useState<AreaKind>('rotation-bed')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🌱')
  const [color, setColor] = useState('zen-moss')
  const [rotationGroup, setRotationGroup] = useState<RotationGroup>('legumes')
  const [infrastructureSubtype, setInfrastructureSubtype] = useState<InfrastructureSubtype>('shed')
  const [treeType, setTreeType] = useState<string>('Apple')
  const [canHavePlantings, setCanHavePlantings] = useState(true)
  const [createdYear, setCreatedYear] = useState<number | undefined>(currentYear)
  const [yearError, setYearError] = useState<string>()

  // Check for duplicate names
  const isDuplicateName = existingAreas.some(
    a => a.name.toLowerCase() === name.trim().toLowerCase()
  )

  // Validate createdYear (optional - undefined is valid)
  const isValidCreatedYear = createdYear === undefined || (createdYear >= 1900 && createdYear <= currentYear + 10)

  const handleCreatedYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    if (input === '') {
      setCreatedYear(undefined)
      setYearError(undefined)
      return
    }

    const parsed = parseInt(input, 10)
    if (isNaN(parsed)) {
      setYearError('Please enter a valid year')
      return
    }

    if (parsed < 1900) {
      setYearError('Year cannot be before 1900')
      setCreatedYear(1900)
    } else if (parsed > currentYear + 10) {
      setYearError(`Year cannot be after ${currentYear + 10}`)
      setCreatedYear(currentYear + 10)
    } else {
      setYearError(undefined)
      setCreatedYear(parsed)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isDuplicateName || !isValidCreatedYear) return

    // Find next available grid position (simple: place at end)
    const maxY = Math.max(0, ...existingAreas.map(a => (a.gridPosition?.y ?? 0) + (a.gridPosition?.h ?? 1)))

    const newArea: Omit<Area, 'id'> = {
      name: name.trim(),
      kind,
      description: description.trim() || undefined,
      icon,
      color,
      canHavePlantings: kind === 'infrastructure' ? canHavePlantings : true,
      gridPosition: {
        x: 0,
        y: maxY,
        w: 2,
        h: 2,
      },
      ...(kind === 'rotation-bed' && { rotationGroup }),
      ...(kind === 'infrastructure' && { infrastructureSubtype }),
      ...(kind === 'tree' && treeType && treeType !== 'Other' && {
        primaryPlant: {
          plantId: treeType.toLowerCase(),
          variety: treeType,
        }
      }),
      createdYear,
    }

    onSubmit(newArea)
  }

  const selectedKindOption = AREA_KIND_OPTIONS.find(o => o.kind === kind)

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
            const isSelected = kind === option.kind
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => setKind(option.kind)}
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
          Name *
        </label>
        <input
          id="area-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'rotation-bed' ? 'e.g., Bed F' : kind === 'tree' ? 'e.g., Pear Tree' : 'e.g., New Area'}
          required
          className="zen-input"
        />
        {isDuplicateName && (
          <p className="text-xs text-red-500 mt-1">An area with this name already exists</p>
        )}
      </div>

      {/* Rotation Group (for rotation beds) */}
      {kind === 'rotation-bed' && (
        <div>
          <label htmlFor="rotation-group" className="block text-sm font-medium text-zen-ink-700 mb-1">
            Rotation Group
          </label>
          <select
            id="rotation-group"
            value={rotationGroup}
            onChange={(e) => setRotationGroup(e.target.value as RotationGroup)}
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

      {/* Tree Type (for fruit trees) */}
      {kind === 'tree' && (
        <div>
          <label htmlFor="tree-type" className="block text-sm font-medium text-zen-ink-700 mb-1">
            Tree Type
          </label>
          <select
            id="tree-type"
            value={treeType}
            onChange={(e) => setTreeType(e.target.value)}
            className="zen-select"
          >
            {TREE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Infrastructure Subtype */}
      {kind === 'infrastructure' && (
        <>
          <div>
            <label htmlFor="infra-subtype" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Infrastructure Type
            </label>
            <select
              id="infra-subtype"
              value={infrastructureSubtype}
              onChange={(e) => setInfrastructureSubtype(e.target.value as InfrastructureSubtype)}
              className="zen-select"
            >
              {INFRASTRUCTURE_OPTIONS.map((option) => (
                <option key={option.subtype} value={option.subtype}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="can-have-plantings"
              checked={canHavePlantings}
              onChange={(e) => setCanHavePlantings(e.target.checked)}
              className="rounded border-zen-stone-300"
            />
            <label htmlFor="can-have-plantings" className="text-sm text-zen-ink-600">
              Can have plantings (e.g., flowers around shed)
            </label>
          </div>
        </>
      )}

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-zen-ink-700 mb-1">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 text-xl rounded-zen border flex items-center justify-center transition ${
                icon === emoji
                  ? 'border-zen-moss-500 bg-zen-moss-50'
                  : 'border-zen-stone-200 hover:border-zen-stone-300'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-zen-ink-700 mb-1">
          Color
        </label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              className={`px-3 py-1.5 text-sm rounded-zen border transition ${
                color === option.value
                  ? `border-${option.value}-500 bg-${option.value}-50 text-${option.value}-700`
                  : 'border-zen-stone-200 hover:border-zen-stone-300 text-zen-ink-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="area-description" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Description
        </label>
        <textarea
          id="area-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            value={createdYear ?? ''}
            onChange={handleCreatedYearChange}
            placeholder="Leave empty if unknown"
            className="zen-input"
          />
          {yearError && (
            <p className="text-sm text-red-600 mt-1">{yearError}</p>
          )}
          <p className="text-xs text-zen-stone-500 mt-1">
            {createdYear
              ? `This area will only appear in ${createdYear} and later years`
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
          disabled={!name.trim() || isDuplicateName || !isValidCreatedYear || yearError !== undefined}
          className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Area
        </button>
      </div>
    </form>
  )
}
