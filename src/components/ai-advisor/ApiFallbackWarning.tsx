'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface ApiFallbackWarningProps {
  reason: string
}

export default function ApiFallbackWarning({ reason }: ApiFallbackWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  return (
    <div className="bg-zen-bamboo-50 border border-zen-bamboo-200 rounded-zen-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-zen-bamboo-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-amber-900 text-sm mb-1">
            Using Direct OpenAI Connection
          </h4>
          <p className="text-sm text-zen-bamboo-800 mb-2">
            {reason === 'API route not available (static deployment)'
              ? 'The server API route is not available. This is normal for static deployments like GitHub Pages. Your requests are being sent directly to OpenAI.'
              : 'The server API is temporarily unavailable. Your requests are being sent directly to OpenAI as a fallback.'}
          </p>
          <p className="text-xs text-amber-700">
            Your API token is being used securely and this does not affect functionality.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-zen-bamboo-600 hover:text-zen-bamboo-800 hover:bg-zen-bamboo-100 rounded transition flex-shrink-0"
          title="Dismiss"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
