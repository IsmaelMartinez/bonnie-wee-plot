'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import PlantCombobox from '@/components/allotment/PlantCombobox'
import { VegetableCategory } from '@/types/garden-planner'
import { StoredVariety, NewVariety, VarietyUpdate, SeedStatus } from '@/types/variety-data'
import { Check, CheckCheck, Package, ShoppingCart } from 'lucide-react'

interface VarietyEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (variety: NewVariety | (VarietyUpdate & { id: string })) => void
  variety?: StoredVariety
  mode: 'add' | 'edit'
  existingSuppliers?: string[]
  selectedYear?: number | 'all'  // Currently selected year on the Seeds page
}

export default function VarietyEditDialog({
  isOpen,
  onClose,
  onSave,
  variety,
  mode,
  existingSuppliers = [],
  selectedYear,
}: VarietyEditDialogProps) {
  const [plantId, setVegetableId] = useState('')
  const [name, setName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')
  const [seedStatusForYear, setSeedStatusForYear] = useState<SeedStatus | null>(null)

  // Determine if we should show year-specific seed status
  const yearToTrack = typeof selectedYear === 'number' ? selectedYear : null

  // Reset form when dialog opens/closes or variety changes
  useEffect(() => {
    if (isOpen && mode === 'edit' && variety) {
      setVegetableId(variety.plantId)
      setName(variety.name)
      setSupplier(variety.supplier || '')
      setPrice(variety.price?.toString() || '')
      setNotes(variety.notes || '')
      // Load existing seed status for the selected year
      if (yearToTrack && variety.seedsByYear?.[yearToTrack]) {
        setSeedStatusForYear(variety.seedsByYear[yearToTrack])
      } else {
        setSeedStatusForYear(null)
      }
    } else if (isOpen && mode === 'add') {
      resetForm()
      // Default to 'none' (Need) status when a specific year is selected
      if (yearToTrack) {
        setSeedStatusForYear('none')
      }
    }
  }, [isOpen, mode, variety, yearToTrack])

  const resetForm = () => {
    setVegetableId('')
    setName('')
    setSupplier('')
    setPrice('')
    setNotes('')
    setSeedStatusForYear(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!plantId) return

    const parsedPrice = price ? (isNaN(parseFloat(price)) ? undefined : parseFloat(price)) : undefined

    // Build seedsByYear - include year status if set
    let seedsByYear: Record<number, SeedStatus> | undefined
    if (yearToTrack && seedStatusForYear) {
      if (mode === 'edit' && variety?.seedsByYear) {
        seedsByYear = { ...variety.seedsByYear, [yearToTrack]: seedStatusForYear }
      } else {
        seedsByYear = { [yearToTrack]: seedStatusForYear }
      }
    } else if (mode === 'edit') {
      if (yearToTrack && seedStatusForYear === null && variety?.seedsByYear) {
        // User cleared the status for this year: remove that year from seedsByYear
        const rest = Object.fromEntries(
          Object.entries(variety.seedsByYear).filter(([year]) => Number(year) !== yearToTrack)
        )
        seedsByYear = Object.keys(rest).length ? rest as typeof variety.seedsByYear : undefined
      } else {
        seedsByYear = variety?.seedsByYear
      }
    }

    if (mode === 'add') {
      const newVariety: NewVariety = {
        plantId,
        name: name.trim() || '',
        supplier: supplier.trim() || undefined,
        price: parsedPrice,
        notes: notes.trim() || undefined,
        seedsByYear,
      }
      onSave(newVariety)
    } else if (variety) {
      const update: VarietyUpdate & { id: string } = {
        id: variety.id,
        plantId,
        name: name.trim() || '',
        supplier: supplier.trim() || undefined,
        price: parsedPrice,
        notes: notes.trim() || undefined,
        seedsByYear,
      }
      onSave(update)
    }

    handleClose()
  }

  const datalistId = 'supplier-options'

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'add' ? 'Add Variety' : 'Edit Variety'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="plant-combobox"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Plant *
          </label>

          <PlantCombobox
            value={plantId}
            onChange={setVegetableId}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            existingPlantings={[]}
            required
          />
        </div>

        <div>
          <label
            htmlFor="variety-name-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Variety Name
          </label>
          <input
            id="variety-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Kelvedon Wonder"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="variety-supplier-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Supplier
          </label>
          <input
            id="variety-supplier-input"
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., Organic Gardening"
            list={datalistId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {existingSuppliers.length > 0 && (
            <datalist id={datalistId}>
              {existingSuppliers.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label
            htmlFor="variety-price-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              £
            </span>
            <input
              id="variety-price-input"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="variety-notes-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes
          </label>
          <textarea
            id="variety-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes about this variety..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {yearToTrack && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seed status for {yearToTrack}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSeedStatusForYear(seedStatusForYear === 'none' ? null : 'none')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  seedStatusForYear === 'none'
                    ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Need
              </button>
              <button
                type="button"
                onClick={() => setSeedStatusForYear(seedStatusForYear === 'ordered' ? null : 'ordered')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  seedStatusForYear === 'ordered'
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                Ordered
              </button>
              <button
                type="button"
                onClick={() => setSeedStatusForYear(seedStatusForYear === 'have' ? null : 'have')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  seedStatusForYear === 'have'
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Check className="w-4 h-4" />
                Have
              </button>
              <button
                type="button"
                onClick={() => setSeedStatusForYear(seedStatusForYear === 'had' ? null : 'had')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  seedStatusForYear === 'had'
                    ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                Had
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {seedStatusForYear
                ? `This variety will be tracked for ${yearToTrack}`
                : 'Optional: select to track seeds for this year'}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!plantId}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {mode === 'add' ? 'Add Variety' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
