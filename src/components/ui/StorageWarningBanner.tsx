'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { getStorageAvailability, getStorageSuggestions } from '@/lib/storage-detection'

export default function StorageWarningBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [storageUnavailable, setStorageUnavailable] = useState<{
    reason: string
    suggestions: string[]
  } | null>(null)

  useEffect(() => {
    // Check if user has dismissed the warning in this session
    const sessionDismissed = sessionStorage.getItem('storage-warning-dismissed')
    if (sessionDismissed === 'true') {
      setIsDismissed(true)
      return
    }

    const availability = getStorageAvailability()

    if (!availability.available) {
      const suggestions = getStorageSuggestions()
      setStorageUnavailable({
        reason: availability.reason || 'localStorage is not available',
        suggestions
      })
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    // Remember dismissal for this session only
    try {
      sessionStorage.setItem('storage-warning-dismissed', 'true')
    } catch {
      // If sessionStorage also unavailable, just hide the banner
    }
  }

  if (!isVisible || isDismissed || !storageUnavailable) {
    return null
  }

  return (
    <div className="bg-red-50 border-b border-red-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-red-900 text-sm mb-1">
                  Data Storage Unavailable
                </h3>
                <p className="text-sm text-red-800 mb-2">
                  {storageUnavailable.reason}
                </p>
                {storageUnavailable.suggestions.length > 0 && (
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-1">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {storageUnavailable.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-red-600 mt-2 italic">
                  You can browse the app, but your changes won&apos;t be saved.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition flex-shrink-0"
                title="Dismiss warning"
                aria-label="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
