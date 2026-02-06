'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Lock, Sparkles } from 'lucide-react'
import { lockedFeatures, secondaryLinks, getProgressHint } from './Navigation'
import type { UnlockableFeature } from '@/lib/feature-flags'
import type { UnlockProgress } from '@/lib/feature-flags'

interface DesktopMoreDropdownProps {
  isMoreOpen: boolean
  setIsMoreOpen: (open: boolean) => void
  isActive: (href: string) => boolean
  isUnlocked: (feature: UnlockableFeature) => boolean
  getProgress: (feature: UnlockableFeature) => UnlockProgress
  onUnlockClick: (feature: UnlockableFeature) => void
}

export default function DesktopMoreDropdown({
  isMoreOpen,
  setIsMoreOpen,
  isActive,
  isUnlocked,
  getProgress,
  onUnlockClick,
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
          {/* Still-locked Features (unlocked ones are in primary nav) */}
          {lockedFeatures.filter(item => !isUnlocked(item.feature)).map((item) => {
            const IconComponent = item.icon
            const progress = getProgress(item.feature)
            const progressHint = getProgressHint(progress.currentValue, progress.targetValue, progress.unlockCondition)

            return (
              <div
                key={item.feature}
                role="menuitem"
                className="px-4 py-3 hover:bg-zen-stone-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0 text-zen-stone-300" />
                    <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-zen-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zen-stone-500">
                      {item.label}
                    </div>
                    <div className="text-xs text-zen-stone-500 mt-0.5">
                      {item.teaser}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zen-stone-500">{progressHint}</span>
                        <span className="text-zen-moss-600 font-medium">{progress.currentValue}/{progress.targetValue}</span>
                      </div>
                      <div className="h-1.5 bg-zen-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zen-moss-400 transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnlockClick(item.feature)}
                      className="mt-2 flex items-center gap-1 text-xs text-zen-moss-600 hover:text-zen-moss-700 font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Unlock now</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Divider - only show if there are locked features */}
          {lockedFeatures.some(item => !isUnlocked(item.feature)) && (
            <div className="border-t border-zen-stone-100 my-1" />
          )}

          {/* Always-available links */}
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
