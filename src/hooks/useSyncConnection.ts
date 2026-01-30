'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PeerJSSignaling } from '@/services/peerjs-signaling'
import { getOrCreateIdentity, getPairedDevices } from '@/services/device-identity'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'
import { logger } from '@/lib/logger'

// Get the current allotment data from localStorage
function getCurrentData(): { data: string; timestamp: number } | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as AllotmentData
    // Use updatedAt timestamp if available, otherwise use current time
    const timestamp = parsed.meta?.updatedAt
      ? new Date(parsed.meta.updatedAt).getTime()
      : Date.now()
    return { data: stored, timestamp }
  } catch {
    return null
  }
}

// Merge received data with local data
function mergeData(localData: string | null, remoteData: string, remoteTimestamp: number): string | null {
  if (!localData) {
    // No local data, use remote
    logger.info('No local data, applying remote data')
    return remoteData
  }

  try {
    const local = JSON.parse(localData) as AllotmentData

    const localTimestamp = local.meta?.updatedAt
      ? new Date(local.meta.updatedAt).getTime()
      : 0

    // Simple last-write-wins: use the newer data
    if (remoteTimestamp > localTimestamp) {
      logger.info('Remote data is newer, applying remote data', {
        localTimestamp: new Date(localTimestamp).toISOString(),
        remoteTimestamp: new Date(remoteTimestamp).toISOString()
      })
      return remoteData
    } else {
      logger.info('Local data is newer or same, keeping local data', {
        localTimestamp: new Date(localTimestamp).toISOString(),
        remoteTimestamp: new Date(remoteTimestamp).toISOString()
      })
      return null // null means no change needed
    }
  } catch (err) {
    logger.error('Failed to parse data for merging', { error: err })
    return null
  }
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface PeerStatus {
  publicKey: string
  connected: boolean
  authenticated: boolean
}

interface UseSyncConnectionReturn {
  status: ConnectionStatus
  error: string | null
  peerStatuses: Map<string, PeerStatus>
  connect: () => Promise<void>
  disconnect: () => void
  refreshPeers: () => void
}

export function useSyncConnection(): UseSyncConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [peerStatuses, setPeerStatuses] = useState<Map<string, PeerStatus>>(new Map())
  const signalingRef = useRef<PeerJSSignaling | null>(null)

  const updatePeerStatus = useCallback((publicKey: string, updates: Partial<PeerStatus>) => {
    setPeerStatuses(prev => {
      const next = new Map(prev)
      const current = next.get(publicKey) || { publicKey, connected: false, authenticated: false }
      next.set(publicKey, { ...current, ...updates })
      return next
    })
  }, [])

  const connect = useCallback(async () => {
    if (signalingRef.current?.isConnected()) {
      return
    }

    try {
      setStatus('connecting')
      setError(null)

      const identity = getOrCreateIdentity()

      const signaling = new PeerJSSignaling({
        publicKey: identity.publicKey,
        privateKey: identity.privateKey,
        deviceName: identity.deviceName
      })

      signaling.on('connected', () => {
        setStatus('connected')
        logger.info('Sync connected to signaling server')
      })

      signaling.on('disconnected', () => {
        setStatus('disconnected')
      })

      signaling.on('error', (err: Error) => {
        setError(err.message)
        setStatus('error')
      })

      signaling.on('peer-connected', (publicKey: string) => {
        updatePeerStatus(publicKey, { connected: true })
      })

      signaling.on('peer-disconnected', (publicKey: string) => {
        updatePeerStatus(publicKey, { connected: false, authenticated: false })
      })

      signaling.on('peer-authenticated', (publicKey: string) => {
        updatePeerStatus(publicKey, { authenticated: true })
        // Force a re-render of the paired devices list
        window.dispatchEvent(new CustomEvent('sync-peer-authenticated', { detail: { publicKey } }))

        // Send our current data to the newly authenticated peer
        const current = getCurrentData()
        if (current) {
          logger.info('Sending full state to authenticated peer', { peer: publicKey.substring(0, 16) })
          signaling.sendFullStateSync(publicKey, current.data, current.timestamp)
        }
      })

      signaling.on('full-state-sync', ({ publicKey, data, timestamp }: { publicKey: string, data: string, timestamp: number }) => {
        logger.info('Received full state sync', { from: publicKey.substring(0, 16), dataLength: data.length })

        const localData = localStorage.getItem(STORAGE_KEY)
        const mergedData = mergeData(localData, data, timestamp)

        if (mergedData) {
          // Apply the merged data
          localStorage.setItem(STORAGE_KEY, mergedData)
          logger.info('Applied synced data to localStorage')

          // Trigger a refresh of the app
          window.dispatchEvent(new CustomEvent('sync-data-updated'))
          // Also trigger storage event for multi-tab sync
          window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
        }
      })

      signaling.on('sync-message', ({ publicKey, data }: { publicKey: string, data: Uint8Array }) => {
        logger.info('Received sync message', { from: publicKey.substring(0, 16), bytes: data.length })
        // Reserved for Yjs CRDT sync
      })

      signalingRef.current = signaling
      await signaling.start()

      // Initialize peer statuses for all paired devices
      const pairedDevices = getPairedDevices()
      const initialStatuses = new Map<string, PeerStatus>()
      for (const device of pairedDevices) {
        initialStatuses.set(device.publicKey, {
          publicKey: device.publicKey,
          connected: false,
          authenticated: false
        })
      }
      setPeerStatuses(initialStatuses)

    } catch (err) {
      logger.error('Failed to connect', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setStatus('error')
    }
  }, [updatePeerStatus])

  const disconnect = useCallback(() => {
    signalingRef.current?.stop()
    signalingRef.current = null
    setStatus('disconnected')
    setPeerStatuses(new Map())
  }, [])

  const refreshPeers = useCallback(() => {
    if (!signalingRef.current?.isConnected()) return

    const pairedDevices = getPairedDevices()
    for (const device of pairedDevices) {
      if (!signalingRef.current.isPeerConnected(device.publicKey)) {
        signalingRef.current.connectToPeer(device.publicKey)
      }
    }
  }, [])

  // Auto-connect when hook mounts
  useEffect(() => {
    // Only auto-connect if we have paired devices
    const pairedDevices = getPairedDevices()
    if (pairedDevices.length > 0) {
      connect()
    }

    return () => {
      signalingRef.current?.stop()
    }
  }, [connect])

  // Listen for new pairings
  useEffect(() => {
    const handlePairingChange = () => {
      if (signalingRef.current?.isConnected()) {
        refreshPeers()
      }
    }

    window.addEventListener('storage', handlePairingChange)
    return () => window.removeEventListener('storage', handlePairingChange)
  }, [refreshPeers])

  return {
    status,
    error,
    peerStatuses,
    connect,
    disconnect,
    refreshPeers
  }
}
