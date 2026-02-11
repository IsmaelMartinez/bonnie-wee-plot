'use client'

import { useState } from 'react'
import { Plus, Scissors, Droplets, Layers, Bug, Eye, Package, X, Check } from 'lucide-react'
import { CareLogEntry, NewCareLogEntry, CareLogType } from '@/types/unified-allotment'

interface CareLogSectionProps {
  selectedYear: number
  careLogs: CareLogEntry[]
  onAddCareLog: (entry: NewCareLogEntry) => void
  onRemoveCareLog: (entryId: string) => void
}

const CARE_TYPE_CONFIG: Record<CareLogType, { icon: typeof Scissors; label: string; color: string }> = {
  'prune': { icon: Scissors, label: 'Pruned', color: 'zen-sakura' },
  'feed': { icon: Droplets, label: 'Fed', color: 'zen-water' },
  'mulch': { icon: Layers, label: 'Mulched', color: 'zen-kitsune' },
  'spray': { icon: Bug, label: 'Sprayed', color: 'zen-stone' },
  'harvest': { icon: Package, label: 'Harvested', color: 'zen-moss' },
  'observation': { icon: Eye, label: 'Observation', color: 'zen-ink' },
  'other': { icon: Plus, label: 'Other', color: 'zen-stone' },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CareLogSection({ selectedYear, careLogs, onAddCareLog, onRemoveCareLog }: CareLogSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState<Partial<NewCareLogEntry>>({
    type: 'prune',
    date: new Date().toISOString().split('T')[0],
  })

  const handleAdd = () => {
    if (!newEntry.type || !newEntry.date) return
    onAddCareLog(newEntry as NewCareLogEntry)
    setNewEntry({
      type: 'prune',
      date: new Date().toISOString().split('T')[0],
    })
    setIsAdding(false)
  }

  const handleRemove = (entryId: string) => {
    if (confirm('Remove this care log entry?')) {
      onRemoveCareLog(entryId)
    }
  }

  return (
    <div className="bg-zen-stone-50 rounded-zen p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-zen-ink-700">
          {selectedYear} Care Log
        </h4>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-zen-moss-600 hover:text-zen-moss-700"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-3 p-2 bg-white rounded-zen border border-zen-stone-200">
          <div className="flex gap-2 mb-2">
            <select
              value={newEntry.type}
              onChange={e => setNewEntry({ ...newEntry, type: e.target.value as CareLogType })}
              className="flex-1 text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
            >
              {Object.entries(CARE_TYPE_CONFIG).filter(([key]) => key !== 'harvest').map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="date"
              value={newEntry.date}
              onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
              className="text-xs px-2 py-1 border border-zen-stone-200 rounded-zen"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={newEntry.description || ''}
            onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
            className="w-full text-xs px-2 py-1 border border-zen-stone-200 rounded-zen mb-2"
          />
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

      {careLogs.length === 0 ? (
        <p className="text-xs text-zen-stone-400 italic">
          No care activities logged yet for {selectedYear}.
        </p>
      ) : (
        <div className="space-y-1.5">
          {careLogs.map(entry => {
            const config = CARE_TYPE_CONFIG[entry.type]
            const Icon = config.icon
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-xs group"
              >
                <Icon className={`w-3 h-3 text-${config.color}-500`} />
                <span className={`text-${config.color}-700`}>{config.label}</span>
                <span className="text-zen-stone-400">{formatDate(entry.date)}</span>
                {entry.description && (
                  <span className="text-zen-stone-500 truncate flex-1">{entry.description}</span>
                )}
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-zen-stone-400 hover:text-zen-sakura-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
