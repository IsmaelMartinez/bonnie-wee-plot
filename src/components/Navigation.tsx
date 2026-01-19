'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Calendar, Map, Package, Leaf, BookOpen, Recycle } from 'lucide-react'
import { getCurrentSeason, getSeasonalTheme } from '@/lib/seasonal-theme'
import { useAllotment } from '@/hooks/useAllotment'

const navLinks = [
  { href: '/', label: 'Today' },
  { href: '/allotment', label: 'Allotment', icon: Map },
  { href: '/seeds', label: 'Seeds', icon: Package },
]

const moreLinks = [
  { href: '/compost', label: 'Compost', icon: Recycle, description: 'Track your piles' },
  { href: '/this-month', label: 'This Month', icon: Calendar, description: 'Seasonal calendar' },
  { href: '/ai-advisor', label: 'Ask Aitor', icon: Leaf, description: 'Garden advice' },
  { href: '/about', label: 'About', icon: BookOpen, description: 'Learn more' },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const { data } = useAllotment()

  const theme = getSeasonalTheme(getCurrentSeason())

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false)
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
    setIsMobileMoreOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsMobileMoreOpen(false)
  }

  const isActive = (href: string) => pathname === href

  return (
    <header className="bg-white border-b border-zen-stone-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16" role="navigation">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-zen-ink-800 hover:text-zen-ink-900 transition-colors"
          >
            <span className="text-2xl" aria-hidden="true">
              {theme.season === 'winter' && '❄️'}
              {theme.season === 'spring' && '🌸'}
              {theme.season === 'summer' && '🌿'}
              {theme.season === 'autumn' && '🍂'}
            </span>
            <span className="font-display text-xl tracking-tight">
              {data?.meta.name || 'My Allotment'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-zen text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-zen-moss-50 text-zen-moss-700'
                    : 'text-zen-ink-600 hover:text-zen-ink-800 hover:bg-zen-stone-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* More Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-zen text-sm font-medium transition-colors ${
                  isMoreOpen
                    ? 'bg-zen-stone-100 text-zen-ink-800'
                    : 'text-zen-ink-600 hover:text-zen-ink-800 hover:bg-zen-stone-50'
                }`}
                aria-expanded={isMoreOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isMoreOpen && (
                <div
                  role="menu"
                  className="absolute top-full right-0 mt-1 w-56 bg-white rounded-zen-lg border border-zen-stone-200 shadow-zen-md py-1 z-50"
                >
                  {moreLinks.map((link) => {
                    const IconComponent = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          isActive(link.href)
                            ? 'bg-zen-moss-50'
                            : 'hover:bg-zen-stone-50'
                        }`}
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <IconComponent
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            isActive(link.href) ? 'text-zen-moss-600' : 'text-zen-stone-400'
                          }`}
                        />
                        <div>
                          <div className={`text-sm font-medium ${
                            isActive(link.href) ? 'text-zen-moss-700' : 'text-zen-ink-700'
                          }`}>
                            {link.label}
                          </div>
                          <div className="text-xs text-zen-stone-500 mt-0.5">
                            {link.description}
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
            type="button"
            className="lg:hidden p-2 rounded-zen text-zen-ink-600 hover:bg-zen-stone-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-zen-stone-100">
            <div className="pt-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-zen text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-zen-moss-50 text-zen-moss-700'
                      : 'text-zen-ink-600 hover:bg-zen-stone-50'
                  }`}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile More Section */}
              <div className="pt-2 border-t border-zen-stone-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-zen-ink-600"
                  aria-expanded={isMobileMoreOpen}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isMobileMoreOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isMobileMoreOpen && (
                  <div className="ml-3 mt-1 space-y-1 border-l-2 border-zen-stone-200 pl-3">
                    {moreLinks.map((link) => {
                      const IconComponent = link.icon
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-2 py-2 text-sm transition-colors ${
                            isActive(link.href)
                              ? 'text-zen-moss-700'
                              : 'text-zen-ink-600 hover:text-zen-ink-800'
                          }`}
                          onClick={closeMobileMenu}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{link.label}</span>
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
