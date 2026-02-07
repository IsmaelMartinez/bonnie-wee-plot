'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { secondaryLinks } from './Navigation'

interface DesktopMoreDropdownProps {
  isMoreOpen: boolean
  setIsMoreOpen: (open: boolean) => void
  isActive: (href: string) => boolean
}

export default function DesktopMoreDropdown({
  isMoreOpen,
  setIsMoreOpen,
  isActive,
}: DesktopMoreDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

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
  }, [setIsMoreOpen])

  return (
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
          className="absolute top-full right-0 mt-1 w-64 bg-white rounded-zen-lg border border-zen-stone-200 shadow-zen-md py-1 z-50"
        >
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              className={`block px-4 py-3 transition-colors ${
                isActive(link.href)
                  ? 'bg-zen-moss-50'
                  : 'hover:bg-zen-stone-50'
              }`}
              onClick={() => setIsMoreOpen(false)}
            >
              <div className={`text-sm font-medium ${
                isActive(link.href) ? 'text-zen-moss-700' : 'text-zen-ink-700'
              }`}>
                {link.label}
              </div>
              <div className="text-xs text-zen-stone-500 mt-0.5">
                {link.description}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
