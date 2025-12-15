'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/companion-planting', label: 'Companion Planting' },
  { href: '/composting', label: 'Composting' },
  { href: '/ai-advisor', label: 'Aitor' },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between" role="navigation">
          <Link href="/" className="text-2xl font-bold hover:text-primary-200 transition">
            🌱 Community Allotment
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="hover:text-primary-200 transition"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Admin Navigation */}
            <Link href="/admin" className="hover:text-primary-200 flex items-center space-x-1 transition">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-primary-700 rounded-lg transition"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-primary-500 pt-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-primary-200 hover:bg-primary-700 px-3 py-2 rounded-lg transition"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Admin Navigation */}
              <Link 
                href="/admin" 
                className="hover:text-primary-200 hover:bg-primary-700 px-3 py-2 rounded-lg flex items-center space-x-2 transition"
                onClick={closeMobileMenu}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
