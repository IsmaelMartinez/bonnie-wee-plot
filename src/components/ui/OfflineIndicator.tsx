'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff, Wifi } from 'lucide-react'

/**
 * Displays a subtle banner when the user is offline, reassuring them that
 * their data is safe in localStorage. Shows a brief "back online" confirmation
 * after reconnecting before disappearing.
 */
export default function OfflineIndicator() {
  const { isOffline, justReconnected } = useNetworkStatus()

  if (justReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-zen-moss-50 border-b border-zen-moss-200 animate-fade-in"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-zen-moss-700">
            <Wifi className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>You&apos;re back online</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isOffline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-zen-bamboo-50 border-b border-zen-bamboo-200 animate-fade-in"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-zen-bamboo-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>You&apos;re offline — your data is saved locally and safe</span>
        </div>
      </div>
    </div>
  )
}
