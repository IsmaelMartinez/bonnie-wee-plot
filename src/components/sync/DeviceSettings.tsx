'use client'

import { useState, useEffect } from 'react'
import { PairingModal } from './PairingModal'
import { PairedDevicesList } from './PairedDevicesList'
import {
  getOrCreateIdentity,
  updateDeviceName,
  getPairedDevices,
  removePairedDevice
} from '@/services/device-identity'
import { useSyncConnection } from '@/hooks/useSyncConnection'
import type { DeviceIdentity, PairedDevice } from '@/types/sync'

export function DeviceSettings() {
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null)
  const [devices, setDevices] = useState<PairedDevice[]>([])
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showPairing, setShowPairing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { status: syncStatus, peerStatuses, connect, refreshPeers } = useSyncConnection()

  useEffect(() => {
    try {
      const id = getOrCreateIdentity()
      setIdentity(id)
      setDevices(getPairedDevices())
      setError(null)
    } catch (err) {
      console.error('Failed to initialize device identity:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize device identity')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for peer authentication events to refresh the list
  useEffect(() => {
    const handlePeerAuth = () => {
      setDevices(getPairedDevices())
    }
    window.addEventListener('sync-peer-authenticated', handlePeerAuth)
    return () => window.removeEventListener('sync-peer-authenticated', handlePeerAuth)
  }, [])

  const handleSaveName = () => {
    if (newName.trim()) {
      const updated = updateDeviceName(newName.trim())
      if (updated) setIdentity(updated)
    }
    setEditingName(false)
  }

  const handleRemoveDevice = (publicKey: string) => {
    removePairedDevice(publicKey)
    setDevices(getPairedDevices())
  }

  const handlePaired = () => {
    setDevices(getPairedDevices())
    setShowPairing(false)
    // Connect to the new peer
    if (syncStatus === 'connected') {
      refreshPeers()
    } else {
      connect()
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading device settings...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Unable to initialize device sync</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <p className="text-gray-600 text-sm mt-2">
          This may be a browser compatibility issue. Try using Chrome or Safari.
        </p>
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="text-center py-8 text-gray-500">
        Unable to create device identity
      </div>
    )
  }

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'connected':
        return { text: 'Online', color: 'text-green-600', dot: 'bg-green-500' }
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-600', dot: 'bg-yellow-500' }
      case 'error':
        return { text: 'Error', color: 'text-red-600', dot: 'bg-red-500' }
      default:
        return { text: 'Offline', color: 'text-gray-500', dot: 'bg-gray-400' }
    }
  }

  const statusDisplay = getSyncStatusDisplay()

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-medium mb-2">This Device</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-1 border rounded"
                autoFocus
              />
              <button onClick={handleSaveName} className="px-3 py-1 bg-blue-600 text-white rounded">
                Save
              </button>
              <button onClick={() => setEditingName(false)} className="px-3 py-1 border rounded">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{identity.deviceName}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${statusDisplay.dot}`} />
                  <span className={`text-xs ${statusDisplay.color}`}>{statusDisplay.text}</span>
                </div>
              </div>
              <button
                onClick={() => { setNewName(identity.deviceName); setEditingName(true) }}
                className="text-blue-600 text-sm hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Paired Devices</h3>
          <button
            onClick={() => setShowPairing(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded"
          >
            Add Device
          </button>
        </div>
        <PairedDevicesList devices={devices} onRemove={handleRemoveDevice} peerStatuses={peerStatuses} />
      </section>

      <PairingModal
        open={showPairing}
        onClose={() => setShowPairing(false)}
        onPaired={handlePaired}
      />
    </div>
  )
}
