'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function Navigation() {
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
            <Link href="/companion-planting" className="hover:text-primary-200">Companion Planting</Link>
            <Link href="/composting" className="hover:text-primary-200">Composting</Link>
            <Link href="/ai-advisor" className="hover:text-primary-200">Aitor</Link>
            
            {/* Admin Navigation */}
            <Link href="/admin" className="hover:text-primary-200 flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
