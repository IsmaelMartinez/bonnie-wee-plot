'use client'

import { useState, useEffect, useRef } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  /** True briefly after reconnecting, for showing a "back online" message. */
  justReconnected: boolean
}

/**
 * Hook to track online/offline network status.
 * Uses navigator.onLine and online/offline events for real-time updates.
 * Tracks reconnection so the UI can briefly confirm connectivity was restored.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true
    return navigator.onLine
  })
  const [justReconnected, setJustReconnected] = useState(false)
  const wasOfflineRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOfflineRef.current) {
        setJustReconnected(true)
        timerRef.current = setTimeout(() => setJustReconnected(false), 3000)
      }
      wasOfflineRef.current = false
    }
    const handleOffline = () => {
      setIsOnline(false)
      wasOfflineRef.current = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    justReconnected,
  }
}
