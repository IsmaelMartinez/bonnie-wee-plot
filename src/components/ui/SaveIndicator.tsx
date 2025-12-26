'use client'

import { CheckCircle, Cloud, CloudOff, Loader2 } from 'lucide-react'
import type { SaveStatus } from '@/hooks/useAllotment'

interface SaveIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
}

/**
 * Visual indicator for save status
 * Shows when data is saving, saved, or has an error
 */
export default function SaveIndicator({ status, lastSavedAt }: SaveIndicatorProps) {
  // Format relative time
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (status === 'idle' && !lastSavedAt) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 text-xs" role="status" aria-live="polite">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" aria-hidden="true" />
          <span className="text-blue-600 font-medium">Saving...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
          <span className="text-emerald-600 font-medium">Saved</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
          <span className="text-red-600 font-medium">Save failed</span>
        </>
      )}
      
      {status === 'idle' && lastSavedAt && (
        <>
          <Cloud className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          <span className="text-gray-500">Saved {getTimeAgo(lastSavedAt)}</span>
        </>
      )}
    </div>
  )
}

