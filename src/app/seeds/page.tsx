'use client'

import { useState, useMemo, useEffect } from 'react'
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

export default function SeedsPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-gray-500">Loading varieties...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-green-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Seeds & Varieties
            </h1>
          </div>
          <p className="text-gray-600">
            Track your seed varieties, plan by year, and manage suppliers
          </p>
        </div>

        {/* Year Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-lg shadow p-1 gap-1">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                selectedYear === 'all'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {AVAILABLE_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  selectedYear === year
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-green-600">{haveCount}</div>
            <div className="text-sm text-gray-500">Have Seeds</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-500">{needCount}</div>
            <div className="text-sm text-gray-500">
              {selectedYear !== 'all' ? `Need for ${selectedYear}` : 'Need to Order'}
            </div>
          </div>
          {selectedYear !== 'all' ? (
            <div className="bg-white rounded-lg p-4 shadow text-center">
              <div className="text-2xl font-bold text-blue-600">{plannedCount}</div>
              <div className="text-sm text-gray-500">Planned {selectedYear}</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 shadow text-center">
              <div className="text-2xl font-bold text-amber-600">£{getTotalSpendForYear(CURRENT_YEAR - 1).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Spent {CURRENT_YEAR - 1}</div>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl font-bold text-amber-600">£{getTotalSpendForYear(CURRENT_YEAR).toFixed(2)}</div>
            <div className="text-sm text-gray-500">Spent {CURRENT_YEAR}</div>
          </div>
        </div>

        {/* Add button and Expand/Collapse */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Expand all
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Collapse all
            </button>
          </div>
          <button
            onClick={handleOpenAddDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Variety
          </button>
        </div>

        {/* Empty state */}
        {displayVarieties.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {selectedYear === 'all' ? (
              <>
                <p className="text-gray-600 mb-4">No varieties added yet.</p>
                <button
                  onClick={handleOpenAddDialog}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add your first variety
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-2">No varieties planned for {selectedYear}.</p>
                <p className="text-sm text-gray-500">
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
              <div key={name} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleGroup(name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Sprout className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800">{name}</span>
                    <span className="text-sm text-gray-400">({varieties.length})</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="space-y-3">
                      {varieties.map(v => {
                        const hasIt = hasSeeds(v.id)
                        const isPlannedForSelectedYear = selectedYear !== 'all' && v.plannedYears.includes(selectedYear)
                        return (
                          <div key={v.id} className={`pl-7 flex items-start gap-3 ${!hasIt ? 'opacity-75' : ''}`}>
                            <button
                              onClick={() => toggleHaveSeeds(v.id)}
                              className={`mt-0.5 p-1 rounded ${
                                hasIt
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-orange-100 text-orange-500 hover:bg-orange-200'
                              }`}
                              title={hasIt ? 'Have seeds - click to mark as needed' : 'Need seeds - click to mark as have'}
                            >
                              {hasIt ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-medium text-gray-700">{v.name}</span>
                                {v.supplier && (
                                  <span className="text-sm text-gray-500">
                                    {SUPPLIER_URLS[v.supplier] ? (
                                      <a
                                        href={SUPPLIER_URLS[v.supplier]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:underline inline-flex items-center gap-1"
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
                                  <span className="text-sm text-amber-600">£{v.price.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex flex-wrap gap-x-3">
                                {v.yearsUsed.length > 0 && (
                                  <span>Used: {v.yearsUsed.join(', ')}</span>
                                )}
                                {v.plannedYears.length > 0 && (
                                  <span className="text-blue-600">Planned: {v.plannedYears.join(', ')}</span>
                                )}
                                {v.yearsUsed.length === 0 && v.plannedYears.length === 0 && (
                                  <span className="text-red-500">Not used yet</span>
                                )}
                              </div>
                              {v.notes && (() => {
                                const isWarning = /rotten|poor|failed|bad|damaged|diseased/i.test(v.notes)
                                return (
                                  <div className={`text-sm italic flex items-start gap-1 ${
                                    isWarning ? 'text-red-500 font-medium' : 'text-gray-400'
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
                                  className={`p-1.5 rounded transition ${
                                    isPlannedForSelectedYear
                                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                  title={isPlannedForSelectedYear ? `Remove from ${selectedYear}` : `Plan for ${selectedYear}`}
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditDialog(v)}
                                className="p-1.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                                title="Edit variety"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {confirmDelete === v.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteVariety(v.id)}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(v.id)}
                                  className="p-1.5 rounded bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition"
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
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Suppliers</h2>
            <div className="flex flex-wrap gap-3">
              {suppliers.map(s => (
                <div key={s}>
                  {SUPPLIER_URLS[s] ? (
                    <a
                      href={SUPPLIER_URLS[s]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100"
                    >
                      {s}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {s}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Garden Organic link */}
            <div className="mt-6 pt-4 border-t">
              <a
                href="https://www.gardenorganic.org.uk/shop/seeds"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
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
