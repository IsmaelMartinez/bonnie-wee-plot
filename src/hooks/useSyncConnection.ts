'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PeerJSSignaling } from '@/services/peerjs-signaling'
import { getOrCreateIdentity, getPairedDevices } from '@/services/device-identity'
import { logger } from '@/lib/logger'

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
      })

      signaling.on('sync-message', ({ publicKey, data }: { publicKey: string, data: Uint8Array }) => {
        logger.info('Received sync message', { from: publicKey.substring(0, 16), bytes: data.length })
        // TODO: Handle sync message with Yjs
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
