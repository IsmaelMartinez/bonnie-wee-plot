'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Download, AlertTriangle, CheckCircle, Loader2, Home, ArrowLeft } from 'lucide-react'
import type { AllotmentData } from '@/types/unified-allotment'
import { saveAllotmentData, migrateSchemaForImport, loadAllotmentData } from '@/services/allotment-storage'
import { createPreImportBackup } from '@/lib/storage-utils'

interface PageProps {
  params: Promise<{ code: string }>
}

interface FetchState {
  status: 'loading' | 'success' | 'error' | 'importing' | 'imported'
  allotment?: AllotmentData
  sharedAt?: string
  error?: string
}

export default function ReceivePage({ params }: PageProps) {
  const { code } = use(params)
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ status: 'loading' })
  const [hasExistingData, setHasExistingData] = useState(false)

  // Fetch shared data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/share/${code}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 404) {
            throw new Error('This share code has expired or does not exist.')
          }
          throw new Error(errorData.error || 'Failed to fetch shared data')
        }

        const data = await response.json()
        setState({
          status: 'success',
          allotment: data.allotment,
          sharedAt: data.sharedAt,
        })

        // Check if user has existing data
        const existing = loadAllotmentData()
        if (existing.success && existing.data) {
          // Check if there's meaningful data (more than just initial setup)
          const hasPlantings = existing.data.seasons.some(s =>
            (s.areas || []).some(areaSeason =>
              (areaSeason.plantings || []).length > 0
            )
          )
          setHasExistingData(hasPlantings)
        }
      } catch (error) {
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to fetch shared data',
        })
      }
    }

    fetchData()
  }, [code])

  // Handle import
  const handleImport = async () => {
    if (!state.allotment) return

    setState(prev => ({ ...prev, status: 'importing' }))

    try {
      // Create backup if there's existing data
      if (hasExistingData) {
        const backupResult = createPreImportBackup()
        if (!backupResult.success) {
          throw new Error('Failed to create backup of existing data')
        }
      }

      // Migrate to current schema if needed
      const migratedData = migrateSchemaForImport({
        ...state.allotment,
        meta: {
          ...state.allotment.meta,
          updatedAt: new Date().toISOString(),
        },
      })

      // Save the data
      const result = saveAllotmentData(migratedData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save data')
      }

      setState(prev => ({ ...prev, status: 'imported' }))

      // Redirect after short delay
      setTimeout(() => {
        // Set flag to prevent stale data from overwriting
        if (typeof window !== 'undefined') {
          (window as Window & { __disablePersistenceUntilReload?: boolean }).__disablePersistenceUntilReload = true
        }
        window.location.href = '/'
      }, 1500)
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to import data',
      }))
    }
  }

  // Format the shared date
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  // Count plantings in the data
  const countPlantings = (data: AllotmentData) => {
    let total = 0
    for (const season of data.seasons) {
      for (const areaSeason of (season.areas || [])) {
        total += (areaSeason.plantings || []).length
      }
    }
    return total
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        {/* Loading State */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-gray-600">Loading shared allotment...</p>
            <p className="text-sm text-gray-400 font-mono">{code}</p>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Unable to Load</h1>
            <p className="text-center text-gray-600">{state.error}</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <button
                onClick={() => router.push('/receive')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Try Another Code
              </button>
            </div>
          </div>
        )}

        {/* Success - Show Preview */}
        {state.status === 'success' && state.allotment && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800 mb-2">Receive Allotment Data</h1>
              <p className="text-gray-600">Someone shared their allotment with you</p>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h2 className="font-semibold text-gray-800 text-lg">
                {state.allotment.meta.name || 'Unnamed Allotment'}
              </h2>
              {state.allotment.meta.location && (
                <p className="text-sm text-gray-500 mt-1">{state.allotment.meta.location}</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Seasons</p>
                  <p className="font-medium text-gray-800">{state.allotment.seasons.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Plantings</p>
                  <p className="font-medium text-gray-800">{countPlantings(state.allotment)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Beds/Areas</p>
                  <p className="font-medium text-gray-800">{state.allotment.layout.areas.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Varieties</p>
                  <p className="font-medium text-gray-800">{(state.allotment.varieties || []).length}</p>
                </div>
              </div>

              {state.sharedAt && (
                <p className="text-xs text-gray-400 mt-3">Shared {formatDate(state.sharedAt)}</p>
              )}
            </div>

            {/* Warning if existing data */}
            {hasExistingData && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700">You have existing data</p>
                  <p className="text-amber-600 mt-1">
                    Importing will replace your current allotment. A backup will be created automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                <Download className="w-4 h-4" />
                Import
              </button>
            </div>
          </div>
        )}

        {/* Importing State */}
        {state.status === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-gray-600">Importing allotment data...</p>
          </div>
        )}

        {/* Imported State */}
        {state.status === 'imported' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Import Complete!</h1>
            <p className="text-gray-600">Redirecting to your allotment...</p>
          </div>
        )}
      </div>
    </main>
  )
}
