'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, User, Shield } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between" role="navigation">
          <h1 className="text-2xl font-bold">🌱 Community Allotment</h1>
          
          <div className="flex items-center space-x-4">
            {/* Public Navigation */}
            <Link href="/" className="hover:text-primary-200">Home</Link>
            <Link href="/announcements" className="hover:text-primary-200">Announcements</Link>
            <Link href="/calendar" className="hover:text-primary-200">Calendar</Link>
            <Link href="/ai-advisor" className="hover:text-primary-200">Aitor</Link>
            
            {/* Admin Navigation */}
            {session?.user?.isAdmin && (
              <Link href="/admin" className="hover:text-primary-200 flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            
            {/* Auth Status */}
            <div className="border-l border-primary-400 pl-4">
              {status === 'loading' && (
                <div className="text-primary-200">Loading...</div>
              )}
              
              {status !== 'loading' && session?.user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {session.user.name}
                      {session.user.isAdmin && (
                        <span className="ml-1 text-xs bg-yellow-500 text-yellow-900 px-1 rounded">
                          Admin
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-primary-200 hover:text-white flex items-center space-x-1 text-sm"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
              
              {status !== 'loading' && !session?.user && (
                <Link 
                  href="/auth/signin" 
                  className="text-primary-200 hover:text-white text-sm"
                >
                  Admin Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
