'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Map,
  AlertTriangle,
  Leaf,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TreeDeciduous,
  Users
} from 'lucide-react'
import { getVegetableById } from '@/lib/vegetable-database'
import { getNextRotationGroup, ROTATION_GROUP_DISPLAY, getVegetablesForRotationGroup } from '@/lib/rotation'
import { RotationGroup } from '@/types/garden-planner'
import { Planting, NewPlanting, AreaSeason } from '@/types/unified-allotment'
import { useAllotment } from '@/hooks/useAllotment'
import { ArrowRight } from 'lucide-react'
import AllotmentGrid from '@/components/allotment/AllotmentGrid'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import DataManagement from '@/components/allotment/DataManagement'
import SaveIndicator from '@/components/ui/SaveIndicator'
import SeasonStatusWidget from '@/components/allotment/SeasonStatusWidget'
import AddPlantingForm from '@/components/allotment/AddPlantingForm'
import AddAreaForm from '@/components/allotment/AddAreaForm'
import ItemDetailSwitcher from '@/components/allotment/details/ItemDetailSwitcher'

// Helper to get previous year's rotation group for an area
function getPreviousYearRotationGroup(
  areaId: string,
  currentYear: number,
  seasons: { year: number; areas: AreaSeason[] }[]
): RotationGroup | null {
  const lastYearSeason = seasons.find(s => s.year === currentYear - 1)
  const lastYearArea = lastYearSeason?.areas.find(a => a.areaId === areaId)
  return lastYearArea?.rotationGroup || null
}

export default function AllotmentPage() {
  const {
    data,
    currentSeason,
    selectedYear,
    selectedBedId,
    selectedItemRef,
    isLoading,
    saveError,
    isSyncedFromOtherTab,
    selectYear,
    getYears,
    selectItem,
    getAreaSeason,
    getPlantings,
    addPlanting,
    updatePlanting,
    removePlanting,
    createSeason,
    deleteSeason,
    getRotationBeds,
    getPerennialBeds,
    clearSaveError,
    reload,
    saveStatus,
    lastSavedAt,
    getAreaNotes,
    addAreaNote,
    updateAreaNote,
    removeAreaNote,
    updateRotationGroup,
    updateMeta,
    // v10 Area getters
    getArea,
    getAreasByKind,
    getAllAreas,
    addArea,
    updateArea,
    archiveArea,
    // Variety operations
    getVarietiesForYear,
  } = useAllotment()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddAreaDialog, setShowAddAreaDialog] = useState(false)
  const [yearToDelete, setYearToDelete] = useState<number | null>(null)
  const [showAutoRotateDialog, setShowAutoRotateDialog] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [isGridEditing, setIsGridEditing] = useState(false)

  // Get available years and add next/previous year options
  // Sort years in ascending order (oldest to newest) for left-to-right timeline
  const availableYears = getYears().sort((a, b) => a - b)
  const currentYear = new Date().getFullYear()
  const nextYear = availableYears.length > 0 ? Math.max(...availableYears) + 1 : currentYear
  const previousYear = availableYears.length > 0 ? Math.min(...availableYears) - 1 : currentYear - 1
  const canCreateNextYear = !availableYears.includes(nextYear)
  const canCreatePreviousYear = !availableYears.includes(previousYear)

  const selectedPlantings = selectedBedId ? getPlantings(selectedBedId) : []

  // Quick stats for empty state
  const quickStats = useMemo(() => ({
    rotationBeds: getRotationBeds().length,
    perennialBeds: getPerennialBeds().length,
    permanentPlantings: getAreasByKind('tree').length + getAreasByKind('berry').length,
  }), [getRotationBeds, getPerennialBeds, getAreasByKind])

  // Helper to get previous year rotation for current area
  const getPreviousRotation = useCallback((areaId: string): RotationGroup | null => {
    return getPreviousYearRotationGroup(areaId, selectedYear, data?.seasons || [])
  }, [selectedYear, data?.seasons])

  // Memoize auto-rotate info to avoid duplicate calculations (must be before early returns)
  const autoRotateInfo = useMemo(() => {
    if (!selectedBedId || !data) return null

    const previousYear = selectedYear - 1

    // Find previous year's season directly from data
    const previousSeason = data.seasons.find(s => s.year === previousYear)
    if (!previousSeason) return null

    const previousAreaSeason = previousSeason.areas.find((a: AreaSeason) => a.areaId === selectedBedId)
    if (!previousAreaSeason?.rotationGroup) return null

    const previousGroup = previousAreaSeason.rotationGroup
    const suggestedGroup = getNextRotationGroup(previousGroup)
    const suggestedVegetables = getVegetablesForRotationGroup(suggestedGroup)

    return {
      previousYear,
      previousGroup,
      suggestedGroup,
      suggestedVegetables,
    }
  }, [selectedBedId, selectedYear, data])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zen-moss-600 animate-spin" />
      </div>
    )
  }

  const handleAddPlanting = (planting: NewPlanting) => {
    if (selectedBedId) {
      addPlanting(selectedBedId, planting)
    }
  }

  const handleDeletePlanting = (plantingId: string) => {
    if (selectedBedId) {
      removePlanting(selectedBedId, plantingId)
    }
  }

  const handleUpdateSuccess = (plantingId: string, success: Planting['success']) => {
    if (selectedBedId) {
      updatePlanting(selectedBedId, plantingId, { success })
    }
  }

  const handleCreateNextYear = () => {
    createSeason(nextYear, `Planning for ${nextYear} season`)
  }

  const handleArchiveArea = (areaId: string) => {
    archiveArea(areaId)
    selectItem(null) // Clear selection after archiving
  }

  const handleAutoRotate = (addSuggestedVegetables: boolean) => {
    if (!selectedBedId || !autoRotateInfo) return

    // Update the bed's rotation group to the suggested one
    updateRotationGroup(selectedBedId, autoRotateInfo.suggestedGroup)

    // Optionally add suggested vegetables
    if (addSuggestedVegetables && autoRotateInfo.suggestedVegetables.length > 0) {
      autoRotateInfo.suggestedVegetables.slice(0, 3).forEach(vegId => {
        const newPlanting: NewPlanting = {
          plantId: vegId,
        }
        addPlanting(selectedBedId, newPlanting)
      })
    }

    setShowAutoRotateDialog(false)
  }

  const handleStartEditName = () => {
    setNameInput(data?.meta.name || 'My Allotment')
    setIsEditingName(true)
  }

  const handleSaveName = () => {
    const trimmedName = nameInput.trim()
    if (trimmedName && trimmedName !== data?.meta.name) {
      updateMeta({ name: trimmedName })
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
    }
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      {/* Header */}
      <header className="bg-white border-b border-zen-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Map className="w-7 h-7 text-zen-moss-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={handleNameKeyDown}
                      className="text-base sm:text-lg font-display text-zen-ink-800 border-b-2 border-zen-moss-500 bg-transparent outline-none px-1"
                      autoFocus
                    />
                  ) : (
                    <h1
                      className="text-base sm:text-lg font-display text-zen-ink-800 truncate cursor-pointer hover:text-zen-moss-600 transition"
                      onClick={handleStartEditName}
                      title="Click to edit"
                    >
                      {data?.meta.name || 'My Allotment'}
                    </h1>
                  )}
                  <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
                </div>
                <p className="text-xs text-zen-stone-500 truncate">{data?.meta.location || 'Edinburgh, Scotland'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto overflow-x-auto">
              <DataManagement data={data} onDataImported={reload} />
              <Link
                href="/ai-advisor"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zen-ink-600 hover:bg-zen-stone-100 rounded-zen transition whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Ask Aitor</span>
                <span className="sm:hidden">Aitor</span>
              </Link>
              <Link
                href="/this-month"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zen-ink-600 hover:bg-zen-stone-100 rounded-zen transition whitespace-nowrap"
              >
                <TreeDeciduous className="w-4 h-4" />
                <span className="hidden sm:inline">Care</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Save Error Alert */}
      {saveError && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div
            className="zen-card p-4 border-zen-ume-200 bg-zen-ume-50 flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertTriangle className="w-5 h-5 text-zen-ume-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-zen-ume-800">Failed to save changes</p>
              <p className="text-sm text-zen-ume-600 mt-1">{saveError}</p>
            </div>
            <button
              onClick={clearSaveError}
              className="p-1 text-zen-ume-400 hover:text-zen-ume-600 hover:bg-zen-ume-100 rounded-zen transition"
              aria-label="Dismiss error"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Multi-tab Sync Notification */}
      {isSyncedFromOtherTab && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div
            className="zen-card p-3 border-zen-water-200 bg-zen-water-50 flex items-center gap-3 animate-pulse"
            role="status"
            aria-live="polite"
          >
            <svg className="w-5 h-5 text-zen-water-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-sm text-zen-water-700">
              Data synced from another browser tab
            </p>
          </div>
        </div>
      )}

      {/* Year Selector */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="zen-card p-3 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear)
              if (idx > 0) {
                selectYear(availableYears[idx - 1])
              }
            }}
            disabled={availableYears.indexOf(selectedYear) <= 0}
            className="p-2 rounded-zen hover:bg-zen-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-zen-stone-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {canCreatePreviousYear && (
            <button
              onClick={() => createSeason(previousYear, `Historical records from ${previousYear}`)}
              className="px-4 py-2 rounded-zen font-medium bg-zen-stone-100 text-zen-stone-600 hover:bg-zen-stone-200 transition flex items-center gap-1"
              title={`Add ${previousYear} historical data`}
            >
              <Plus className="w-4 h-4" />
              {previousYear}
            </button>
          )}

          {availableYears.map(year => (
            <div key={year} className="relative group">
              <button
                onClick={() => selectYear(year)}
                className={`px-4 py-2 rounded-zen font-medium transition ${
                  selectedYear === year
                    ? 'bg-zen-moss-600 text-white'
                    : 'bg-zen-stone-100 text-zen-ink-600 hover:bg-zen-stone-200'
                }`}
              >
                {year}
              </button>
              {availableYears.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setYearToDelete(year)
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-zen-ume-600 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center text-sm hover:bg-zen-ume-700 focus:outline-none focus:ring-2 focus:ring-zen-ume-400"
                  title={`Delete ${year}`}
                  aria-label={`Delete year ${year}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {canCreateNextYear && (
            <button
              onClick={handleCreateNextYear}
              className="px-4 py-2 rounded-zen font-medium bg-zen-moss-100 text-zen-moss-700 hover:bg-zen-moss-200 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {nextYear}
            </button>
          )}

          <button
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear)
              if (idx < availableYears.length - 1) {
                selectYear(availableYears[idx + 1])
              }
            }}
            disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
            className="p-2 rounded-zen hover:bg-zen-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-zen-stone-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {currentSeason?.notes && (
          <p className="text-center text-sm text-zen-stone-500 mt-2">{currentSeason.notes}</p>
        )}
      </div>

      {/* Season Status Widget */}
      <div className="max-w-6xl mx-auto px-4 py-2">
        <SeasonStatusWidget
          bedsNeedingRotation={getRotationBeds().filter(b => getPlantings(b.id).length === 0).length}
          totalRotationBeds={getRotationBeds().length}
          varietiesCount={getVarietiesForYear(selectedYear - 1).length}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* Main Layout */}
          <div className="lg:col-span-2 w-full min-w-0">
            <div className="zen-card p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-display text-zen-ink-700 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-zen-moss-600 flex-shrink-0" />
                  <span className="truncate">Plot Overview - {selectedYear}</span>
                </h2>
                <button
                  onClick={() => setShowAddAreaDialog(true)}
                  disabled={!isGridEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zen-moss-100 text-zen-moss-700 hover:bg-zen-moss-200 rounded-zen transition whitespace-nowrap self-end sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isGridEditing ? "Enable edit mode to add areas" : "Add a new area to your allotment"}
                >
                  <Plus className="w-4 h-4" />
                  Add Area
                </button>
              </div>

              {/* Draggable Grid Layout */}
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[500px] px-3 sm:px-0 sm:min-w-0">
                  <AllotmentGrid
                    onItemSelect={selectItem}
                    selectedItemRef={selectedItemRef}
                    getPlantingsForBed={getPlantings}
                    areas={getAllAreas()}
                    selectedYear={selectedYear}
                    onEditingChange={setIsGridEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Item Details */}
          <div className="lg:col-span-1 w-full">
            <ItemDetailSwitcher
              selectedItemRef={selectedItemRef}
              getArea={getArea}
              getAreaSeason={getAreaSeason}
              getPlantings={getPlantings}
              getAreaNotes={getAreaNotes}
              getPreviousYearRotation={getPreviousRotation}
              selectedYear={selectedYear}
              onAddPlanting={() => setShowAddDialog(true)}
              onDeletePlanting={handleDeletePlanting}
              onUpdateSuccess={handleUpdateSuccess}
              onAddNote={(note) => selectedBedId && addAreaNote(selectedBedId, note)}
              onUpdateNote={(noteId, updates) => selectedBedId && updateAreaNote(selectedBedId, noteId, updates)}
              onRemoveNote={(noteId) => selectedBedId && removeAreaNote(selectedBedId, noteId)}
              onUpdateRotation={(group) => selectedBedId && updateRotationGroup(selectedBedId, group)}
              onAutoRotate={() => setShowAutoRotateDialog(true)}
              onArchiveArea={handleArchiveArea}
              onUpdateArea={updateArea}
              onItemSelect={selectItem}
              quickStats={quickStats}
            />

          </div>
        </div>
      </div>

      {/* Add Planting Dialog - Accessible */}
      {(() => {
        const selectedArea = selectedBedId ? getArea(selectedBedId) : null
        return (
          <Dialog
            isOpen={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            title="Add Planting"
            description="Add a new planting to this bed for the current season."
          >
            <AddPlantingForm
              onSubmit={(planting) => {
                handleAddPlanting(planting)
                setShowAddDialog(false)
              }}
              onCancel={() => setShowAddDialog(false)}
              existingPlantings={selectedPlantings}
              selectedYear={selectedYear}
              varieties={data?.varieties || []}
              initialCategoryFilter={selectedArea?.kind === 'berry' ? 'berries' : 'all'}
            />
          </Dialog>
        )
      })()}

      {/* Add Area Dialog */}
      <Dialog
        isOpen={showAddAreaDialog}
        onClose={() => setShowAddAreaDialog(false)}
        title="Add New Area"
        description="Add a new bed, tree, or other area to your allotment."
        maxWidth="lg"
      >
        <AddAreaForm
          onSubmit={(area) => {
            addArea(area)
            setShowAddAreaDialog(false)
          }}
          onCancel={() => setShowAddAreaDialog(false)}
          existingAreas={getAllAreas()}
        />
      </Dialog>

      {/* Delete Year Confirmation */}
      <ConfirmDialog
        isOpen={yearToDelete !== null}
        onClose={() => setYearToDelete(null)}
        onConfirm={() => {
          if (yearToDelete) {
            deleteSeason(yearToDelete)
            setYearToDelete(null)
          }
        }}
        title="Delete Year"
        message={`Are you sure you want to delete ${yearToDelete}? All plantings and notes for this year will be permanently deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Auto-rotate Dialog */}
      {autoRotateInfo && selectedBedId && (() => {
        const areaData = getArea(selectedBedId)
        if (!areaData) return null

        const previousDisplay = ROTATION_GROUP_DISPLAY[autoRotateInfo.previousGroup]
        const suggestedDisplay = ROTATION_GROUP_DISPLAY[autoRotateInfo.suggestedGroup]
        const suggestedVegNames = autoRotateInfo.suggestedVegetables
          .slice(0, 3)
          .map(id => getVegetableById(id)?.name)
          .filter(Boolean)

        return (
          <Dialog
            isOpen={showAutoRotateDialog}
            onClose={() => setShowAutoRotateDialog(false)}
            title="Auto-rotate Bed for Soil Health"
            description={`Rotate ${areaData.name} to maintain healthy soil and prevent disease buildup.`}
          >
            <div className="space-y-4">
              {/* Rotation Flow */}
              <div className="bg-zen-moss-50 border border-zen-moss-200 rounded-zen p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{previousDisplay?.emoji}</div>
                    <div className="text-sm font-medium text-zen-ink-700">{previousDisplay?.name}</div>
                    <div className="text-xs text-zen-stone-500">{autoRotateInfo.previousYear}</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-zen-moss-600" />
                  <div className="text-center">
                    <div className="text-2xl mb-1">{suggestedDisplay?.emoji}</div>
                    <div className="text-sm font-medium text-zen-moss-700">{suggestedDisplay?.name}</div>
                    <div className="text-xs text-zen-moss-600">{selectedYear}</div>
                  </div>
                </div>
              </div>

              {/* Why this matters */}
              <div className="text-sm text-zen-stone-600">
                <p className="font-medium text-zen-ink-700 mb-1">Why rotate?</p>
                <p>
                  Crop rotation prevents soil nutrient depletion and reduces pest and disease buildup.
                  Each plant family uses different nutrients and attracts different pests.
                </p>
              </div>

              {/* Suggested vegetables preview */}
              {suggestedVegNames.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zen-ink-700 mb-2">
                    Suggested {suggestedDisplay?.name.toLowerCase()} to plant:
                  </p>
                  <div className="bg-zen-stone-50 rounded-zen p-3 space-y-1">
                    {suggestedVegNames.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zen-ink-700">
                        <span className="text-zen-stone-400">•</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zen-stone-500 mt-2">
                    You can add these automatically or choose your own later.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleAutoRotate(true)}
                  className="zen-btn-primary w-full"
                >
                  Rotate & Add Suggested Plants
                </button>
                <button
                  onClick={() => handleAutoRotate(false)}
                  className="zen-btn-secondary w-full"
                >
                  Just Rotate (I&apos;ll add plants myself)
                </button>
                <button
                  onClick={() => setShowAutoRotateDialog(false)}
                  className="w-full px-4 py-2 text-zen-stone-600 hover:text-zen-ink-800 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Dialog>
        )
      })()}
    </div>
  )
}
