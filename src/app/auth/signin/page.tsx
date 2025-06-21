'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Github, Shield, Users, Calendar, Bot } from 'lucide-react'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const error = searchParams.get('error')

  useEffect(() => {
    // Check if already signed in
    getSession().then((session) => {
      if (session?.user?.isAdmin) {
        router.push('/admin')
      }
    })
  }, [router])

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('github', { callbackUrl: '/admin' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-600">
            Sign in with your GitHub account to access the Community Allotment admin dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              {error === 'AccessDenied' 
                ? 'Access denied. Only authorized administrators can access this area.'
                : 'An error occurred during sign in. Please try again.'
              }
            </p>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <Github className="w-5 h-5" />
          <span>{loading ? 'Signing in...' : 'Sign in with GitHub'}</span>
        </button>

        {/* Public Access Info */}
        <div className="border-t pt-6">
          <p className="text-sm text-gray-500 text-center mb-4">
            Looking for community content? No account needed:
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => router.push('/announcements')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Community Announcements</span>
            </button>
            
            <button
              onClick={() => router.push('/calendar')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Events Calendar</span>
            </button>
            
            <button
              onClick={() => router.push('/ai-advisor')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <Bot className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">AI Gardening Advisor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}