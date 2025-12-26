'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserLocation } from '@/types'

interface UseLocationReturn {
  userLocation: UserLocation | null
  locationError: string | null
  detectUserLocation: () => void
  isDetecting: boolean
}

/**
 * Hook for detecting and managing user location
 */
export function useLocation(): UseLocationReturn {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const detectUserLocation = useCallback(async () => {
    setIsDetecting(true)
    setLocationError(null)

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser')
        setIsDetecting(false)
        return
      }

      // Get user's position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            // Use reverse geocoding to get city/country info
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )

            if (response.ok) {
              const data = await response.json()
              setUserLocation({
                latitude,
                longitude,
                city: data.city ?? data.locality,
                country: data.countryName,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
              })
            } else {
              // Fallback with just coordinates and timezone
              setUserLocation({
                latitude,
                longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
              })
            }
          } catch (error) {
            console.error('Error getting location details:', error)
            // Fallback with just coordinates and timezone
            setUserLocation({
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          } finally {
            setIsDetecting(false)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied by user')
              break
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location information unavailable')
              break
            case error.TIMEOUT:
              setLocationError('Location request timed out')
              break
            default:
              setLocationError('An unknown error occurred while detecting location')
              break
          }
          setIsDetecting(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache position for 5 minutes
        }
      )
    } catch (error) {
      console.error('Error detecting location:', error)
      setLocationError('Failed to detect location')
      setIsDetecting(false)
    }
  }, [])

  // Auto-detect on mount
  useEffect(() => {
    detectUserLocation()
  }, [detectUserLocation])

  return {
    userLocation,
    locationError,
    detectUserLocation,
    isDetecting
  }
}



