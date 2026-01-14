'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import PlantCombobox from '@/components/allotment/PlantCombobox'
import { VegetableCategory } from '@/types/garden-planner'
import { StoredVariety, NewVariety, VarietyUpdate } from '@/types/variety-data'

interface VarietyEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (variety: NewVariety | (VarietyUpdate & { id: string })) => void
  variety?: StoredVariety
  mode: 'add' | 'edit'
  existingSuppliers?: string[]
}

export default function VarietyEditDialog({
  isOpen,
  onClose,
  onSave,
  variety,
  mode,
  existingSuppliers = [],
}: VarietyEditDialogProps) {
  const [plantId, setVegetableId] = useState('')
  const [name, setName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [available, setAvailable] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<VegetableCategory | 'all'>('all')

  // Reset form when dialog opens/closes or variety changes
  useEffect(() => {
    if (isOpen && mode === 'edit' && variety) {
      setVegetableId(variety.plantId)
      setName(variety.name)
      setSupplier(variety.supplier || '')
      setPrice(variety.price?.toString() || '')
      setNotes(variety.notes || '')
      setAvailable(variety.available ?? true)
    } else if (isOpen && mode === 'add') {
      resetForm()
    }
  }, [isOpen, mode, variety])

  const resetForm = () => {
    setVegetableId('')
    setName('')
    setSupplier('')
    setPrice('')
    setNotes('')
    setAvailable(true)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!plantId || !name.trim()) return

    const parsedPrice = price ? (isNaN(parseFloat(price)) ? undefined : parseFloat(price)) : undefined

    if (mode === 'add') {
      const newVariety: NewVariety = {
        plantId,
        name: name.trim(),
        supplier: supplier.trim() || undefined,
        price: parsedPrice,
        notes: notes.trim() || undefined,
        available,
      }
      onSave(newVariety)
    } else if (variety) {
      const update: VarietyUpdate & { id: string } = {
        id: variety.id,
        plantId,
        name: name.trim(),
        supplier: supplier.trim() || undefined,
        price: parsedPrice,
        notes: notes.trim() || undefined,
        available,
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
            Variety Name *
          </label>
          <input
            id="variety-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Available for planting
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            When checked, this variety can be selected when adding plantings to any year
          </p>
        </div>

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
            disabled={!plantId || !name.trim()}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {mode === 'add' ? 'Add Variety' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
