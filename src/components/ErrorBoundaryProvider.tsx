'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface ErrorBoundaryProviderProps {
  children: ReactNode
}

/**
 * Client-side error boundary provider for wrapping page content
 * Use this in the root layout to catch errors across all pages
 */
export default function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary
      onError={(error) => {
        // In production, you could send errors to a logging service
        if (process.env.NODE_ENV === 'production') {
          console.error('Production error:', error.message)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

