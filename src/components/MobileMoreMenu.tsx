'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Lock, Sparkles } from 'lucide-react'
import { lockedFeatures, secondaryLinks, getProgressHint } from './Navigation'
import type { UnlockableFeature } from '@/lib/feature-flags'
import type { UnlockProgress } from '@/lib/feature-flags'

interface MobileMoreMenuProps {
  isActive: (href: string) => boolean
  isUnlocked: (feature: UnlockableFeature) => boolean
  getProgress: (feature: UnlockableFeature) => UnlockProgress
  onUnlockClick: (feature: UnlockableFeature) => void
  closeMobileMenu: () => void
}

export default function MobileMoreMenu({
  isActive,
  isUnlocked,
  getProgress,
  onUnlockClick,
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
          {/* Still-locked Features (unlocked ones are in primary nav) */}
          {lockedFeatures.filter(item => !isUnlocked(item.feature)).map((item) => {
            const IconComponent = item.icon
            const progress = getProgress(item.feature)
            const progressHint = getProgressHint(progress.currentValue, progress.targetValue, progress.unlockCondition)

            return (
              <div key={item.feature} className="py-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <IconComponent className="w-4 h-4 text-zen-stone-300" />
                    <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-zen-stone-400" />
                  </div>
                  <span className="text-sm text-zen-stone-500">{item.label}</span>
                </div>
                <div className="mt-1 ml-6">
                  <p className="text-xs text-zen-stone-500 mb-2">{item.teaser}</p>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="text-zen-moss-600 font-medium">{progress.currentValue}/{progress.targetValue}</span>
                    <div className="flex-1 h-1.5 bg-zen-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zen-moss-400 transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-zen-stone-500 mb-2">{progressHint}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onUnlockClick(item.feature)
                      closeMobileMenu()
                    }}
                    className="flex items-center gap-1 text-xs text-zen-moss-600 hover:text-zen-moss-700 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Unlock now</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Divider - only show if there are locked features */}
          {lockedFeatures.some(item => !isUnlocked(item.feature)) && (
            <div className="border-t border-zen-stone-100 my-1" />
          )}

          {/* Always-available links */}
          {secondaryLinks.map((link) => {
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
  )
}
