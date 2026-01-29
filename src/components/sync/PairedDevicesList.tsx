'use client'

import type { PairedDevice } from '@/types/sync'

interface PairedDevicesListProps {
  devices: PairedDevice[]
  onRemove: (publicKey: string) => void
}

export function PairedDevicesList({ devices, onRemove }: PairedDevicesListProps) {
  if (devices.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4 text-center">
        No paired devices yet
      </p>
    )
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <ul className="divide-y">
      {devices.map((device) => (
        <li key={device.publicKey} className="py-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{device.deviceName}</p>
            <p className="text-xs text-gray-500">
              Last seen: {formatLastSeen(device.lastSeen)}
            </p>
          </div>
          <button
            onClick={() => onRemove(device.publicKey)}
            className="text-red-600 text-sm hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
