'use client'

import type { PairedDevice } from '@/types/sync'

interface PeerStatus {
  publicKey: string
  connected: boolean
  authenticated: boolean
}

interface PairedDevicesListProps {
  devices: PairedDevice[]
  onRemove: (publicKey: string) => void
  peerStatuses?: Map<string, PeerStatus>
}

export function PairedDevicesList({ devices, onRemove, peerStatuses }: PairedDevicesListProps) {
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

  const getConnectionStatus = (publicKey: string) => {
    const status = peerStatuses?.get(publicKey)
    if (!status) return { text: 'Offline', color: 'text-gray-400', dot: 'bg-gray-400' }
    if (status.authenticated) return { text: 'Connected', color: 'text-green-600', dot: 'bg-green-500' }
    if (status.connected) return { text: 'Authenticating...', color: 'text-yellow-600', dot: 'bg-yellow-500' }
    return { text: 'Offline', color: 'text-gray-400', dot: 'bg-gray-400' }
  }

  return (
    <ul className="divide-y">
      {devices.map((device) => {
        const connStatus = getConnectionStatus(device.publicKey)
        return (
          <li key={device.publicKey} className="py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{device.deviceName}</p>
                <span className={`w-2 h-2 rounded-full ${connStatus.dot}`} title={connStatus.text} />
              </div>
              <p className="text-xs text-gray-500">
                {connStatus.text === 'Connected' ? (
                  <span className={connStatus.color}>{connStatus.text}</span>
                ) : (
                  <>Last seen: {formatLastSeen(device.lastSeen)}</>
                )}
              </p>
            </div>
            <button
              onClick={() => onRemove(device.publicKey)}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </li>
        )
      })}
    </ul>
  )
}
