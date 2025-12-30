'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Map, 
  Sprout, 
  History,
  AlertTriangle,
  Leaf,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TreeDeciduous,
  Users,
  Check
} from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { getVegetableById, vegetables } from '@/lib/vegetable-database'
import { checkCompanionCompatibility } from '@/lib/companion-validation'
import { PhysicalBedId } from '@/types/garden-planner'
import { Planting, NewPlanting } from '@/types/unified-allotment'
import { useAllotment } from '@/hooks/useAllotment'
import AllotmentGrid from '@/components/allotment/AllotmentGrid'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import DataManagement from '@/components/allotment/DataManagement'
import SaveIndicator from '@/components/ui/SaveIndicator'
import BedNotes from '@/components/allotment/BedNotes'

// Add Planting Form (used inside Dialog)
function AddPlantingForm({ 
  onSubmit, 
  onCancel,
  existingPlantings = []
}: { 
  onSubmit: (planting: NewPlanting) => void 
  onCancel: () => void
  existingPlantings?: Planting[]
}) {
  const [vegetableId, setVegetableId] = useState('')
  const [varietyName, setVarietyName] = useState('')
  const [sowDate, setSowDate] = useState('')
  const [notes, setNotes] = useState('')

  // Calculate companion compatibility with existing plantings
  const companionInfo = vegetableId ? (() => {
    const goods: string[] = []
    const bads: string[] = []
    
    for (const existing of existingPlantings) {
      const compat = checkCompanionCompatibility(vegetableId, existing.vegetableId)
      const existingVeg = getVegetableById(existing.vegetableId)
      if (compat === 'good' && existingVeg) goods.push(existingVeg.name)
      if (compat === 'bad' && existingVeg) bads.push(existingVeg.name)
    }
    
    return { goods, bads }
  })() : { goods: [], bads: [] }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vegetableId) return
    
    onSubmit({
      vegetableId,
      varietyName: varietyName || undefined,
      sowDate: sowDate || undefined,
      notes: notes || undefined,
    })
    
    // Reset form
    setVegetableId('')
    setVarietyName('')
    setSowDate('')
    setNotes('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="vegetable-select" className="block text-sm font-medium text-gray-700 mb-1">
          Vegetable *
        </label>
        <select
          id="vegetable-select"
          value={vegetableId}
          onChange={(e) => setVegetableId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select a vegetable...</option>
          {vegetables.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        
        {/* Companion suggestions panel */}
        {vegetableId && existingPlantings.length > 0 && (
          <div className="mt-2 space-y-1">
            {companionInfo.goods.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded">
                <Check className="w-3 h-3" />
                <span>Good with: {companionInfo.goods.join(', ')}</span>
              </div>
            )}
            {companionInfo.bads.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>Avoid: {companionInfo.bads.join(', ')}</span>
              </div>
            )}
            {companionInfo.goods.length === 0 && companionInfo.bads.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded">
                <Users className="w-3 h-3" />
                <span>Neutral with current plantings</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="variety-input" className="block text-sm font-medium text-gray-700 mb-1">
          Variety Name
        </label>
        <input
          id="variety-input"
          type="text"
          value={varietyName}
          onChange={(e) => setVarietyName(e.target.value)}
          placeholder="e.g., Kelvedon Wonder"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      
      <div>
        <label htmlFor="sow-date-input" className="block text-sm font-medium text-gray-700 mb-1">
          Sow Date
        </label>
        <input
          id="sow-date-input"
          type="date"
          value={sowDate}
          onChange={(e) => setSowDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      
      <div>
        <label htmlFor="notes-input" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes about this planting..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!vegetableId}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Add Planting
        </button>
      </div>
    </form>
  )
}

// Helper to get companion status for a planting relative to other plantings
function getCompanionStatus(planting: Planting, otherPlantings: Planting[]): { 
  goods: string[]
  bads: string[] 
} {
  const goods: string[] = []
  const bads: string[] = []
  
  for (const other of otherPlantings) {
    if (other.id === planting.id) continue
    const compat = checkCompanionCompatibility(planting.vegetableId, other.vegetableId)
    const otherVeg = getVegetableById(other.vegetableId)
    if (compat === 'good' && otherVeg) goods.push(otherVeg.name)
    if (compat === 'bad' && otherVeg) bads.push(otherVeg.name)
  }
  
  return { goods, bads }
}

// Planting Card with accessible actions (always visible for mobile)
function PlantingCard({ 
  planting, 
  onDelete,
  onUpdateSuccess,
  otherPlantings = []
}: { 
  planting: Planting
  onDelete: () => void
  onUpdateSuccess: (success: Planting['success']) => void
  otherPlantings?: Planting[]
}) {
  const veg = getVegetableById(planting.vegetableId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { goods, bads } = getCompanionStatus(planting, otherPlantings)
  
  return (
    <>
      <div className={`rounded-lg p-3 ${bads.length > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800">
              {veg?.name || planting.vegetableId}
            </div>
            {planting.varietyName && (
              <div className="text-xs text-gray-500">{planting.varietyName}</div>
            )}
            
            {/* Companion Status */}
            {goods.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700">Good with {goods.join(', ')}</span>
              </div>
            )}
            {bads.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600">Conflicts with {bads.join(', ')}</span>
              </div>
            )}
            
            {planting.success && (
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                planting.success === 'excellent' ? 'bg-green-100 text-green-700' :
                planting.success === 'good' ? 'bg-blue-100 text-blue-700' :
                planting.success === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {planting.success}
              </span>
            )}
            {planting.notes && (
              <div className="text-xs text-gray-400 mt-1 line-clamp-2">{planting.notes}</div>
            )}
          </div>
          
          {/* Actions - always visible for accessibility and mobile */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor={`success-${planting.id}`} className="sr-only">
              Rate success for {veg?.name || planting.vegetableId}
            </label>
            <select
              id={`success-${planting.id}`}
              value={planting.success || ''}
              onChange={(e) => onUpdateSuccess(e.target.value as Planting['success'])}
              className="text-xs px-1 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Rate planting success"
            >
              <option value="">Rate...</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Delete ${veg?.name || planting.vegetableId}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={onDelete}
        title="Delete Planting"
        message={`Are you sure you want to delete "${veg?.name || planting.vegetableId}"${planting.varietyName ? ` (${planting.varietyName})` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </>
  )
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
  } = useAllotment()

  const [showAddDialog, setShowAddDialog] = useState(false)
  
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="w-8 h-8 text-emerald-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-800">{data?.meta.name || 'My Allotment'}</h1>
                  <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
                </div>
                <p className="text-xs text-gray-500">{data?.meta.location || 'Edinburgh, Scotland'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DataManagement data={data} onDataImported={reload} />
              <Link 
                href="/companion-planting"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
              >
                <Users className="w-4 h-4" />
                Companions
              </Link>
              <Link 
                href="/this-month"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
              >
                <TreeDeciduous className="w-4 h-4" />
                Care
              </Link>
              <Link 
                href="/plan-history"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition"
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
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Failed to save changes</p>
              <p className="text-sm text-red-600 mt-1">{saveError}</p>
            </div>
            <button
              onClick={clearSaveError}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition"
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
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 animate-pulse"
            role="status"
            aria-live="polite"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-sm text-blue-700">
              Data synced from another browser tab
            </p>
          </div>
        </div>
      )}

      {/* Year Selector */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear)
              if (idx < availableYears.length - 1) {
                selectYear(availableYears[idx + 1])
              }
            }}
            disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => selectYear(year)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedYear === year
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
          
          {canCreateNextYear && (
            <button
              onClick={handleCreateNextYear}
              className="px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition flex items-center gap-1"
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
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {currentSeason?.notes && (
          <p className="text-center text-sm text-gray-500 mt-2">{currentSeason.notes}</p>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-2">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Layout */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Plot Overview - {selectedYear}
              </h2>
              
              {/* Draggable Grid Layout */}
              <AllotmentGrid 
                onBedSelect={(bedId) => selectBed(bedId as PhysicalBedId)}
                selectedBed={selectedBedId}
              />
            </div>
          </div>

          {/* Sidebar - Bed Details */}
          <div className="lg:col-span-1">
            {selectedBedData ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: BED_COLORS[selectedBedId!] }}
                  >
                    {selectedBedId?.replace('-prime', "'")}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedBedData.name}</h3>
                    <div className={`text-xs flex items-center gap-1 ${
                      inferredStatus === 'problem' ? 'text-red-500' :
                      inferredStatus === 'perennial' ? 'text-purple-500' :
                      'text-green-600'
                    }`}>
                      {inferredStatus === 'problem' && <AlertTriangle className="w-3 h-3" />}
                      {inferredStatus === 'perennial' && <Leaf className="w-3 h-3" />}
                      {inferredStatus === 'problem' ? 'Problem' :
                       inferredStatus === 'perennial' ? 'Perennial' :
                       selectedBedData.rotationGroup || 'Rotation'}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{selectedBedData.description}</p>

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
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Sprout className="w-4 h-4" />
                      {selectedYear} Plantings
                    </h4>
                    {selectedBedData.status !== 'perennial' && (
                      <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
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
                    <div className="text-sm text-gray-400 italic">
                      {selectedBedData.status === 'perennial' 
                        ? 'Perennial bed - see permanent plantings'
                        : 'No plantings recorded. Click Add to start planning.'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20">
                <div className="text-center text-gray-400">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Select a bed</p>
                  <p className="text-sm">Click on any bed in the layout to see its details and manage plantings</p>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {getRotationBeds().length}
                      </div>
                      <div className="text-xs text-green-700">Rotation Beds</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {getProblemBeds().length}
                      </div>
                      <div className="text-xs text-red-700">Problem Areas</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {getPerennialBeds().length}
                      </div>
                      <div className="text-xs text-purple-700">Perennials</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {permanentPlantingsCount}
                      </div>
                      <div className="text-xs text-amber-700">Permanent</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bed Legend */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-4">
              <h4 className="font-semibold text-gray-700 mb-3">All Beds</h4>
              <div className="space-y-2">
                {allBeds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => selectBed(bed.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition hover:bg-gray-50 ${
                      selectedBedId === bed.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: BED_COLORS[bed.id] }}
                    >
                      {bed.id.replace('-prime', "'")}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{bed.name}</div>
                      <div className={`text-xs ${
                        bed.status === 'problem' ? 'text-red-500' : 
                        bed.status === 'perennial' ? 'text-purple-500' : 
                        'text-gray-500'
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
    </div>
  )
}
