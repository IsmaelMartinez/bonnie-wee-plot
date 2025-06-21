'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

const errorMessages = {
  AccessDenied: {
    title: 'Access Denied',
    message: 'Only authorized administrators can access the admin dashboard. If you believe this is an error, please contact the community administrators.',
    suggestion: 'You can still access all public community content without signing in.'
  },
  Configuration: {
    title: 'Configuration Error',
    message: 'There is a issue with the authentication configuration. Please contact the system administrator.',
    suggestion: 'This is a technical issue that needs to be resolved by the administrators.'
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during sign in. Please try again.',
    suggestion: 'If the problem persists, please contact support.'
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error') ?? 'Default'
  
  const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {errorInfo.message}
          </p>
          <p className="text-sm text-gray-500">
            {errorInfo.suggestion}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </button>
        </div>

        {/* Contact Info */}
        {error === 'AccessDenied' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need admin access?</strong> Contact the community administrators 
              to request access to the admin dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
