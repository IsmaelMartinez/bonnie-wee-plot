'use client'

import type { SyncStatus } from '@/types/sync'

interface SyncStatusIndicatorProps {
  status: SyncStatus
  onClick?: () => void
}

export function SyncStatusIndicator({ status, onClick }: SyncStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status.state) {
      case 'disconnected':
        return 'bg-gray-400'
      case 'discovering':
      case 'connecting':
        return 'bg-blue-400 animate-pulse'
      case 'connected':
      case 'syncing':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status.state) {
      case 'disconnected':
        return 'Not syncing'
      case 'discovering':
        return 'Looking for devices...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return status.connectedPeers.length === 1
          ? `Connected to ${status.connectedPeers[0].deviceName}`
          : `Connected to ${status.connectedPeers.length} devices`
      case 'syncing':
        return 'Syncing...'
      default:
        return ''
    }
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
      title={getStatusText()}
    >
      <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600 hidden sm:inline">
        {status.state === 'connected' && status.connectedPeers.length > 0
          ? status.connectedPeers[0].deviceName
          : null}
      </span>
    </button>
  )
}
