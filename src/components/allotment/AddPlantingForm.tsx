'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Check, Users, Package } from 'lucide-react'
import { getVegetableById, vegetables } from '@/lib/vegetable-database'
import { getCompanionStatusForVegetable } from '@/lib/companion-utils'
import { myVarieties } from '@/data/my-varieties'
import { NewPlanting, Planting } from '@/types/unified-allotment'

interface AddPlantingFormProps {
  onSubmit: (planting: NewPlanting) => void
  onCancel: () => void
  existingPlantings?: Planting[]
}

export default function AddPlantingForm({
  onSubmit,
  onCancel,
  existingPlantings = []
}: AddPlantingFormProps) {
  const [vegetableId, setVegetableId] = useState('')
  const [varietyName, setVarietyName] = useState('')
  const [sowDate, setSowDate] = useState('')
  const [notes, setNotes] = useState('')

  // Get matching varieties from seed library for autocomplete
  const matchingVarieties = useMemo(
    () => vegetableId ? myVarieties.filter(v => v.vegetableId === vegetableId) : [],
    [vegetableId]
  )
  const selectedVegetable = vegetableId ? getVegetableById(vegetableId) : null

  // Pre-select variety if only one match exists
  useEffect(() => {
    if (matchingVarieties.length === 1 && !varietyName) {
      setVarietyName(matchingVarieties[0].name)
    } else if (matchingVarieties.length === 0) {
      setVarietyName('')
    }
  }, [matchingVarieties, varietyName])

  // Calculate companion compatibility with existing plantings
  const companionInfo = vegetableId
    ? getCompanionStatusForVegetable(vegetableId, existingPlantings)
    : { goods: [], bads: [] }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vegetableId) return

    onSubmit({
      vegetableId,
      varietyName: varietyName || undefined,
      sowDate: sowDate || undefined,
      notes: notes || undefined,
    })

    // Reset form
    setVegetableId('')
    setVarietyName('')
    setSowDate('')
    setNotes('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="vegetable-select" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Vegetable *
        </label>
        <select
          id="vegetable-select"
          value={vegetableId}
          onChange={(e) => setVegetableId(e.target.value)}
          required
          className="zen-select"
        >
          <option value="">Select a vegetable...</option>
          {[...vegetables].sort((a, b) => a.name.localeCompare(b.name)).map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        {/* Companion suggestions panel */}
        {vegetableId && existingPlantings.length > 0 && (
          <div className="mt-2 space-y-1">
            {companionInfo.goods.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-moss-700 bg-zen-moss-50 px-2 py-1.5 rounded-zen">
                <Check className="w-3 h-3" />
                <span>Good with: {companionInfo.goods.join(', ')}</span>
              </div>
            )}
            {companionInfo.bads.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-kitsune-700 bg-zen-kitsune-50 px-2 py-1.5 rounded-zen">
                <AlertTriangle className="w-3 h-3" />
                <span>Avoid: {companionInfo.bads.join(', ')}</span>
              </div>
            )}
            {companionInfo.goods.length === 0 && companionInfo.bads.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zen-stone-500 bg-zen-stone-50 px-2 py-1.5 rounded-zen">
                <Users className="w-3 h-3" />
                <span>Neutral with current plantings</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="variety-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Variety Name
        </label>
        <input
          id="variety-input"
          type="text"
          value={varietyName}
          onChange={(e) => setVarietyName(e.target.value)}
          list="variety-suggestions"
          placeholder="e.g., Kelvedon Wonder"
          className="zen-input"
        />
        <datalist id="variety-suggestions">
          {matchingVarieties.map(v => (
            <option key={v.id} value={v.name} />
          ))}
        </datalist>
        {vegetableId && matchingVarieties.length > 0 && (
          <a
            href={`/seeds?vegetable=${vegetableId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs text-zen-moss-600 hover:text-zen-moss-700"
          >
            <Package className="w-3 h-3" />
            View your {matchingVarieties.length} {selectedVegetable?.name.toLowerCase()} {matchingVarieties.length === 1 ? 'variety' : 'varieties'} →
          </a>
        )}
      </div>

      <div>
        <label htmlFor="sow-date-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Sow Date
        </label>
        <input
          id="sow-date-input"
          type="date"
          value={sowDate}
          onChange={(e) => setSowDate(e.target.value)}
          className="zen-input"
        />
      </div>

      <div>
        <label htmlFor="notes-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes about this planting..."
          className="zen-input"
        />
      </div>

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
          disabled={!vegetableId}
          className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Planting
        </button>
      </div>
    </form>
  )
}
