'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Pencil } from 'lucide-react'
import { getSeasonalPhase } from '@/lib/seasons'
import { useAllotment } from '@/hooks/useAllotment'
import DesktopMoreDropdown from './DesktopMoreDropdown'
import MobileMoreMenu from './MobileMoreMenu'

// Primary navigation - always visible
const primaryNavLinks = [
  { href: '/', label: 'Today' },
  { href: '/this-month', label: 'This Month' },
  { href: '/seeds', label: 'Seeds' },
  { href: '/compost', label: 'Compost' },
  { href: '/allotment', label: 'Allotment' },
]

// Secondary links shown in "More" dropdown
export const secondaryLinks = [
  { href: '/settings', label: 'Settings', description: 'Sync & preferences' },
  { href: '/about', label: 'About', description: 'Learn more' },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const pathname = usePathname()
  const { data, updateMeta } = useAllotment()

  const handleStartEditName = () => {
    setNameInput(data?.meta.name || 'My Allotment')
    setIsEditingName(true)
  }

  const handleSaveName = () => {
    const trimmedName = nameInput.trim()
    if (trimmedName && trimmedName !== data?.meta.name) {
      updateMeta({ name: trimmedName })
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
    }
  }

  const seasonalPhase = getSeasonalPhase(new Date().getMonth())

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const isActive = (href: string) => pathname === href

  return (
    <header className="bg-white border-b border-zen-stone-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Main navigation">
          {/* Logo and Allotment Name */}
          <div className="flex items-center gap-1">
            {isEditingName ? (
              <>
                <span className="text-2xl" aria-hidden="true">
                  {seasonalPhase.emoji}
                </span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="font-display text-xl tracking-tight text-zen-ink-800 border-b-2 border-zen-moss-500 bg-transparent outline-none px-1 max-w-[200px] ml-1"
                  autoFocus
                  aria-label="Allotment name"
                />
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-2 text-zen-ink-800 hover:text-zen-ink-900 transition-colors"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {seasonalPhase.emoji}
                  </span>
                  <span className="font-display text-xl tracking-tight">
                    {data?.meta.name || 'My Allotment'}
                  </span>
                </Link>
                <button
                  onClick={handleStartEditName}
                  className="p-1.5 text-zen-stone-400 hover:text-zen-moss-600 transition-colors rounded-zen hover:bg-zen-stone-50"
                  title="Edit allotment name"
                  aria-label="Edit allotment name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryNavLinks.map((link) => (
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

            {/* More Dropdown - secondary links */}
            <DesktopMoreDropdown
              isMoreOpen={isMoreOpen}
              setIsMoreOpen={setIsMoreOpen}
              isActive={isActive}
            />
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
              {primaryNavLinks.map((link) => (
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

              {/* Mobile More Section - secondary links */}
              <MobileMoreMenu
                isActive={isActive}
                closeMobileMenu={closeMobileMenu}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
