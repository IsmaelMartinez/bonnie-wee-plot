'use client'

import { useEffect, useState } from 'react'
import type { SyncEvent } from '@/types/sync'

interface SyncToastProps {
  event: SyncEvent | null
  onDismiss: () => void
}

export function SyncToast({ event, onDismiss }: SyncToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (event) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [event, onDismiss])

  if (!event) return null

  const getMessage = () => {
    switch (event.type) {
      case 'sync-complete':
        return `Synced with ${event.peerName} · ${event.changeCount} changes`
      case 'peer-connected':
        return `Connected to ${event.peerName}`
      case 'peer-disconnected':
        return `${event.peerName} disconnected`
      case 'error':
        return `Sync error: ${event.error}`
      default:
        return ''
    }
  }

  const getIcon = () => {
    switch (event.type) {
      case 'sync-complete':
        return '✓'
      case 'peer-connected':
        return '🔗'
      case 'peer-disconnected':
        return '🔌'
      case 'error':
        return '⚠️'
      default:
        return ''
    }
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span>{getIcon()}</span>
      <span className="text-sm">{getMessage()}</span>
    </div>
  )
}
