'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Book, ChevronDown, Users, Recycle, RotateCcw, Calendar, Map } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/allotment', label: 'My Allotment', icon: Map },
  { href: '/garden-planner', label: 'Garden Planner' },
  { href: '/ai-advisor', label: 'Aitor' },
]

const growingGuides = [
  { href: '/this-month', label: 'This Month', icon: Calendar, description: 'Seasonal tasks for Scotland' },
  { href: '/companion-planting', label: 'Companion Planting', icon: Users, description: 'Plants that grow well together' },
  { href: '/composting', label: 'Composting', icon: Recycle, description: 'Turn waste into garden gold' },
  { href: '/crop-rotation', label: 'Crop Rotation', icon: RotateCcw, description: 'Maximize soil health & yields' },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGuidesOpen, setIsGuidesOpen] = useState(false)
  const [isMobileGuidesOpen, setIsMobileGuidesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsGuidesOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsGuidesOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    setIsMobileGuidesOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsMobileGuidesOpen(false)
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
            
            {/* Growing Guides Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsGuidesOpen(!isGuidesOpen)}
                onMouseEnter={() => setIsGuidesOpen(true)}
                className="flex items-center space-x-1 hover:text-primary-200 transition"
                aria-expanded={isGuidesOpen}
                aria-haspopup="true"
              >
                <Book className="w-4 h-4" />
                <span>Growing Guides</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isGuidesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isGuidesOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50"
                  onMouseLeave={() => setIsGuidesOpen(false)}
                >
                  {growingGuides.map((guide) => {
                    const IconComponent = guide.icon
                    return (
                      <Link
                        key={guide.href}
                        href={guide.href}
                        className="flex items-start px-4 py-3 hover:bg-primary-50 transition group"
                        onClick={() => setIsGuidesOpen(false)}
                      >
                        <IconComponent className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-gray-800 font-medium group-hover:text-primary-600 transition">
                            {guide.label}
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {guide.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            
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
            <div className="flex flex-col space-y-1">
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
              
              {/* Mobile Growing Guides Expandable Section */}
              <div className="px-3">
                <button
                  onClick={() => setIsMobileGuidesOpen(!isMobileGuidesOpen)}
                  className="w-full flex items-center justify-between py-2 hover:text-primary-200 transition"
                  aria-expanded={isMobileGuidesOpen}
                >
                  <div className="flex items-center space-x-2">
                    <Book className="w-4 h-4" />
                    <span>Growing Guides</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileGuidesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isMobileGuidesOpen && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-primary-400 pl-3">
                    {growingGuides.map((guide) => {
                      const IconComponent = guide.icon
                      return (
                        <Link
                          key={guide.href}
                          href={guide.href}
                          className="flex items-center space-x-2 py-2 hover:text-primary-200 transition text-sm"
                          onClick={closeMobileMenu}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{guide.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
