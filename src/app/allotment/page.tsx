'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Map,
  Sprout,
  History,
  AlertTriangle,
  Leaf,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TreeDeciduous,
  Users
} from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { getVegetableById } from '@/lib/vegetable-database'
import { getNextRotationGroup, ROTATION_GROUP_DISPLAY, getVegetablesForRotationGroup } from '@/lib/rotation'
import { PhysicalBedId, RotationGroup, SoilMethod } from '@/types/garden-planner'
import { Planting, NewPlanting } from '@/types/unified-allotment'
import { useAllotment } from '@/hooks/useAllotment'
import { ArrowRight } from 'lucide-react'
import AllotmentGrid from '@/components/allotment/AllotmentGrid'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import DataManagement from '@/components/allotment/DataManagement'
import SaveIndicator from '@/components/ui/SaveIndicator'
import BedNotes from '@/components/allotment/BedNotes'
import SeasonStatusWidget from '@/components/allotment/SeasonStatusWidget'
import AddPlantingForm from '@/components/allotment/AddPlantingForm'
import PlantingCard from '@/components/allotment/PlantingCard'

// Helper to get rotation info for a bed
function getRotationIndicator(
  bedId: PhysicalBedId,
  currentYear: number,
  seasons: { year: number; beds: { bedId: PhysicalBedId; rotationGroup: RotationGroup }[] }[]
): { lastYear: RotationGroup; suggested: RotationGroup } | null {
  // Find last year's rotation group from seasons
  const lastYearSeason = seasons.find(s => s.year === currentYear - 1)
  const lastYearBed = lastYearSeason?.beds.find(b => b.bedId === bedId)

  if (!lastYearBed?.rotationGroup) return null

  const lastYear = lastYearBed.rotationGroup
  const suggested = getNextRotationGroup(lastYear)

  return { lastYear, suggested }
}

export default function AllotmentPage() {
  const {
    data,
    currentSeason,
    selectedYear,
    selectedBedId,
    isLoading,
    saveError,
    isSyncedFromOtherTab,
    selectYear,
    getYears,
    selectBed,
    getBed,
    getPlantings,
    addPlanting,
    updatePlanting,
    removePlanting,
    createSeason,
    deleteSeason,
    getRotationBeds,
    getProblemBeds,
    getPerennialBeds,
    clearSaveError,
    reload,
    saveStatus,
    lastSavedAt,
    getBedNotes,
    addBedNote,
    updateBedNote,
    removeBedNote,
    updateRotationGroup,
    updateSoilMethod,
  } = useAllotment()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [yearToDelete, setYearToDelete] = useState<number | null>(null)
  const [showAutoRotateDialog, setShowAutoRotateDialog] = useState(false)

  // Get available years and add next year option
  const availableYears = getYears()
  const nextYear = availableYears.length > 0 ? Math.max(...availableYears) + 1 : new Date().getFullYear()
  const canCreateNextYear = !availableYears.includes(nextYear)

  // Get bed data
  const selectedBedData = selectedBedId ? getBed(selectedBedId) : null
  const selectedPlantings = selectedBedId ? getPlantings(selectedBedId) : []
  const selectedBedNotes = selectedBedId ? getBedNotes(selectedBedId) : []
  const allBeds = data?.layout.beds || []
  const permanentPlantingsCount = data?.layout.permanentPlantings.length || 0

  // Infer "problem" status from note type (warning or error)
  const hasProblemNote = selectedBedNotes.some(n => n.type === 'warning' || n.type === 'error')
  const inferredStatus = hasProblemNote ? 'problem' : selectedBedData?.status

  // Memoize auto-rotate info to avoid duplicate calculations (must be before early returns)
  const autoRotateInfo = useMemo(() => {
    if (!selectedBedId || !data) return null

    const previousYear = selectedYear - 1

    // Find previous year's season directly from data
    const previousSeason = data.seasons.find(s => s.year === previousYear)
    if (!previousSeason) return null

    const previousBedSeason = previousSeason.beds.find(b => b.bedId === selectedBedId)
    if (!previousBedSeason?.rotationGroup) return null

    const previousGroup = previousBedSeason.rotationGroup
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

  const handleAutoRotate = (addSuggestedVegetables: boolean) => {
    if (!selectedBedId || !autoRotateInfo) return

    // Update the bed's rotation group to the suggested one
    updateRotationGroup(selectedBedId, autoRotateInfo.suggestedGroup)

    // Optionally add suggested vegetables
    if (addSuggestedVegetables && autoRotateInfo.suggestedVegetables.length > 0) {
      autoRotateInfo.suggestedVegetables.slice(0, 3).forEach(vegId => {
        const newPlanting: NewPlanting = {
          vegetableId: vegId,
        }
        addPlanting(selectedBedId, newPlanting)
      })
    }

    setShowAutoRotateDialog(false)
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture">
      {/* Header */}
      <header className="bg-white border-b border-zen-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="w-7 h-7 text-zen-moss-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-display text-zen-ink-800">{data?.meta.name || 'My Allotment'}</h1>
                  <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
                </div>
                <p className="text-xs text-zen-stone-500">{data?.meta.location || 'Edinburgh, Scotland'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DataManagement data={data} onDataImported={reload} />
              <Link
                href="/ai-advisor"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zen-ink-600 hover:bg-zen-stone-100 rounded-zen transition"
              >
                <Users className="w-4 h-4" />
                Ask Aitor
              </Link>
              <Link
                href="/this-month"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zen-ink-600 hover:bg-zen-stone-100 rounded-zen transition"
              >
                <TreeDeciduous className="w-4 h-4" />
                Care
              </Link>
              <Link
                href="/plan-history"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zen-ink-600 hover:bg-zen-stone-100 rounded-zen transition"
              >
                <History className="w-4 h-4" />
                History
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
              if (idx < availableYears.length - 1) {
                selectYear(availableYears[idx + 1])
              }
            }}
            disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
            className="p-2 rounded-zen hover:bg-zen-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-zen-stone-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

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
                  className="absolute -top-1 -right-1 w-5 h-5 bg-zen-ume-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-zen-ume-700"
                  title={`Delete ${year}`}
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
              if (idx > 0) {
                selectYear(availableYears[idx - 1])
              }
            }}
            disabled={availableYears.indexOf(selectedYear) <= 0}
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
          currentYear={selectedYear}
        />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-2">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Layout */}
          <div className="lg:col-span-2">
            <div className="zen-card p-6">
              <h2 className="text-lg font-display text-zen-ink-700 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-zen-moss-600" />
                Plot Overview - {selectedYear}
              </h2>

              {/* Draggable Grid Layout */}
              <AllotmentGrid
                onBedSelect={(bedId) => selectBed(bedId as PhysicalBedId)}
                selectedBed={selectedBedId}
                getPlantingsForBed={getPlantings}
              />
            </div>
          </div>

          {/* Sidebar - Bed Details */}
          <div className="lg:col-span-1">
            {selectedBedData ? (
              <div className="zen-card p-6 sticky top-20">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-zen-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: BED_COLORS[selectedBedId!] }}
                  >
                    {selectedBedId?.replace('-prime', "'")}
                  </div>
                  <div>
                    <h3 className="font-display text-zen-ink-800">{selectedBedData.name}</h3>
                    <div className={`text-xs flex items-center gap-1 ${
                      inferredStatus === 'problem' ? 'text-zen-ume-600' :
                      inferredStatus === 'perennial' ? 'text-zen-sakura-600' :
                      'text-zen-moss-600'
                    }`}>
                      {inferredStatus === 'problem' && <AlertTriangle className="w-3 h-3" />}
                      {inferredStatus === 'perennial' && <Leaf className="w-3 h-3" />}
                      {inferredStatus === 'problem' ? 'Problem' :
                       inferredStatus === 'perennial' ? 'Perennial' :
                       selectedBedData.rotationGroup || 'Rotation'}
                    </div>
                  </div>
                </div>

                {/* Soil Method Selector */}
                <div className="mb-4">
                  <label htmlFor="soil-method" className="block text-xs font-medium text-zen-stone-500 mb-1">
                    Soil Method
                  </label>
                  <select
                    id="soil-method"
                    value={selectedBedData.soilMethod || ''}
                    onChange={(e) => updateSoilMethod(selectedBedId!, (e.target.value || undefined) as SoilMethod | undefined)}
                    className="zen-select text-sm"
                  >
                    <option value="">Not specified</option>
                    <option value="no-dig">No-dig</option>
                    <option value="back-to-eden">Back to Eden</option>
                    <option value="traditional">Traditional</option>
                    <option value="raised-bed">Raised Bed</option>
                  </select>
                </div>

                {/* Rotation Indicator for rotation beds */}
                {selectedBedData.status === 'rotation' && (() => {
                  const rotationInfo = getRotationIndicator(
                    selectedBedId!,
                    selectedYear,
                    data?.seasons || []
                  )
                  if (!rotationInfo) return null
                  const lastDisplay = ROTATION_GROUP_DISPLAY[rotationInfo.lastYear]
                  const nextDisplay = ROTATION_GROUP_DISPLAY[rotationInfo.suggested]
                  // Get suggested vegetables for this rotation group (Spike 2)
                  const suggestedVegIds = getVegetablesForRotationGroup(rotationInfo.suggested)
                  const suggestedVegNames = suggestedVegIds
                    .slice(0, 4)
                    .map(id => getVegetableById(id)?.name)
                    .filter(Boolean)
                  return (
                    <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
                      <div className="text-xs text-zen-kitsune-700 font-medium mb-1">Rotation Guide</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1">
                          <span>{lastDisplay?.emoji}</span>
                          <span className="text-zen-stone-600">{selectedYear - 1}: {lastDisplay?.name}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-zen-kitsune-500" />
                        <span className="flex items-center gap-1 font-medium text-zen-kitsune-700">
                          <span>{nextDisplay?.emoji}</span>
                          <span>{selectedYear}: {nextDisplay?.name}</span>
                        </span>
                      </div>
                      {/* Suggested vegetables (Spike 2) */}
                      {suggestedVegNames.length > 0 && (
                        <div className="text-xs text-zen-stone-500 mt-2">
                          Consider: {suggestedVegNames.join(', ')}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <p className="text-sm text-zen-stone-600 mb-4">{selectedBedData.description}</p>

                {/* Bed Note for this year */}
                <div className="mb-4">
                  <BedNotes
                    notes={selectedBedNotes}
                    onAdd={(note) => addBedNote(selectedBedId!, note)}
                    onUpdate={(noteId, updates) => updateBedNote(selectedBedId!, noteId, updates)}
                    onRemove={(noteId) => removeBedNote(selectedBedId!, noteId)}
                  />
                </div>

                {/* Plantings section with Add button */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-zen-ink-700 flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-zen-moss-600" />
                      {selectedYear} Plantings
                    </h4>
                    {selectedBedData.status !== 'perennial' && (
                      <div className="flex items-center gap-1">
                        {autoRotateInfo && (
                          <button
                            onClick={() => setShowAutoRotateDialog(true)}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-water-100 text-zen-water-700 rounded-zen hover:bg-zen-water-200 transition"
                            title={`Rotate from ${ROTATION_GROUP_DISPLAY[autoRotateInfo.previousGroup]?.name} to ${ROTATION_GROUP_DISPLAY[autoRotateInfo.suggestedGroup]?.name}`}
                          >
                            <ArrowRight className="w-3 h-3" />
                            Auto-rotate
                          </button>
                        )}
                        <button
                          onClick={() => setShowAddDialog(true)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-zen-moss-100 text-zen-moss-700 rounded-zen hover:bg-zen-moss-200 transition"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedPlantings.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPlantings.map(p => (
                        <PlantingCard
                          key={p.id}
                          planting={p}
                          onDelete={() => handleDeletePlanting(p.id)}
                          onUpdateSuccess={(success) => handleUpdateSuccess(p.id, success)}
                          otherPlantings={selectedPlantings}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zen-stone-400 italic">
                      {selectedBedData.status === 'perennial'
                        ? 'Perennial bed - see permanent plantings'
                        : 'No plantings recorded. Click Add to start planning.'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="zen-card p-6 sticky top-20">
                <div className="text-center text-zen-stone-400">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-zen-ink-600">Select a bed</p>
                  <p className="text-sm">Click on any bed in the layout to see its details and manage plantings</p>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-zen-stone-100">
                  <h4 className="font-medium text-zen-ink-700 mb-3">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zen-moss-50 rounded-zen p-3 text-center">
                      <div className="text-2xl font-bold text-zen-moss-600">
                        {getRotationBeds().length}
                      </div>
                      <div className="text-xs text-zen-moss-700">Rotation Beds</div>
                    </div>
                    <div className="bg-zen-ume-50 rounded-zen p-3 text-center">
                      <div className="text-2xl font-bold text-zen-ume-600">
                        {getProblemBeds().length}
                      </div>
                      <div className="text-xs text-zen-ume-700">Problem Areas</div>
                    </div>
                    <div className="bg-zen-sakura-50 rounded-zen p-3 text-center">
                      <div className="text-2xl font-bold text-zen-sakura-600">
                        {getPerennialBeds().length}
                      </div>
                      <div className="text-xs text-zen-sakura-700">Perennials</div>
                    </div>
                    <div className="bg-zen-kitsune-50 rounded-zen p-3 text-center">
                      <div className="text-2xl font-bold text-zen-kitsune-600">
                        {permanentPlantingsCount}
                      </div>
                      <div className="text-xs text-zen-kitsune-700">Permanent</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bed Legend */}
            <div className="zen-card p-6 mt-4">
              <h4 className="font-medium text-zen-ink-700 mb-3">All Beds</h4>
              <div className="space-y-2">
                {allBeds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => selectBed(bed.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-zen transition hover:bg-zen-stone-50 ${
                      selectedBedId === bed.id ? 'bg-zen-stone-100' : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-zen flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: BED_COLORS[bed.id] }}
                    >
                      {bed.id.replace('-prime', "'")}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium text-zen-ink-700 text-sm truncate">{bed.name}</div>
                      <div className={`text-xs ${
                        bed.status === 'problem' ? 'text-zen-ume-600' :
                        bed.status === 'perennial' ? 'text-zen-sakura-600' :
                        'text-zen-stone-500'
                      }`}>
                        {bed.status === 'problem' && '⚠️ '}
                        {bed.rotationGroup || bed.status}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Planting Dialog - Accessible */}
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
      {autoRotateInfo && selectedBedData && (() => {
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
            description={`Rotate ${selectedBedData.name} to maintain healthy soil and prevent disease buildup.`}
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
