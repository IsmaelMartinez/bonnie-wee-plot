'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AlertTriangle, Check, Users, Calendar, ChevronDown, Lightbulb } from 'lucide-react'
import { getVegetableById } from '@/lib/vegetable-database'
import { getCompanionStatusForVegetable } from '@/lib/companion-utils'
import { getRecommendedSowMethod, SowMethodRecommendation } from '@/lib/planting-utils'
import { populateExpectedHarvest } from '@/lib/date-calculator'
import { NewPlanting, Planting, StoredVariety, SowMethod, PlantingStatus } from '@/types/unified-allotment'
import { VegetableCategory } from '@/types/garden-planner'
import PlantCombobox from './PlantCombobox'
import PlantingTimeline from './PlantingTimeline'

interface AddPlantingFormProps {
  onSubmit: (planting: NewPlanting) => void
  onCancel: () => void
  existingPlantings?: Planting[]
  selectedYear: number
  varieties?: StoredVariety[]
  initialCategoryFilter?: VegetableCategory | 'all'
}

// Helper to check if variety has seeds for year
function hasSeedsForYear(variety: StoredVariety, year: number): boolean {
  return variety.seedsByYear?.[year] === 'have'
}

export default function AddPlantingForm({
  onSubmit,
  onCancel,
  existingPlantings = [],
  selectedYear,
  varieties = [],
  initialCategoryFilter = 'all'
}: AddPlantingFormProps) {
  const [plantId, setVegetableId] = useState('')
  const [varietyName, setVarietyName] = useState('')
  const [sowMethod, setSowMethod] = useState<SowMethod>('outdoor')
  const [sowMethodRecommendation, setSowMethodRecommendation] = useState<SowMethodRecommendation | null>(null)
  const [sowDate, setSowDate] = useState('')
  const [transplantDate, setTransplantDate] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>(initialCategoryFilter)
  const [showDateDetails, setShowDateDetails] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  // Get current month for sow method recommendation
  const currentMonth = new Date().getMonth() + 1 // 1-12

  // Update sow method recommendation when plant changes
  useEffect(() => {
    if (plantId) {
      const recommendation = getRecommendedSowMethod(plantId, currentMonth)
      setSowMethodRecommendation(recommendation)
      setSowMethod(recommendation.recommended)
    } else {
      setSowMethodRecommendation(null)
    }
  }, [plantId, currentMonth])

  // Auto-expand date section when a date is entered
  useEffect(() => {
    if (sowDate) setShowDateDetails(true)
  }, [sowDate])

  // Get matching varieties from seed library for autocomplete
  // Sort: varieties with seeds first, then alphabetically
  const matchingVarieties = useMemo(() => {
    if (!plantId) return []

    const forPlant = varieties.filter(v => v.plantId === plantId)

    return forPlant.sort((a, b) => {
      const aHasSeeds = hasSeedsForYear(a, selectedYear)
      const bHasSeeds = hasSeedsForYear(b, selectedYear)

      // Prioritize varieties with seeds
      if (aHasSeeds && !bHasSeeds) return -1
      if (!aHasSeeds && bHasSeeds) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name)
    })
  }, [plantId, varieties, selectedYear])
  const selectedVegetable = plantId ? getVegetableById(plantId) : null

  // Pre-select variety if only one match exists
  useEffect(() => {
    if (matchingVarieties.length === 1 && !varietyName) {
      setVarietyName(matchingVarieties[0].name)
    } else if (matchingVarieties.length === 0) {
      setVarietyName('')
    }
  }, [matchingVarieties, varietyName])

  // Calculate companion compatibility with existing plantings
  const companionInfo = plantId
    ? getCompanionStatusForVegetable(plantId, existingPlantings)
    : { goods: [], bads: [] }

  const resetForm = useCallback(() => {
    setVegetableId('')
    setVarietyName('')
    setSowMethod('outdoor')
    setSowMethodRecommendation(null)
    setSowDate('')
    setTransplantDate('')
    setNotes('')
    setShowDateDetails(false)
  }, [])

  const doSubmit = useCallback((keepOpen: boolean) => {
    if (!plantId) return

    // Determine status based on dates
    const status: PlantingStatus = sowDate ? 'active' : 'planned'

    // Create base planting
    let newPlanting: NewPlanting = {
      plantId,
      varietyName: varietyName || undefined,
      sowMethod, // Always include sow method (user intent even for planned)
      sowDate: sowDate || undefined,
      transplantDate: transplantDate || undefined,
      notes: notes || undefined,
      status,
    }

    // Calculate and populate expected harvest dates
    const vegData = getVegetableById(plantId)
    if (sowDate && vegData) {
      newPlanting = populateExpectedHarvest(newPlanting, vegData)
    }

    onSubmit(newPlanting)

    if (keepOpen) {
      const addedName = vegData?.name || plantId
      setLastAdded(addedName)
      resetForm()
      // Focus the combobox input for next entry
      setTimeout(() => {
        const input = document.getElementById('plant-combobox')
        if (input) input.focus()
      }, 50)
      // Auto-clear feedback
      setTimeout(() => setLastAdded(null), 2000)
    } else {
      resetForm()
      onCancel()
    }
  }, [plantId, varietyName, sowMethod, sowDate, transplantDate, notes, onSubmit, onCancel, resetForm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSubmit(false)
  }

  // Format a date string for display in the collapsed summary
  const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plant Selection with Search */}
      <div>
        <label htmlFor="plant-combobox" className="block text-sm font-medium text-zen-ink-700 mb-1">
          Plant *
        </label>

        <PlantCombobox
          value={plantId}
          onChange={setVegetableId}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          existingPlantings={existingPlantings}
          required
        />

        {/* Companion suggestions panel */}
        {plantId && existingPlantings.length > 0 && (
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

      {/* Details shown only after plant is selected */}
      {plantId && (
        <>
          {/* Variety Name */}
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
              {matchingVarieties.map(v => {
                const hasSeeds = hasSeedsForYear(v, selectedYear)
                return (
                  <option key={v.id} value={v.name}>
                    {hasSeeds ? '✓ ' : '○ '}{v.name}
                  </option>
                )
              })}
            </datalist>
            {matchingVarieties.length > 0 && (
              <a
                href={`/seeds?vegetable=${plantId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-zen-stone-500 hover:text-zen-moss-600"
              >
                View {matchingVarieties.length} {matchingVarieties.length === 1 ? 'variety' : 'varieties'} in seed library
              </a>
            )}
            {matchingVarieties.length === 0 && (
              <a
                href={`/seeds?vegetable=${plantId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-zen-stone-500 hover:text-zen-moss-600"
              >
                Add varieties to seed library
              </a>
            )}
          </div>

          {/* Timing & Dates - collapsible section */}
          <div className="border border-zen-stone-200 rounded-zen">
            <button
              type="button"
              onClick={() => setShowDateDetails(!showDateDetails)}
              className="w-full flex items-center justify-between text-sm font-medium text-zen-ink-700 px-3 py-2.5 hover:bg-zen-stone-50 rounded-zen transition"
              aria-expanded={showDateDetails}
              aria-controls="date-details-section"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zen-stone-500" />
                Timing &amp; Dates
                {sowDate && !showDateDetails && (
                  <span className="text-xs text-zen-stone-500 font-normal">
                    (sow {formatShortDate(sowDate)})
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-zen-stone-400 transition-transform ${showDateDetails ? 'rotate-180' : ''}`} />
            </button>

            {showDateDetails && (
              <div id="date-details-section" className="space-y-4 px-3 pb-3 pt-1 border-t border-zen-stone-200">
                {/* Sow Method Selector */}
                <div>
                  <label htmlFor="sow-method-select" className="block text-sm font-medium text-zen-ink-700 mb-1">
                    How are you starting this plant?
                  </label>
                  <select
                    id="sow-method-select"
                    value={sowMethod}
                    onChange={(e) => setSowMethod(e.target.value as SowMethod)}
                    className="zen-input"
                  >
                    <option value="outdoor">Direct sowing outdoors</option>
                    <option value="indoor">Starting from seed indoors</option>
                    <option value="transplant-purchased">Planting purchased seedlings</option>
                  </select>

                  {/* Sow Method Recommendation */}
                  {sowMethodRecommendation && (
                    <div className="mt-2 space-y-1">
                      {sowMethod === sowMethodRecommendation.recommended ? (
                        <div className="flex items-start gap-1.5 text-xs text-zen-moss-700 bg-zen-moss-50 px-2 py-1.5 rounded-zen">
                          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{sowMethodRecommendation.reason}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-xs text-zen-kitsune-700 bg-zen-kitsune-50 px-2 py-1.5 rounded-zen">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            Recommended: <strong>{sowMethodRecommendation.recommended === 'indoor' ? 'Start indoors' : sowMethodRecommendation.recommended === 'outdoor' ? 'Direct sow' : 'Purchase seedlings'}</strong>
                            {' — '}{sowMethodRecommendation.reason}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sow Date */}
                <div>
                  <label htmlFor="sow-date-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
                    {sowMethod === 'transplant-purchased' ? 'Planting Date' : 'Sow Date'}
                  </label>
                  <input
                    id="sow-date-input"
                    type="date"
                    value={sowDate}
                    onChange={(e) => setSowDate(e.target.value)}
                    className="zen-input"
                  />
                </div>

                {/* Transplant Date - only for indoor sowings */}
                {sowMethod === 'indoor' && (
                  <div>
                    <label htmlFor="transplant-date-input" className="block text-sm font-medium text-zen-ink-700 mb-1">
                      Transplant Date (optional)
                    </label>
                    <input
                      id="transplant-date-input"
                      type="date"
                      value={transplantDate}
                      onChange={(e) => setTransplantDate(e.target.value)}
                      className="zen-input"
                      min={sowDate || undefined}
                    />
                    <p className="text-xs text-zen-stone-500 mt-1">
                      Leave blank to auto-estimate based on germination time
                    </p>
                  </div>
                )}

                {/* Planting Timeline Preview */}
                {selectedVegetable && sowDate && (
                  <PlantingTimeline
                    sowDate={sowDate}
                    sowMethod={sowMethod}
                    vegetable={selectedVegetable}
                    transplantDate={transplantDate || undefined}
                  />
                )}
              </div>
            )}
          </div>

          {/* Notes */}
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
        </>
      )}

      {/* Success feedback for "Add & Add Another" */}
      {lastAdded && (
        <div className="flex items-center gap-2 text-sm text-zen-moss-700 bg-zen-moss-50 px-3 py-2 rounded-zen">
          <Check className="w-4 h-4" />
          <span>{lastAdded} added!</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="zen-btn-secondary flex-1"
          >
            {lastAdded ? 'Done' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={!plantId}
            className="zen-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Add Planting
          </button>
        </div>
        {plantId && (
          <button
            type="button"
            onClick={() => doSubmit(true)}
            disabled={!plantId}
            className="w-full text-center text-sm text-zen-moss-600 hover:text-zen-moss-700 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add &amp; add another
          </button>
        )}
      </div>
    </form>
  )
}
