'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { secondaryLinks } from './Navigation'

interface MobileMoreMenuProps {
  isActive: (href: string) => boolean
  closeMobileMenu: () => void
}

export default function MobileMoreMenu({
  isActive,
  closeMobileMenu,
}: MobileMoreMenuProps) {
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)

  return (
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
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2 text-sm transition-colors ${
                isActive(link.href)
                  ? 'text-zen-moss-700'
                  : 'text-zen-ink-600 hover:text-zen-ink-800'
              }`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
