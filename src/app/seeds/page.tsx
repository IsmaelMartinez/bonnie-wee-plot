'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sprout,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Package,
  Check,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react'
import { useVarieties } from '@/hooks/useVarieties'
import { getVegetableById, vegetables } from '@/lib/vegetable-database'
import { StoredVariety, NewVariety, VarietyUpdate } from '@/types/variety-data'
import VarietyEditDialog from '@/components/seeds/VarietyEditDialog'

const SUPPLIER_URLS: Record<string, string> = {
  'Organic Gardening': 'https://www.organiccatalogue.com/',
  'Potato House': 'https://www.jbapotatoexperience.co.uk/',
  'Allotment': '',
  'Garden Organic': 'https://www.gardenorganic.org.uk/shop/seeds',
}

const CURRENT_YEAR = new Date().getFullYear()
const AVAILABLE_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

function SeedsPageContent() {
  const {
    data,
    selectedYear,
    isLoading,
    setSelectedYear,
    addVariety,
    updateVariety,
    removeVariety,
    togglePlannedYear,
    toggleHaveSeeds,
    getDisplayVarieties,
    getSuppliers,
    getTotalSpendForYear,
    hasSeeds,
  } = useVarieties()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVariety, setEditingVariety] = useState<StoredVariety | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Handle URL param filtering (Spike 3)
  const searchParams = useSearchParams()
  const vegetableFilter = searchParams.get('vegetable')

  // Auto-expand the filtered vegetable group when coming from allotment page
  useEffect(() => {
    if (vegetableFilter) {
      const veg = vegetables.find(v => v.id === vegetableFilter)
      if (veg) {
        setExpandedGroups(new Set([veg.name]))
      }
    }
  }, [vegetableFilter])

  const displayVarieties = getDisplayVarieties()
  const suppliers = getSuppliers()

  // Group varieties by vegetable
  const grouped = useMemo(() => {
    return displayVarieties.reduce((acc, v) => {
      const veg = getVegetableById(v.vegetableId)
      const groupName = veg?.name || v.vegetableId
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(v)
      return acc
    }, {} as Record<string, StoredVariety[]>)
  }, [displayVarieties])

  const groupNames = Object.keys(grouped).sort()

  // Stats - context-aware based on selected year
  const haveCount = data?.haveSeeds.length || 0
  const totalVarieties = data?.varieties.length || 0

  // For year view: count varieties planned for that year that user doesn't have
  // For all view: count all varieties user doesn't have
  const needCount = selectedYear !== 'all' && data
    ? displayVarieties.filter(v => !data.haveSeeds.includes(v.id)).length
    : totalVarieties - haveCount

  const plannedCount = selectedYear !== 'all' && data
    ? data.varieties.filter(v => v.plannedYears.includes(selectedYear)).length
    : 0

  const toggleGroup = (name: string) => {
    const next = new Set(expandedGroups)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setExpandedGroups(next)
  }

  const expandAll = () => setExpandedGroups(new Set(groupNames))
  const collapseAll = () => setExpandedGroups(new Set())

  const handleOpenAddDialog = () => {
    setEditingVariety(undefined)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (variety: StoredVariety) => {
    setEditingVariety(variety)
    setDialogOpen(true)
  }

  const handleSaveVariety = (variety: NewVariety | (VarietyUpdate & { id: string })) => {
    if ('id' in variety) {
      const { id, ...updates } = variety
      updateVariety(id, updates)
    } else {
      addVariety(variety)
    }
    setDialogOpen(false)
    setEditingVariety(undefined)
  }

  const handleDeleteVariety = (id: string) => {
    removeVariety(id)
    setConfirmDelete(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
        <div className="text-zen-stone-500">Loading varieties...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-baseline gap-3 mb-2">
            <Package className="w-6 h-6 text-zen-moss-600" />
            <h1 className="text-zen-ink-900">Seeds & Varieties</h1>
          </div>
          <p className="text-zen-stone-500 text-lg">
            Track your seed collection, plan by year
          </p>
        </header>

        {/* Year Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex zen-card p-1 gap-1">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-zen text-sm font-medium transition ${
                selectedYear === 'all'
                  ? 'bg-zen-moss-600 text-white'
                  : 'text-zen-ink-600 hover:bg-zen-stone-100'
              }`}
            >
              All
            </button>
            {AVAILABLE_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-zen text-sm font-medium transition ${
                  selectedYear === year
                    ? 'bg-zen-moss-600 text-white'
                    : 'text-zen-ink-600 hover:bg-zen-stone-100'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="zen-card p-4 text-center">
            <div className="text-2xl font-bold text-zen-moss-600">{haveCount}</div>
            <div className="text-sm text-zen-stone-500">Have Seeds</div>
          </div>
          <div className="zen-card p-4 text-center">
            <div className="text-2xl font-bold text-zen-kitsune-600">{needCount}</div>
            <div className="text-sm text-zen-stone-500">
              {selectedYear !== 'all' ? `Need for ${selectedYear}` : 'Need to Order'}
            </div>
          </div>
          {selectedYear !== 'all' ? (
            <div className="zen-card p-4 text-center">
              <div className="text-2xl font-bold text-zen-water-600">{plannedCount}</div>
              <div className="text-sm text-zen-stone-500">Planned {selectedYear}</div>
            </div>
          ) : (
            <div className="zen-card p-4 text-center">
              <div className="text-2xl font-bold text-zen-kitsune-600">£{getTotalSpendForYear(CURRENT_YEAR - 1).toFixed(2)}</div>
              <div className="text-sm text-zen-stone-500">Spent {CURRENT_YEAR - 1}</div>
            </div>
          )}
          <div className="zen-card p-4 text-center">
            <div className="text-2xl font-bold text-zen-kitsune-600">£{getTotalSpendForYear(CURRENT_YEAR).toFixed(2)}</div>
            <div className="text-sm text-zen-stone-500">Spent {CURRENT_YEAR}</div>
          </div>
        </div>

        {/* Add button and Expand/Collapse */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-zen-moss-600 hover:text-zen-moss-700"
            >
              Expand all
            </button>
            <span className="text-zen-stone-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-zen-moss-600 hover:text-zen-moss-700"
            >
              Collapse all
            </button>
          </div>
          <button
            onClick={handleOpenAddDialog}
            className="zen-btn-primary text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Variety
          </button>
        </div>

        {/* Empty state */}
        {displayVarieties.length === 0 && (
          <div className="zen-card p-8 text-center">
            <Sprout className="w-12 h-12 text-zen-stone-300 mx-auto mb-4" />
            {selectedYear === 'all' ? (
              <>
                <p className="text-zen-ink-600 mb-4">No varieties added yet.</p>
                <button
                  onClick={handleOpenAddDialog}
                  className="zen-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Add your first variety
                </button>
              </>
            ) : (
              <>
                <p className="text-zen-ink-600 mb-2">No varieties planned for {selectedYear}.</p>
                <p className="text-sm text-zen-stone-500">
                  Switch to &quot;All&quot; to see all varieties, or add planned years to existing varieties.
                </p>
              </>
            )}
          </div>
        )}

        {/* Variety groups */}
        <div className="space-y-2">
          {groupNames.map(name => {
            const varieties = grouped[name]
            const isExpanded = expandedGroups.has(name)

            return (
              <div key={name} className="zen-card overflow-hidden">
                <button
                  onClick={() => toggleGroup(name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-zen-stone-50 transition"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-zen-stone-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zen-stone-400" />
                    )}
                    <Sprout className="w-5 h-5 text-zen-moss-500" />
                    <span className="font-medium text-zen-ink-800">{name}</span>
                    <span className="text-sm text-zen-stone-400">({varieties.length})</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zen-stone-100">
                    <div className="space-y-3">
                      {varieties.map(v => {
                        const hasIt = hasSeeds(v.id)
                        const isPlannedForSelectedYear = selectedYear !== 'all' && v.plannedYears.includes(selectedYear)
                        return (
                          <div key={v.id} className={`pl-7 flex items-start gap-3 ${!hasIt ? 'opacity-75' : ''}`}>
                            <button
                              onClick={() => toggleHaveSeeds(v.id)}
                              className={`mt-0.5 p-1 rounded-zen transition ${
                                hasIt
                                  ? 'bg-zen-moss-100 text-zen-moss-600 hover:bg-zen-moss-200'
                                  : 'bg-zen-kitsune-100 text-zen-kitsune-600 hover:bg-zen-kitsune-200'
                              }`}
                              title={hasIt ? 'Have seeds - click to mark as needed' : 'Need seeds - click to mark as have'}
                            >
                              {hasIt ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-medium text-zen-ink-700">{v.name}</span>
                                {v.supplier && (
                                  <span className="text-sm text-zen-stone-500">
                                    {SUPPLIER_URLS[v.supplier] ? (
                                      <a
                                        href={SUPPLIER_URLS[v.supplier]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-zen-moss-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        {v.supplier}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      v.supplier
                                    )}
                                  </span>
                                )}
                                {v.price && (
                                  <span className="text-sm text-zen-kitsune-600">£{v.price.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="text-sm text-zen-stone-500 flex flex-wrap gap-x-3">
                                {v.yearsUsed.length > 0 && (
                                  <span>Used: {v.yearsUsed.join(', ')}</span>
                                )}
                                {v.plannedYears.length > 0 && (
                                  <span className="text-zen-water-600">Planned: {v.plannedYears.join(', ')}</span>
                                )}
                                {v.yearsUsed.length === 0 && v.plannedYears.length === 0 && (
                                  <span className="text-zen-ume-600">Not used yet</span>
                                )}
                              </div>
                              {v.notes && (() => {
                                const isWarning = /rotten|poor|failed|bad|damaged|diseased/i.test(v.notes)
                                return (
                                  <div className={`text-sm italic flex items-start gap-1 ${
                                    isWarning ? 'text-zen-ume-600 font-medium' : 'text-zen-stone-400'
                                  }`}>
                                    {isWarning && <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                                    {v.notes}
                                  </div>
                                )
                              })()}
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {selectedYear !== 'all' && (
                                <button
                                  onClick={() => togglePlannedYear(v.id, selectedYear)}
                                  className={`p-1.5 rounded-zen transition ${
                                    isPlannedForSelectedYear
                                      ? 'bg-zen-water-100 text-zen-water-600 hover:bg-zen-water-200'
                                      : 'bg-zen-stone-100 text-zen-stone-400 hover:bg-zen-stone-200'
                                  }`}
                                  title={isPlannedForSelectedYear ? `Remove from ${selectedYear}` : `Plan for ${selectedYear}`}
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditDialog(v)}
                                className="p-1.5 rounded-zen bg-zen-stone-100 text-zen-stone-500 hover:bg-zen-stone-200 transition"
                                title="Edit variety"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {confirmDelete === v.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteVariety(v.id)}
                                    className="px-2 py-1 text-xs bg-zen-ume-600 text-white rounded-zen hover:bg-zen-ume-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1 text-xs bg-zen-stone-200 text-zen-ink-600 rounded-zen hover:bg-zen-stone-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(v.id)}
                                  className="p-1.5 rounded-zen bg-zen-stone-100 text-zen-stone-500 hover:bg-zen-ume-100 hover:text-zen-ume-600 transition"
                                  title="Delete variety"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Suppliers section */}
        {suppliers.length > 0 && (
          <div className="mt-8 zen-card p-6">
            <h2 className="font-display text-zen-ink-800 mb-4">Suppliers</h2>
            <div className="flex flex-wrap gap-3">
              {suppliers.map(s => (
                <div key={s}>
                  {SUPPLIER_URLS[s] ? (
                    <a
                      href={SUPPLIER_URLS[s]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-zen-moss-50 text-zen-moss-700 rounded-full text-sm hover:bg-zen-moss-100 transition"
                    >
                      {s}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-zen-stone-100 text-zen-ink-600 rounded-full text-sm">
                      {s}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Garden Organic link */}
            <div className="mt-6 pt-4 border-t border-zen-stone-100">
              <a
                href="https://www.gardenorganic.org.uk/shop/seeds"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zen-moss-600 hover:text-zen-moss-700 font-medium transition"
              >
                Browse Garden Organic Heritage Seeds
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <VarietyEditDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingVariety(undefined)
        }}
        onSave={handleSaveVariety}
        variety={editingVariety}
        mode={editingVariety ? 'edit' : 'add'}
        existingSuppliers={suppliers}
      />
    </div>
  )
}

function SeedsPageFallback() {
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
      <div className="text-zen-stone-500">Loading varieties...</div>
    </div>
  )
}

export default function SeedsPage() {
  return (
    <Suspense fallback={<SeedsPageFallback />}>
      <SeedsPageContent />
    </Suspense>
  )
}
