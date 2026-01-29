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

  useEffect(() => {
    setIdentity(getOrCreateIdentity())
    setDevices(getPairedDevices())
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

  if (!identity) return null

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
