'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import { Droplets, Sprout } from 'lucide-react'
import type { CareLogType, NewCareLogEntry } from '@/types/unified-allotment'

interface LogCareActionDialogProps {
  isOpen: boolean
  type: CareLogType
  areaName: string
  taskDescription?: string
  onClose: () => void
  onSubmit: (entry: NewCareLogEntry) => void
}

const PRESETS: Partial<Record<CareLogType, {
  title: string
  productLabel: string
  productPlaceholder: string
  unitOptions: string[]
  defaultUnit: string
  quantityLabel: string
  quantityPlaceholder: string
  iconColor: string
}>> = {
  feed: {
    title: 'Log feeding',
    productLabel: 'Fertiliser',
    productPlaceholder: 'e.g. liquid seaweed, chicken pellets',
    unitOptions: ['ml', 'l', 'g', 'kg', 'handfuls'],
    defaultUnit: 'ml',
    quantityLabel: 'Amount',
    quantityPlaceholder: 'Optional',
    iconColor: 'text-zen-bamboo-600',
  },
  water: {
    title: 'Log watering',
    productLabel: 'Source',
    productPlaceholder: 'e.g. water butt, mains, hose',
    unitOptions: ['cans', 'l', 'mins'],
    defaultUnit: 'cans',
    quantityLabel: 'Amount',
    quantityPlaceholder: 'Optional',
    iconColor: 'text-zen-water-600',
  },
}

const FALLBACK_PRESET = {
  title: 'Log care action',
  productLabel: 'Product',
  productPlaceholder: '',
  unitOptions: ['units'],
  defaultUnit: 'units',
  quantityLabel: 'Amount',
  quantityPlaceholder: 'Optional',
  iconColor: 'text-zen-stone-500',
}

export default function LogCareActionDialog({
  isOpen,
  type,
  areaName,
  taskDescription,
  onClose,
  onSubmit,
}: LogCareActionDialogProps) {
  const preset = PRESETS[type] ?? FALLBACK_PRESET
  // Use local-time YYYY-MM-DD so the date picker default and `max` constraint
  // match the user's wall-clock day rather than UTC (which can be off by one
  // around midnight in non-zero offsets). en-CA gives ISO-style formatting.
  const today = () => new Date().toLocaleDateString('en-CA')
  const [date, setDate] = useState(today)
  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState(preset.defaultUnit)
  const [notes, setNotes] = useState('')

  // Reset form whenever the dialog opens for a different task.
  useEffect(() => {
    if (isOpen) {
      setDate(today())
      setProduct('')
      setQuantity('')
      setUnit(preset.defaultUnit)
      setNotes('')
    }
  }, [isOpen, preset.defaultUnit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const descriptionParts = [taskDescription || `${preset.title} for ${areaName}`]
    if (product.trim()) descriptionParts.push(product.trim())

    const qty = parseFloat(quantity)
    const entry: NewCareLogEntry = {
      type,
      date,
      description: descriptionParts.join(' — '),
    }
    if (!isNaN(qty) && qty > 0) {
      entry.quantity = qty
      entry.unit = unit
    }
    if (notes.trim()) {
      // Append notes to description so they're visible in the log list.
      entry.description = `${entry.description}. ${notes.trim()}`
    }

    onSubmit(entry)
    onClose()
  }

  const Icon = type === 'water' ? Droplets : Sprout

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={preset.title}
      description={taskDescription ? `${taskDescription} (${areaName})` : areaName}
      maxWidth="sm"
      variant="bottom-sheet"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zen-stone-600">
          <Icon className={`w-4 h-4 ${preset.iconColor}`} />
          <span>Recording for {areaName}</span>
        </div>

        <div>
          <label htmlFor="care-log-date" className="block text-sm text-zen-ink-700 mb-1">
            Date
          </label>
          <input
            id="care-log-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            max={today()}
            className="w-full px-3 py-2 min-h-[44px] border border-zen-stone-200 rounded-zen text-sm focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
          />
        </div>

        <div>
          <label htmlFor="care-log-product" className="block text-sm text-zen-ink-700 mb-1">
            {preset.productLabel} <span className="text-zen-stone-400 text-xs">(optional)</span>
          </label>
          <input
            id="care-log-product"
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={preset.productPlaceholder}
            className="w-full px-3 py-2 min-h-[44px] border border-zen-stone-200 rounded-zen text-sm focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
          />
        </div>

        <div>
          <label htmlFor="care-log-quantity" className="block text-sm text-zen-ink-700 mb-1">
            {preset.quantityLabel} <span className="text-zen-stone-400 text-xs">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="care-log-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={preset.quantityPlaceholder}
              min="0"
              step="0.1"
              className="flex-1 px-3 py-2 min-h-[44px] border border-zen-stone-200 rounded-zen text-sm focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2 min-h-[44px] border border-zen-stone-200 rounded-zen text-sm focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
              aria-label="Unit"
            >
              {preset.unitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="care-log-notes" className="block text-sm text-zen-ink-700 mb-1">
            Notes <span className="text-zen-stone-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="care-log-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-zen-stone-200 rounded-zen text-sm focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 min-h-[44px] border border-zen-stone-300 rounded-zen text-zen-stone-700 hover:bg-zen-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 min-h-[44px] bg-zen-moss-600 hover:bg-zen-moss-700 text-white rounded-zen transition-colors"
          >
            Mark done
          </button>
        </div>
      </form>
    </Dialog>
  )
}
