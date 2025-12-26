'use client'

import type { UserLocation } from '@/types'

interface LocationStatusProps {
  userLocation: UserLocation | null
  locationError: string | null
  onRetry: () => void
  isDetecting?: boolean
}

export default function LocationStatus({ 
  userLocation, 
  locationError, 
  onRetry,
  isDetecting 
}: LocationStatusProps) {
  if (isDetecting) {
    return (
      <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
        🌍 Detecting location...
      </div>
    )
  }

  if (userLocation) {
    return (
      <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        📍 {userLocation.city && userLocation.country 
          ? `${userLocation.city}, ${userLocation.country}` 
          : 'Location detected'}
        {userLocation.timezone && (
          <span className="ml-2 text-green-600">
            • {new Date().toLocaleTimeString('en-US', {
              timeZone: userLocation.timezone,
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </span>
        )}
      </div>
    )
  }

  if (locationError) {
    return (
      <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        ⚠️ {locationError}
        <button 
          onClick={onRetry}
          className="ml-2 text-yellow-700 hover:text-yellow-900 underline text-xs"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
      🌍 Detecting location...
    </div>
  )
}



