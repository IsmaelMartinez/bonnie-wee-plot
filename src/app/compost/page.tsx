'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Recycle,
  Plus,
  Loader2,
  Leaf,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sprout,
  Lightbulb,
} from 'lucide-react'
import { useCompost } from '@/hooks/useCompost'
import {
  CompostPile,
  CompostStatus,
  CompostSystemType,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
} from '@/types/compost'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import SaveIndicator from '@/components/ui/SaveIndicator'

const STATUS_CONFIG: Record<CompostStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-zen-moss-700', bg: 'bg-zen-moss-100' },
  maturing: { label: 'Maturing', color: 'text-zen-kitsune-700', bg: 'bg-zen-kitsune-100' },
  ready: { label: 'Ready', color: 'text-zen-water-700', bg: 'bg-zen-water-100' },
  applied: { label: 'Applied', color: 'text-zen-stone-600', bg: 'bg-zen-stone-100' },
}

const SYSTEM_TYPES: { value: CompostSystemType; label: string; emoji: string }[] = [
  { value: 'hot-compost', label: 'Hot Compost (Open)', emoji: '🔥' },
  { value: 'hotbin', label: 'Hotbin / Continuous', emoji: '♨️' },
  { value: 'cold-compost', label: 'Cold Compost', emoji: '❄️' },
  { value: 'tumbler', label: 'Tumbler', emoji: '🔄' },
  { value: 'bokashi', label: 'Bokashi', emoji: '🪣' },
  { value: 'worm-bin', label: 'Worm Bin', emoji: '🪱' },
]

const GENERIC_CARE_TIPS = [
  'Too wet or smelly? Add browns (paper, cardboard, dry leaves)',
  'Not heating up? Add greens (grass clippings, kitchen scraps) and turn',
  'Looks dry? Water until moist like a wrung-out sponge',
  'Ready to use? Dark, crumbly, and smells earthy',
  'Be patient - composting takes time!',
]

function getSystemEmoji(type: CompostSystemType): string {
  return SYSTEM_TYPES.find(t => t.value === type)?.emoji || '♻️'
}

function getDaysSince(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export default function CompostPage() {
  const {
    data,
    isLoading,
    saveStatus,
    lastSavedAt,
    addPile,
    updatePile,
    removePile,
    addInput,
    addEvent,
  } = useCompost()

  const [showAddPileDialog, setShowAddPileDialog] = useState(false)
  const [showLogInputDialog, setShowLogInputDialog] = useState<string | null>(null)
  const [showLogEventDialog, setShowLogEventDialog] = useState<string | null>(null)
  const [pileToDelete, setPileToDelete] = useState<string | null>(null)
  const [expandedPiles, setExpandedPiles] = useState<Set<string>>(new Set())

  // Form state for new pile
  const [newPileName, setNewPileName] = useState('')
  const [newPileSystem, setNewPileSystem] = useState<CompostSystemType>('hot-compost')
  const [newPileNotes, setNewPileNotes] = useState('')

  // Form state for input
  const [inputMaterial, setInputMaterial] = useState('')
  const [inputQuantity, setInputQuantity] = useState('')

  // Form state for event
  // Note: 'check-temp' remains in CompostEvent type for backward compatibility with existing data
  // but is no longer exposed via the UI as part of simplification
  const [eventType, setEventType] = useState<Exclude<NewCompostEvent['type'], 'check-temp'>>('turn')
  const [eventNotes, setEventNotes] = useState('')

  // Close handlers that reset form state
  function closeAddPileDialog() {
    setShowAddPileDialog(false)
    setNewPileName('')
    setNewPileNotes('')
    setNewPileSystem('hot-compost')
  }

  function closeLogInputDialog() {
    setShowLogInputDialog(null)
    setInputMaterial('')
    setInputQuantity('')
  }

  function closeLogEventDialog() {
    setShowLogEventDialog(null)
    setEventNotes('')
    setEventType('turn')
  }

  function handleCreatePile() {
    if (!newPileName.trim()) return

    const pile: NewCompostPile = {
      name: newPileName.trim(),
      systemType: newPileSystem,
      status: 'active',
      startDate: new Date().toISOString(),
      notes: newPileNotes.trim() || undefined,
    }

    addPile(pile)
    closeAddPileDialog()
  }

  function handleLogInput(pileId: string) {
    if (!inputMaterial.trim()) return

    const input: NewCompostInput = {
      date: new Date().toISOString(),
      material: inputMaterial.trim(),
      type: 'other',
      quantity: inputQuantity.trim() || undefined,
    }

    addInput(pileId, input)
    closeLogInputDialog()
  }

  function handleLogEvent(pileId: string) {
    const event: NewCompostEvent = {
      date: new Date().toISOString(),
      type: eventType,
      notes: eventNotes.trim() || undefined,
    }

    addEvent(pileId, event)
    closeLogEventDialog()
  }

  function togglePileExpanded(pileId: string) {
    setExpandedPiles(prev => {
      const next = new Set(prev)
      if (next.has(pileId)) {
        next.delete(pileId)
      } else {
        next.add(pileId)
      }
      return next
    })
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zen-moss-600 animate-spin" />
      </div>
    )
  }

  const activePiles = data.piles.filter(p => p.status !== 'applied')
  const appliedPiles = data.piles.filter(p => p.status === 'applied')

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3 mb-2">
                <Recycle className="w-6 h-6 text-zen-moss-600 flex-shrink-0" />
                <h1 className="text-zen-ink-900 truncate">Compost</h1>
              </div>
              <p className="text-zen-stone-500 text-sm">
                Monitor your compost status and care
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
              <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
              <Link
                href="/allotment"
                className="zen-btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Sprout className="w-4 h-4" />
                <span className="hidden sm:inline">Allotment</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Generic Care Tips */}
        <div className="zen-card p-6 mb-8 bg-zen-moss-50 border-zen-moss-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-zen-moss-600" />
            <h2 className="font-display text-zen-ink-800">Compost Care Tips</h2>
          </div>
          <ul className="space-y-2">
            {GENERIC_CARE_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-zen-stone-700">
                <span className="text-zen-moss-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Add Pile Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddPileDialog(true)}
            className="zen-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Compost Pile
          </button>
        </div>

        {/* Active Piles */}
        {activePiles.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="font-display text-zen-ink-800">Your Compost Piles</h2>
            {activePiles.map((pile: CompostPile) => {
              const isExpanded = expandedPiles.has(pile.id)
              const daysSinceStart = getDaysSince(pile.startDate)
              const statusConfig = STATUS_CONFIG[pile.status]

              return (
                <div key={pile.id} className="zen-card overflow-hidden">
                  {/* Pile Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl sm:text-3xl flex-shrink-0">{getSystemEmoji(pile.systemType)}</span>
                        <div className="min-w-0">
                          <h3 className="font-medium text-lg text-zen-ink-800 truncate">{pile.name}</h3>
                          <p className="text-sm text-zen-stone-500">{SYSTEM_TYPES.find(s => s.value === pile.systemType)?.label}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color} whitespace-nowrap`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Age */}
                    <p className="text-sm text-zen-stone-600 mb-4">
                      Started {daysSinceStart} days ago
                    </p>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogEventDialog(pile.id)}
                        className="flex-1 zen-btn-secondary text-sm flex items-center justify-center gap-2"
                      >
                        <RotateCw className="w-4 h-4" />
                        Log Event
                      </button>
                      <button
                        onClick={() => setShowLogInputDialog(pile.id)}
                        className="flex-1 zen-btn-secondary text-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Material
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Tracking Section */}
                  <div className="border-t border-zen-stone-200">
                    <button
                      onClick={() => togglePileExpanded(pile.id)}
                      className="w-full p-3 flex items-center justify-between text-sm text-zen-stone-600 hover:bg-zen-stone-50"
                    >
                      <span className="flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        Tracking Details
                        <span className="text-zen-stone-400">({pile.inputs.length} inputs, {pile.events.length} events)</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-4">
                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-zen-stone-600">Status:</label>
                          <select
                            value={pile.status}
                            onChange={(e) => updatePile(pile.id, { status: e.target.value as CompostStatus })}
                            className="zen-select text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="maturing">Maturing</option>
                            <option value="ready">Ready</option>
                            <option value="applied">Applied</option>
                          </select>
                        </div>

                        {/* Recent Inputs */}
                        {pile.inputs.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Recent Inputs</h4>
                            <div className="space-y-1">
                              {pile.inputs.slice(-5).reverse().map(input => (
                                <div key={input.id} className="flex items-center gap-2 text-sm text-zen-stone-600 bg-zen-stone-50 px-2 py-1 rounded-zen">
                                  <span>{input.material}</span>
                                  {input.quantity && <span className="text-zen-stone-400">({input.quantity})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Events */}
                        {pile.events.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-zen-ink-700 mb-2">Recent Events</h4>
                            <div className="space-y-1">
                              {pile.events.slice(-5).reverse().map(event => (
                                <div key={event.id} className="flex items-center gap-2 text-sm text-zen-stone-600 bg-zen-stone-50 px-2 py-1 rounded-zen">
                                  {event.type === 'turn' && <RotateCw className="w-3 h-3 text-zen-moss-500" />}
                                  <span className="capitalize">{event.type}</span>
                                  <span className="text-zen-stone-400 ml-auto">
                                    {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {pile.notes && (
                          <p className="text-sm text-zen-stone-500 italic">{pile.notes}</p>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setPileToDelete(pile.id)}
                          className="text-xs text-zen-ume-600 hover:text-zen-ume-700"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Delete pile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {activePiles.length === 0 && (
          <div className="zen-card p-8 text-center">
            <Recycle className="w-12 h-12 text-zen-stone-300 mx-auto mb-4" />
            <h3 className="font-display text-zen-ink-700 mb-2">No compost piles yet</h3>
            <p className="text-zen-stone-500 mb-4">Start tracking your composting journey</p>
            <button
              onClick={() => setShowAddPileDialog(true)}
              className="zen-btn-primary"
            >
              Create your first pile
            </button>
          </div>
        )}

        {/* Applied Piles (collapsed by default) */}
        {appliedPiles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-zen-stone-500 mb-4">Applied ({appliedPiles.length})</h2>
            <div className="space-y-2">
              {appliedPiles.map((pile: CompostPile) => (
                <div key={pile.id} className="zen-card p-3 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span>{getSystemEmoji(pile.systemType)}</span>
                    <span className="text-zen-stone-600">{pile.name}</span>
                  </div>
                  <span className="text-xs text-zen-stone-400">
                    {getDaysSince(pile.startDate)} days total
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zen-stone-200 text-center">
          <p className="text-sm text-zen-stone-400">
            Tailored for Scottish gardens
          </p>
        </footer>
      </div>

      {/* Add Pile Dialog */}
      <Dialog
        isOpen={showAddPileDialog}
        onClose={closeAddPileDialog}
        title="New Compost Pile"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreatePile(); }} className="space-y-4">
          <div>
            <label htmlFor="pile-name" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Name *
            </label>
            <input
              id="pile-name"
              type="text"
              value={newPileName}
              onChange={(e) => setNewPileName(e.target.value)}
              placeholder="e.g., Bay 1, Main Tumbler"
              className="zen-input"
              required
            />
          </div>
          <div>
            <label htmlFor="pile-system" className="block text-sm font-medium text-zen-ink-700 mb-1">
              System Type
            </label>
            <select
              id="pile-system"
              value={newPileSystem}
              onChange={(e) => setNewPileSystem(e.target.value as CompostSystemType)}
              className="zen-select"
            >
              {SYSTEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pile-notes" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Notes
            </label>
            <textarea
              id="pile-notes"
              value={newPileNotes}
              onChange={(e) => setNewPileNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="zen-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeAddPileDialog}
              className="zen-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newPileName.trim()}
              className="zen-btn-primary flex-1 disabled:opacity-50"
            >
              Create Pile
            </button>
          </div>
        </form>
      </Dialog>

      {/* Log Input Dialog */}
      <Dialog
        isOpen={showLogInputDialog !== null}
        onClose={closeLogInputDialog}
        title="Add Material"
      >
        <form onSubmit={(e) => { e.preventDefault(); if (showLogInputDialog) handleLogInput(showLogInputDialog); }} className="space-y-4">
          <div>
            <label htmlFor="input-material" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Material *
            </label>
            <input
              id="input-material"
              type="text"
              value={inputMaterial}
              onChange={(e) => setInputMaterial(e.target.value)}
              placeholder="e.g., Kitchen scraps, Grass clippings"
              className="zen-input"
              required
            />
          </div>
          <div>
            <label htmlFor="input-quantity" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Quantity
            </label>
            <input
              id="input-quantity"
              type="text"
              value={inputQuantity}
              onChange={(e) => setInputQuantity(e.target.value)}
              placeholder="e.g., 1 bucket, wheelbarrow"
              className="zen-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeLogInputDialog}
              className="zen-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputMaterial.trim()}
              className="zen-btn-primary flex-1 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      </Dialog>

      {/* Log Event Dialog */}
      <Dialog
        isOpen={showLogEventDialog !== null}
        onClose={closeLogEventDialog}
        title="Log Event"
      >
        <form onSubmit={(e) => { e.preventDefault(); if (showLogEventDialog) handleLogEvent(showLogEventDialog); }} className="space-y-4">
          <div>
            <label htmlFor="event-type" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Event Type
            </label>
            <select
              id="event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as typeof eventType)}
              className="zen-select"
            >
              <option value="turn">🔄 Turn</option>
              <option value="water">💧 Water</option>
              <option value="harvest">✂️ Harvest</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="event-notes" className="block text-sm font-medium text-zen-ink-700 mb-1">
              Notes
            </label>
            <textarea
              id="event-notes"
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="zen-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeLogEventDialog}
              className="zen-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="zen-btn-primary flex-1">
              Log Event
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={pileToDelete !== null}
        onClose={() => setPileToDelete(null)}
        onConfirm={() => {
          if (pileToDelete) {
            removePile(pileToDelete)
            setPileToDelete(null)
          }
        }}
        title="Delete Compost Pile"
        message="Are you sure you want to delete this pile? All inputs and events will be lost."
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </div>
  )
}
