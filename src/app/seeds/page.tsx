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
  CheckCheck,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
  X,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { useAllotment } from '@/hooks/useAllotment'
import { getVegetableIndexById, vegetableIndex } from '@/lib/vegetables/index'
import { StoredVariety, NewVariety, VarietyUpdate, SeedStatus } from '@/types/variety-data'
import VarietyEditDialog from '@/components/seeds/VarietyEditDialog'
import { getVarietyUsedYears } from '@/lib/variety-queries'

const SUPPLIER_URLS: Record<string, string> = {
  'Organic Gardening': 'https://www.organiccatalogue.com/',
  'Potato House': 'https://www.potatohouse.co.uk/',
  'Allotment': '',
  'Garden Organic': 'https://www.gardenorganic.org.uk/shop/seeds',
}

const CURRENT_YEAR = new Date().getFullYear()

// Helper to get next seed status in cycle
function getNextStatus(current: SeedStatus): SeedStatus {
  const cycle: Record<SeedStatus, SeedStatus> = {
    'none': 'ordered',
    'ordered': 'have',
    'have': 'had',
    'had': 'none'
  }
  return cycle[current]
}

// Status configuration for display
const statusConfig: Record<SeedStatus, { label: string; icon: LucideIcon; className: string }> = {
  'none': {
    label: 'Need',
    icon: ShoppingCart,
    className: 'bg-zen-kitsune-100 text-zen-kitsune-700 hover:bg-zen-kitsune-200'
  },
  'ordered': {
    label: 'Ordered',
    icon: Package,
    className: 'bg-zen-water-100 text-zen-water-700 hover:bg-zen-water-200'
  },
  'have': {
    label: 'Have',
    icon: Check,
    className: 'bg-zen-moss-100 text-zen-moss-700 hover:bg-zen-moss-200'
  },
  'had': {
    label: 'Had',
    icon: CheckCheck,
    className: 'bg-zen-stone-200 text-zen-stone-600 hover:bg-zen-stone-300'
  }
}

function SeedsPageContent() {
  const {
    data,
    isLoading,
    addVariety,
    updateVariety,
    archiveVariety,
    unarchiveVariety,
    removeVariety,
    toggleHaveSeedsForYear,
    addVarietyToYear,
    removeVarietyFromYear,
    getYears,
    getActiveVarieties,
  } = useAllotment()

  // Use local state for seeds year selection (can be different from allotment page)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(() => {
    const years = getYears()
    return years.length > 0 ? years[0] : 'all'
  })

  const availableYears = getYears()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVariety, setEditingVariety] = useState<StoredVariety | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [yearMenuOpen, setYearMenuOpen] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'have' | 'need'>('all')
  const [showArchived, setShowArchived] = useState(false)

  // Handle URL param filtering (Spike 3)
  const searchParams = useSearchParams()
  const vegetableFilter = searchParams.get('vegetable')

  // Auto-expand the filtered vegetable group when coming from allotment page
  useEffect(() => {
    if (vegetableFilter) {
      const veg = vegetableIndex.find(v => v.id === vegetableFilter)
      if (veg) {
        setExpandedGroups(new Set([veg.name]))
      }
    }
  }, [vegetableFilter])

  // Reset filter when switching to "All" view
  useEffect(() => {
    if (selectedYear === 'all' && statusFilter !== 'all') {
      setStatusFilter('all')
    }
  }, [selectedYear, statusFilter])

  // Get varieties to display based on selected year and archive status
  const displayVarieties = useMemo(() => {
    if (!data) return []

    // Get active varieties (filtering archived unless showArchived is true)
    const activeVarieties = getActiveVarieties(showArchived)

    if (selectedYear === 'all') {
      return activeVarieties
    }
    // Filter varieties for the selected year (tracked via seedsByYear or actually planted)
    return activeVarieties.filter(v => {
      const yearsUsed = getVarietyUsedYears(v.id, data)
      return (
        (v.seedsByYear && selectedYear in v.seedsByYear) ||
        yearsUsed.includes(selectedYear)
      )
    })
  }, [data, selectedYear, getActiveVarieties, showArchived])

  const suppliers = useMemo(() => {
    if (!data) return []
    // Get unique suppliers from all varieties
    const supplierSet = new Set<string>()
    data.varieties?.forEach(v => {
      if (v.supplier) supplierSet.add(v.supplier)
    })
    return Array.from(supplierSet).sort()
  }, [data])

  // Filter and group varieties by vegetable
  const grouped = useMemo(() => {
    const filtered = statusFilter === 'all' || selectedYear === 'all'
      ? displayVarieties
      : displayVarieties.filter(v => {
          const status = v.seedsByYear?.[selectedYear] || 'none'

          if (statusFilter === 'have') {
            return status === 'have'
          } else { // statusFilter === 'need'
            return status === 'none' || status === 'ordered'
          }
        })

    return filtered.reduce((acc, v) => {
      const veg = getVegetableIndexById(v.plantId)
      const groupName = veg?.name || v.plantId
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(v)
      return acc
    }, {} as Record<string, StoredVariety[]>)
  }, [displayVarieties, statusFilter, selectedYear])

  const groupNames = Object.keys(grouped).sort()

  // Stats - context-aware based on selected year
  const { have: haveCount, need: needCount } = useMemo(() => {
    if (selectedYear === 'all' || !data) return { have: 0, need: 0 }

    let have = 0
    let need = 0

    displayVarieties.forEach(v => {
      const status = v.seedsByYear?.[selectedYear] || 'none'
      if (status === 'have') {
        have++
      } else if (status === 'ordered' || status === 'none') {
        need++
      }
    })

    return { have, need }
  }, [data, displayVarieties, selectedYear])

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
    archiveVariety(id)
    setConfirmDelete(null)
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zen-moss-600 animate-spin" />
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
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex zen-card p-1 gap-1">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3 sm:px-4 py-2 rounded-zen text-xs sm:text-sm font-medium transition whitespace-nowrap min-h-[44px] ${
                selectedYear === 'all'
                  ? 'bg-zen-moss-600 text-white'
                  : 'text-zen-ink-600 hover:bg-zen-stone-100'
              }`}
            >
              All
            </button>
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 sm:px-4 py-2 rounded-zen text-xs sm:text-sm font-medium transition whitespace-nowrap min-h-[44px] ${
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

        {/* Stats - clickable filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => selectedYear !== 'all' && setStatusFilter(statusFilter === 'have' ? 'all' : 'have')}
            disabled={selectedYear === 'all'}
            aria-pressed={statusFilter === 'have'}
            className={`zen-card p-4 text-center transition ${
              selectedYear === 'all'
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer ' + (statusFilter === 'have' ? 'ring-2 ring-zen-moss-500 bg-zen-moss-50' : 'hover:bg-zen-stone-50')
            }`}
            title={selectedYear === 'all' ? 'Select a year to filter by seed status' : undefined}
          >
            <div className="text-2xl font-bold text-zen-moss-600">{haveCount}</div>
            <div className="text-sm text-zen-stone-500">
              {statusFilter === 'have' ? '✓ Have Seeds' : 'Have Seeds'}
            </div>
          </button>
          <button
            onClick={() => selectedYear !== 'all' && setStatusFilter(statusFilter === 'need' ? 'all' : 'need')}
            disabled={selectedYear === 'all'}
            aria-pressed={statusFilter === 'need'}
            className={`zen-card p-4 text-center transition ${
              selectedYear === 'all'
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer ' + (statusFilter === 'need' ? 'ring-2 ring-zen-kitsune-500 bg-zen-kitsune-50' : 'hover:bg-zen-stone-50')
            }`}
            title={selectedYear === 'all' ? 'Select a year to filter by seed status' : undefined}
          >
            <div className="text-2xl font-bold text-zen-kitsune-600">{needCount}</div>
            <div className="text-sm text-zen-stone-500">
              {selectedYear !== 'all' ? `Need for ${selectedYear}` : 'Need to Order'}
            </div>
          </button>
          <div className="zen-card p-4 text-center">
            <div className="text-2xl font-bold text-zen-kitsune-600">
              £{(() => {
                const total = (data.varieties || [])
                  .filter(v => {
                    const yearsUsed = getVarietyUsedYears(v.id, data)
                    return yearsUsed.includes(CURRENT_YEAR - 1)
                  })
                  .reduce((sum, v) => sum + (v.price || 0), 0)
                return total.toFixed(2)
              })()}
            </div>
            <div className="text-sm text-zen-stone-500">Spent {CURRENT_YEAR - 1}</div>
          </div>
          <div className="zen-card p-4 text-center">
            <div className="text-2xl font-bold text-zen-kitsune-600">
              £{(() => {
                const total = (data.varieties || [])
                  .filter(v => {
                    const yearsUsed = getVarietyUsedYears(v.id, data)
                    return yearsUsed.includes(CURRENT_YEAR)
                  })
                  .reduce((sum, v) => sum + (v.price || 0), 0)
                return total.toFixed(2)
              })()}
            </div>
            <div className="text-sm text-zen-stone-500">Spent {CURRENT_YEAR}</div>
          </div>
        </div>

        {/* Add button and Expand/Collapse */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex gap-2 items-center">
            <button
              onClick={expandAll}
              className="text-xs sm:text-sm text-zen-moss-600 hover:text-zen-moss-700 min-h-[44px] px-2"
            >
              Expand all
            </button>
            <span className="text-zen-stone-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs sm:text-sm text-zen-moss-600 hover:text-zen-moss-700 min-h-[44px] px-2"
            >
              Collapse all
            </button>
            <span className="text-zen-stone-300">|</span>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-xs sm:text-sm min-h-[44px] px-2 transition ${
                showArchived
                  ? 'text-zen-ume-600 hover:text-zen-ume-700'
                  : 'text-zen-stone-500 hover:text-zen-stone-700'
              }`}
              aria-label={showArchived ? 'Hide archived varieties' : 'Show archived varieties'}
              aria-pressed={showArchived}
            >
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
          </div>
          <button
            onClick={handleOpenAddDialog}
            className="zen-btn-primary text-xs sm:text-sm min-h-[44px] self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Variety</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Empty state */}
        {groupNames.length === 0 && (
          <div className="zen-card p-8 text-center">
            <Sprout className="w-12 h-12 text-zen-stone-300 mx-auto mb-4" />
            {statusFilter !== 'all' && displayVarieties.length > 0 ? (
              <>
                <p className="text-zen-ink-600 mb-2">
                  No varieties match the &quot;{statusFilter === 'have' ? 'Have Seeds' : 'Need to Order'}&quot; filter.
                </p>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-zen-moss-600 hover:text-zen-moss-700 text-sm underline"
                >
                  Clear filter
                </button>
              </>
            ) : selectedYear === 'all' ? (
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
                        const status = selectedYear !== 'all' ? (v.seedsByYear?.[selectedYear] || 'none') : 'none'
                        const config = statusConfig[status]
                        const Icon = config.icon
                        const isArchived = v.isArchived === true
                        return (
                          <div key={v.id} className={`pl-7 flex items-start gap-3 ${isArchived ? 'opacity-50' : selectedYear !== 'all' && status !== 'have' ? 'opacity-75' : ''}`}>
                            {selectedYear === 'all' ? (
                              <>
                                <button
                                  onClick={() => setYearMenuOpen(yearMenuOpen === v.id ? null : v.id)}
                                  className="mt-0.5 px-2 py-1 rounded-zen bg-zen-moss-100 text-zen-moss-700 hover:bg-zen-moss-200 text-xs font-medium flex items-center gap-1 transition"
                                  title="Add to a year"
                                >
                                  <CalendarPlus className="w-3 h-3" />
                                  <span>Add to Year</span>
                                </button>
                                {yearMenuOpen === v.id && (
                                  <>
                                    {/* Backdrop to close on outside click */}
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setYearMenuOpen(null)}
                                    />
                                    <div className="fixed z-50 bg-white shadow-xl border border-zen-stone-200 py-2 min-w-[140px] left-4 right-4 bottom-4 rounded-zen-lg sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-zen sm:w-auto">
                                      <div className="px-3 py-1.5 text-xs font-medium text-zen-stone-500 border-b border-zen-stone-100 mb-1">
                                        Add to year
                                      </div>
                                      {availableYears.map(year => {
                                        const alreadyTracked = v.seedsByYear && year in v.seedsByYear
                                        return (
                                          <button
                                            key={year}
                                            onClick={() => {
                                              if (!alreadyTracked) {
                                                addVarietyToYear(v.id, year, 'none')
                                              }
                                              setYearMenuOpen(null)
                                            }}
                                            disabled={alreadyTracked}
                                            className={`w-full px-3 py-2 text-left text-sm min-h-[44px] flex items-center justify-between ${
                                              alreadyTracked
                                                ? 'text-zen-stone-400 cursor-not-allowed bg-zen-stone-50'
                                                : 'text-zen-ink-700 hover:bg-zen-moss-50 active:bg-zen-moss-100'
                                            }`}
                                          >
                                            <span>{year}</span>
                                            {alreadyTracked && <Check className="w-4 h-4 text-zen-moss-500" />}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleHaveSeedsForYear(v.id, selectedYear)}
                                  className={`mt-0.5 px-2 py-1 rounded-zen transition flex items-center gap-1 text-xs font-medium ${config.className}`}
                                  title={`Click to cycle: ${status} → ${getNextStatus(status)}`}
                                >
                                  <Icon className="w-3 h-3" />
                                  <span>{config.label}</span>
                                </button>
                                <button
                                  onClick={() => removeVarietyFromYear(v.id, selectedYear)}
                                  className="mt-0.5 p-1 rounded-zen text-zen-stone-400 hover:text-zen-ume-600 hover:bg-zen-ume-50 transition"
                                  title={`Remove from ${selectedYear}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-medium text-zen-ink-700">{v.name}</span>
                                {isArchived && (
                                  <span className="px-2 py-0.5 text-xs bg-zen-stone-200 text-zen-stone-600 rounded-zen">
                                    Archived
                                  </span>
                                )}
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
                                {(() => {
                                  const yearsUsed = getVarietyUsedYears(v.id, data)
                                  return yearsUsed.length > 0
                                    ? <span>Used: {yearsUsed.join(', ')}</span>
                                    : <span className="text-zen-ume-600">Not used yet</span>
                                })()}
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
                              <button
                                onClick={() => handleOpenEditDialog(v)}
                                className="p-1.5 rounded-zen bg-zen-stone-100 text-zen-stone-500 hover:bg-zen-stone-200 transition"
                                title="Edit variety"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {isArchived ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => unarchiveVariety(v.id)}
                                    className="px-2 py-1 text-xs bg-zen-moss-100 text-zen-moss-700 rounded-zen hover:bg-zen-moss-200"
                                    title="Restore variety"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => removeVariety(v.id)}
                                    className="px-2 py-1 text-xs bg-zen-ume-100 text-zen-ume-700 rounded-zen hover:bg-zen-ume-200"
                                    title="Permanently delete"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : confirmDelete === v.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteVariety(v.id)}
                                    className="px-2 py-1 text-xs bg-zen-kitsune-100 text-zen-kitsune-700 rounded-zen hover:bg-zen-kitsune-200"
                                    title="Hide from list (can restore later)"
                                  >
                                    Archive
                                  </button>
                                  <button
                                    onClick={() => {
                                      removeVariety(v.id)
                                      setConfirmDelete(null)
                                    }}
                                    className="px-2 py-1 text-xs bg-zen-ume-600 text-white rounded-zen hover:bg-zen-ume-700"
                                    title="Permanently delete"
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
                                  title="Archive or delete variety"
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
        selectedYear={selectedYear}
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
