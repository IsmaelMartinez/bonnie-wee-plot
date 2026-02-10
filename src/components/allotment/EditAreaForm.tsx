'use client'

import { useState } from 'react'
import { Area, InfrastructureSubtype } from '@/types/unified-allotment'
import { useAllotment } from '@/hooks/useAllotment'

interface EditAreaFormProps {
  area: Area
  onSubmit: (areaId: string, updates: Partial<Area>) => void
  onCancel: () => void
}

const REASONABLE_YEAR_MIN = 1900
const REASONABLE_YEAR_MAX = 2100

const INFRASTRUCTURE_SUBTYPES: { value: InfrastructureSubtype; label: string }[] = [
  { value: 'shed', label: 'Shed' },
  { value: 'compost', label: 'Compost' },
  { value: 'water-butt', label: 'Water Storage' },
  { value: 'path', label: 'Path' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'pond', label: 'Pond' },
  { value: 'wildlife', label: 'Wildlife Area' },
  { value: 'other', label: 'Other' },
]

export default function EditAreaForm({
  area,
  onSubmit,
  onCancel
}: EditAreaFormProps) {
  const { data } = useAllotment()
  const existingAreas = data?.layout?.areas || []

  const [name, setName] = useState(area.name)
  const [shortId, setShortId] = useState(area.shortId || '')
  const [description, setDescription] = useState(area.description || '')
  const [createdYear, setCreatedYear] = useState(area.createdYear?.toString() || '')
  const [retiredYear, setRetiredYear] = useState(area.retiredYear?.toString() || '')
  const [infrastructureSubtype, setInfrastructureSubtype] = useState<InfrastructureSubtype>(
    area.kind === 'infrastructure' ? (area.infrastructureSubtype || 'other') : 'other'
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check for duplicate shortId (excluding current area)
  const isDuplicateShortId = shortId.trim() && existingAreas.some(
    a => a.id !== area.id && a.shortId?.toLowerCase() === shortId.trim().toLowerCase()
  )

  const validateYears = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (createdYear !== '') {
      const year = parseInt(createdYear, 10)
      if (isNaN(year) || year < REASONABLE_YEAR_MIN || year > REASONABLE_YEAR_MAX) {
        newErrors.createdYear = `Year must be between ${REASONABLE_YEAR_MIN} and ${REASONABLE_YEAR_MAX}`
      }
    }

    if (retiredYear !== '') {
      const year = parseInt(retiredYear, 10)
      if (isNaN(year) || year < REASONABLE_YEAR_MIN || year > REASONABLE_YEAR_MAX) {
        newErrors.retiredYear = `Year must be between ${REASONABLE_YEAR_MIN} and ${REASONABLE_YEAR_MAX}`
      }
    }

    // If both are set, created should be before retired
    if (createdYear !== '' && retiredYear !== '') {
      const created = parseInt(createdYear, 10)
      const retired = parseInt(retiredYear, 10)
      if (created >= retired) {
        newErrors.retiredYear = 'Retired year must be after created year'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setErrors({ name: 'Area name is required' })
      return
    }

    if (isDuplicateShortId) {
      setErrors({ shortId: 'This short ID is already in use' })
      return
    }

    if (!validateYears()) {
      return
    }

    const newCreatedYear = createdYear !== '' ? parseInt(createdYear, 10) : undefined
    const newRetiredYear = retiredYear !== '' ? parseInt(retiredYear, 10) : undefined

    // Check if temporal metadata is changing in a way that could affect data
    if (newCreatedYear !== area.createdYear || newRetiredYear !== area.retiredYear) {
      const warnings: string[] = []

      if (newCreatedYear && (!area.createdYear || newCreatedYear > area.createdYear)) {
        const oldYear = area.createdYear || 'beginning'
        warnings.push(`Moving creation year from ${oldYear} to ${newCreatedYear} may hide historical plantings`)
      }

      if (newRetiredYear && (!area.retiredYear || newRetiredYear < area.retiredYear)) {
        const oldYear = area.retiredYear || 'present'
        warnings.push(`Moving retirement year from ${oldYear} to ${newRetiredYear} may hide recent plantings`)
      }

      if (warnings.length > 0) {
        const message = warnings.join('.\n') + '.\n\nThis could make plantings inaccessible when viewing those years. Continue?'
        if (!confirm(message)) {
          return
        }
      }
    }

    const updates: Partial<Area> = {
      name: name.trim(),
      shortId: shortId.trim() || undefined,
      description: description.trim() || undefined,
      createdYear: newCreatedYear,
      retiredYear: newRetiredYear,
    }

    // Include infrastructure subtype if area is infrastructure
    if (area.kind === 'infrastructure') {
      updates.infrastructureSubtype = infrastructureSubtype
    }

    onSubmit(area.id, updates)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="edit-area-name" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Name *
        </label>
        <input
          id="edit-area-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors({ ...errors, name: '' })
          }}
          placeholder="Area name"
          required
          className="zen-input"
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Short ID */}
      <div>
        <label htmlFor="edit-area-short-id" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Short ID
        </label>
        <input
          id="edit-area-short-id"
          type="text"
          value={shortId}
          onChange={(e) => {
            setShortId(e.target.value)
            if (errors.shortId) setErrors({ ...errors, shortId: '' })
          }}
          placeholder="e.g., A, B1, C"
          className="zen-input"
          maxLength={10}
        />
        {(isDuplicateShortId || errors.shortId) && (
          <p className="text-xs text-red-500 mt-1">{errors.shortId || 'This short ID is already in use'}</p>
        )}
        <p className="text-xs text-zen-stone-500 mt-1">
          Optional short identifier for the AI advisor (e.g., &quot;A&quot;, &quot;B1&quot;)
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="edit-area-description" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Description
        </label>
        <textarea
          id="edit-area-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes about this area..."
          className="zen-input"
        />
      </div>

      {/* Infrastructure Subtype - Only for infrastructure */}
      {area.kind === 'infrastructure' && (
        <div>
          <label htmlFor="edit-infrastructure-subtype" className="block text-sm font-medium text-zen-ink-700 mb-1">
            Infrastructure Type
          </label>
          <select
            id="edit-infrastructure-subtype"
            value={infrastructureSubtype}
            onChange={(e) => setInfrastructureSubtype(e.target.value as InfrastructureSubtype)}
            className="zen-input"
          >
            {INFRASTRUCTURE_SUBTYPES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Created Year */}
      <div>
        <label htmlFor="edit-area-created-year" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Created Year
        </label>
        <input
          id="edit-area-created-year"
          type="number"
          value={createdYear}
          onChange={(e) => {
            setCreatedYear(e.target.value)
            if (errors.createdYear) setErrors({ ...errors, createdYear: '' })
          }}
          placeholder="Year this area was built"
          min={REASONABLE_YEAR_MIN}
          max={REASONABLE_YEAR_MAX}
          className="zen-input"
        />
        {errors.createdYear && (
          <p className="text-xs text-red-500 mt-1">{errors.createdYear}</p>
        )}
        <p className="text-xs text-zen-stone-500 mt-1">
          Year this area was physically built or established. Leave empty if area has always existed.
        </p>
      </div>

      {/* Retired Year */}
      <div>
        <label htmlFor="edit-area-retired-year" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Retired Year
        </label>
        <input
          id="edit-area-retired-year"
          type="number"
          value={retiredYear}
          onChange={(e) => {
            setRetiredYear(e.target.value)
            if (errors.retiredYear) setErrors({ ...errors, retiredYear: '' })
          }}
          placeholder="Year this area was removed"
          min={REASONABLE_YEAR_MIN}
          max={REASONABLE_YEAR_MAX}
          className="zen-input"
        />
        {errors.retiredYear && (
          <p className="text-xs text-red-500 mt-1">{errors.retiredYear}</p>
        )}
        <p className="text-xs text-zen-stone-500 mt-1">
          Year this area was removed or demolished. Leave empty if area is still active.
        </p>
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
          disabled={!name.trim() || Object.values(errors).some(e => e.length > 0)}
          className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}
