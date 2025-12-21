'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Map, 
  Sprout, 
  History,
  AlertTriangle,
  Leaf
} from 'lucide-react'
import { 
  physicalBeds, 
  permanentPlantings,
  BED_COLORS 
} from '@/data/allotment-layout'
import { getSeasonByYear } from '@/data/historical-plans'
import { getVegetableById } from '@/lib/vegetable-database'
import { PhysicalBedId } from '@/types/garden-planner'
import AllotmentGrid from '@/components/allotment/AllotmentGrid'

export default function AllotmentPage() {
  const [selectedBed, setSelectedBed] = useState<PhysicalBedId | null>(null)
  const season2025 = getSeasonByYear(2025)
  
  // Get plantings for a bed
  const getBedPlantings = (bedId: PhysicalBedId) => {
    if (!season2025) return []
    const bedPlan = season2025.beds.find(b => b.bedId === bedId)
    return bedPlan?.plantings || []
  }

  const selectedBedData = selectedBed ? physicalBeds.find(b => b.id === selectedBed) : null
  const selectedPlantings = selectedBed ? getBedPlantings(selectedBed) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">My Allotment</h1>
                <p className="text-xs text-gray-500">Drag to edit layout</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/plan-history"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition"
              >
                <History className="w-4 h-4" />
                History
              </Link>
              <Link 
                href="/garden-planner"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                <Sprout className="w-4 h-4" />
                Planner
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Layout */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Plot Overview
              </h2>
              
              {/* Draggable Grid Layout */}
              <AllotmentGrid 
                onBedSelect={setSelectedBed}
                selectedBed={selectedBed}
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
                    style={{ backgroundColor: BED_COLORS[selectedBed!] }}
                  >
                    {selectedBed?.replace('-prime', "'")}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedBedData.name}</h3>
                    <div className={`text-xs flex items-center gap-1 ${
                      selectedBedData.status === 'problem' ? 'text-red-500' : 
                      selectedBedData.status === 'perennial' ? 'text-purple-500' : 
                      'text-green-600'
                    }`}>
                      {selectedBedData.status === 'problem' && <AlertTriangle className="w-3 h-3" />}
                      {selectedBedData.status === 'perennial' && <Leaf className="w-3 h-3" />}
                      {selectedBedData.status.charAt(0).toUpperCase() + selectedBedData.status.slice(1)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{selectedBedData.description}</p>

                {selectedBedData.problemNotes && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-700">{selectedBedData.problemNotes}</p>
                    </div>
                  </div>
                )}

                {selectedPlantings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sprout className="w-4 h-4" />
                      2025 Plantings
                    </h4>
                    <div className="space-y-2">
                      {selectedPlantings.map(p => {
                        const veg = getVegetableById(p.vegetableId)
                        return (
                          <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-800">
                              {veg?.name || p.vegetableId}
                            </div>
                            {p.varietyName && (
                              <div className="text-xs text-gray-500">{p.varietyName}</div>
                            )}
                            {p.success && (
                              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                p.success === 'excellent' ? 'bg-green-100 text-green-700' :
                                p.success === 'good' ? 'bg-blue-100 text-blue-700' :
                                p.success === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {p.success}
                              </span>
                            )}
                            {p.notes && (
                              <div className="text-xs text-gray-400 mt-1">{p.notes}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedPlantings.length === 0 && selectedBedData.status !== 'perennial' && (
                  <div className="text-sm text-gray-400 italic">
                    No plantings recorded for 2025
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20">
                <div className="text-center text-gray-400">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Select a bed</p>
                  <p className="text-sm">Click on any bed in the layout to see its details and planting history</p>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {physicalBeds.filter(b => b.status === 'rotation').length}
                      </div>
                      <div className="text-xs text-green-700">Rotation Beds</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {physicalBeds.filter(b => b.status === 'problem').length}
                      </div>
                      <div className="text-xs text-red-700">Problem Areas</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {physicalBeds.filter(b => b.status === 'perennial').length}
                      </div>
                      <div className="text-xs text-purple-700">Perennials</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {permanentPlantings.length}
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
                {physicalBeds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => setSelectedBed(bed.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition hover:bg-gray-50 ${
                      selectedBed === bed.id ? 'bg-gray-100' : ''
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
                        {bed.rotationGroup}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
