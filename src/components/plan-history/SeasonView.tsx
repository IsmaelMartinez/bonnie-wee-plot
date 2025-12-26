'use client'

import { Calendar, AlertCircle, AlertTriangle } from 'lucide-react'
import { BED_COLORS } from '@/data/allotment-layout'
import { ROTATION_GROUP_DISPLAY } from '@/lib/rotation-planner'
import { getVegetableById } from '@/lib/vegetable-database'
import { RotationGroup, PlantingSuccess, PhysicalBedId, PhysicalBed } from '@/types/garden-planner'
import { SeasonRecord } from '@/types/unified-allotment'

// Success badge colors
const SUCCESS_COLORS: Record<PlantingSuccess, { bg: string; text: string }> = {
  'excellent': { bg: 'bg-green-100', text: 'text-green-700' },
  'good': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'fair': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'poor': { bg: 'bg-red-100', text: 'text-red-700' }
}

// Get bed status info from passed beds array
function getBedStatusInfo(bedId: PhysicalBedId, beds: PhysicalBed[]) {
  const bed = beds.find(b => b.id === bedId)
  if (!bed) return null
  
  return {
    status: bed.status,
    isProblem: bed.status === 'problem',
    isPerennial: bed.status === 'perennial',
    problemNote: bed.problemNotes
  }
}

interface SeasonViewProps {
  season: SeasonRecord
  year: number
  beds: PhysicalBed[]
}

export default function SeasonView({ season, year, beds }: SeasonViewProps) {
  return (
    <div className="space-y-6">
      {/* Season Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-800">{year} Season</h2>
          {season.status && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              season.status === 'current' ? 'bg-green-100 text-green-700' :
              season.status === 'planned' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {season.status}
            </span>
          )}
        </div>
        
        {season.notes && (
          <p className="text-gray-600 mb-4 p-3 bg-amber-50 rounded-lg">
            {season.notes}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {season.beds.length}
            </p>
            <p className="text-sm text-gray-500">Beds Used</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {season.beds.reduce((sum, b) => sum + b.plantings.length, 0)}
            </p>
            <p className="text-sm text-gray-500">Plantings</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {new Set(season.beds.flatMap(b => b.plantings.map(p => p.vegetableId))).size}
            </p>
            <p className="text-sm text-gray-500">Crop Types</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {new Set(season.beds.map(b => b.rotationGroup)).size}
            </p>
            <p className="text-sm text-gray-500">Rotation Groups</p>
          </div>
        </div>
      </div>

      {/* Bed Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {season.beds.map(bed => {
          const rotationDisplay = ROTATION_GROUP_DISPLAY[bed.rotationGroup as RotationGroup]
          const bedInfo = getBedStatusInfo(bed.bedId, beds)
          
          return (
            <div 
              key={bed.bedId} 
              className={`bg-white rounded-xl shadow-md overflow-hidden ${
                bedInfo?.isProblem ? 'ring-2 ring-red-300' : ''
              }`}
            >
              <div 
                className="px-4 py-3 text-white font-medium flex items-center justify-between"
                style={{ backgroundColor: BED_COLORS[bed.bedId] }}
              >
                <span className="flex items-center gap-2">
                  Bed {bed.bedId}
                  {bedInfo?.isProblem && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </span>
                <span className="text-sm opacity-90 flex items-center gap-1">
                  {rotationDisplay?.emoji} {rotationDisplay?.name || bed.rotationGroup}
                </span>
              </div>
              
              {/* Problem Note */}
              {bedInfo?.isProblem && bedInfo.problemNote && (
                <div className="bg-red-50 px-4 py-2 text-xs text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {bedInfo.problemNote}
                </div>
              )}
              
              <div className="p-4">
                <div className="space-y-3">
                  {bed.plantings.map(planting => {
                    const veg = getVegetableById(planting.vegetableId)
                    const successColor = planting.success ? SUCCESS_COLORS[planting.success] : null
                    
                    return (
                      <div key={planting.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">
                              {veg?.name || planting.vegetableId}
                            </p>
                            {planting.success && successColor && (
                              <span className={`px-1.5 py-0.5 rounded text-xs ${successColor.bg} ${successColor.text}`}>
                                {planting.success}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-amber-600">{planting.varietyName}</p>
                          {planting.sowDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              Sown: {new Date(planting.sowDate).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </p>
                          )}
                          {planting.notes && (
                            <p className="text-xs text-gray-500 mt-1">{planting.notes}</p>
                          )}
                        </div>
                        {planting.quantity && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            x{planting.quantity}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



