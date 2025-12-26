'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error handler for the entire application
 * This catches errors in the root layout itself
 */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Application Error
            </h2>
            
            <p className="text-gray-600 mb-6">
              Something went wrong with the application.
              Please try refreshing the page.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

