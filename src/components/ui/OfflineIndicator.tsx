'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff } from 'lucide-react'

/**
 * Displays a subtle banner when the user is offline.
 * Animates in/out smoothly and respects prefers-reduced-motion.
 */
export default function OfflineIndicator() {
  const { isOffline } = useNetworkStatus()

  if (!isOffline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 motion-safe:animate-in motion-safe:slide-in-from-top motion-safe:duration-300"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>You&apos;re offline — changes are saved locally</span>
        </div>
      </div>
    </div>
  )
}
