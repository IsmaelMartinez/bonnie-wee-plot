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
import type { DeviceIdentity, PairedDevice } from '@/types/sync'

export function DeviceSettings() {
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null)
  const [devices, setDevices] = useState<PairedDevice[]>([])
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showPairing, setShowPairing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
              <span className="font-medium">{identity.deviceName}</span>
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
        <PairedDevicesList devices={devices} onRemove={handleRemoveDevice} />
      </section>

      <PairingModal
        open={showPairing}
        onClose={() => setShowPairing(false)}
        onPaired={handlePaired}
      />
    </div>
  )
}
