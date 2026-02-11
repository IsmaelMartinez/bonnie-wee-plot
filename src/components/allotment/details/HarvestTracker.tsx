'use client'

import { useState } from 'react'
import { Apple, Plus, X, Check } from 'lucide-react'

interface HarvestTrackerProps {
  selectedYear: number
  harvestTotal: { quantity: number; unit: string } | null
  harvestLogCount: number
  onLogHarvest: (quantity: number, unit: string, date: string) => void
}

const COMMON_UNITS = ['kg', 'lbs', 'count', 'bunches', 'baskets']

export default function HarvestTracker({ selectedYear, harvestTotal, harvestLogCount, onLogHarvest }: HarvestTrackerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleAdd = () => {
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return
    onLogHarvest(qty, unit, date)
    setQuantity('')
    setIsAdding(false)
  }

  return (
    <div className="bg-zen-moss-50 rounded-zen p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Apple className="w-4 h-4 text-zen-moss-600" />
          <h4 className="text-sm font-medium text-zen-moss-700">
            {selectedYear} Harvest
          </h4>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-zen-moss-600 hover:text-zen-moss-700"
          >
            <Plus className="w-3 h-3" />
            Log harvest
          </button>
        )}
      </div>

      {harvestTotal ? (
        <div className="text-2xl font-bold text-zen-moss-700 mb-2">
          {harvestTotal.quantity.toFixed(1)} {harvestTotal.unit}
          <span className="text-xs font-normal text-zen-moss-500 ml-2">total</span>
        </div>
      ) : (
        <p className="text-xs text-zen-moss-500 italic mb-2">
          No harvests recorded yet for {selectedYear}.
        </p>
      )}

      {isAdding && (
        <div className="p-2 bg-white rounded-zen border border-zen-moss-200 mb-2">
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Qty"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-20 text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
              step="0.1"
              min="0"
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
            >
              {COMMON_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 text-xs px-3 min-h-[44px] bg-zen-moss-500 text-white rounded-zen hover:bg-zen-moss-600"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-1 text-xs px-3 min-h-[44px] bg-zen-stone-200 text-zen-stone-700 rounded-zen hover:bg-zen-stone-300"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {harvestLogCount > 0 && (
        <div className="text-xs text-zen-moss-600">
          {harvestLogCount} harvest{harvestLogCount !== 1 ? 's' : ''} recorded
        </div>
      )}
    </div>
  )
}
