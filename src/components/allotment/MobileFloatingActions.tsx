'use client'

import { useState } from 'react'
import { Plus, X, Map, Sprout } from 'lucide-react'

interface MobileFloatingActionsProps {
  onAddArea: () => void
  onAddPlanting?: () => void
  hasSelectedArea: boolean
}

export default function MobileFloatingActions({
  onAddArea,
  onAddPlanting,
  hasSelectedArea,
}: MobileFloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAddArea = () => {
    setIsExpanded(false)
    onAddArea()
  }

  const handleAddPlanting = () => {
    setIsExpanded(false)
    onAddPlanting?.()
  }

  return (
    <div className="fixed bottom-6 right-4 z-30 flex flex-col-reverse items-end gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Action Options (shown when expanded) */}
      {isExpanded && (
        <>
          {/* Add Planting (only if an area is selected) */}
          {hasSelectedArea && onAddPlanting && (
            <button
              onClick={handleAddPlanting}
              className="flex items-center gap-2 px-4 py-3 bg-zen-moss-600 text-white rounded-full shadow-lg hover:bg-zen-moss-700 active:scale-95 transition-all animate-fade-in-up"
              style={{ animationDelay: '50ms' }}
            >
              <Sprout className="w-5 h-5" />
              <span className="text-sm font-medium">Add Plant</span>
            </button>
          )}

          {/* Add Area */}
          <button
            onClick={handleAddArea}
            className="flex items-center gap-2 px-4 py-3 bg-zen-water-600 text-white rounded-full shadow-lg hover:bg-zen-water-700 active:scale-95 transition-all animate-fade-in-up"
          >
            <Map className="w-5 h-5" />
            <span className="text-sm font-medium">Add Area</span>
          </button>
        </>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
          isExpanded
            ? 'bg-zen-stone-700 rotate-45'
            : 'bg-zen-moss-600 hover:bg-zen-moss-700'
        }`}
        aria-label={isExpanded ? 'Close menu' : 'Add new item'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
