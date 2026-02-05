'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Map, Recycle, Pencil, Sparkles } from 'lucide-react'
import { getSeasonalPhase } from '@/lib/seasons'
import { useAllotment } from '@/hooks/useAllotment'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import UnlockCelebration, { FEATURE_INFO } from '@/components/ui/UnlockCelebration'
import DesktopMoreDropdown from './DesktopMoreDropdown'
import MobileMoreMenu from './MobileMoreMenu'
import type { UnlockableFeature } from '@/lib/feature-flags'

// Primary navigation - always visible (3 items for simplicity)
const primaryNavLinks = [
  { href: '/', label: 'Today' },
  { href: '/this-month', label: 'This Month' },
  { href: '/seeds', label: 'Seeds' },
]

// Features with progressive disclosure
export interface LockedFeatureConfig {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  teaser: string // Longer description for locked state
  feature: UnlockableFeature
}

export const lockedFeatures: LockedFeatureConfig[] = [
  {
    href: '/compost',
    label: 'Compost',
    icon: Recycle,
    description: 'Track your piles',
    teaser: 'Track your compost piles and know when they\'re ready to use in your garden.',
    feature: 'compost',
  },
  {
    href: '/allotment',
    label: 'Allotment',
    icon: Map,
    description: 'Plan your layout',
    teaser: 'Visualize your entire allotment. Arrange beds, paths, and permanent features.',
    feature: 'allotment-layout',
  },
]

/**
 * Format progress hint text based on progress data
 */
export function getProgressHint(currentValue: number, targetValue: number, unlockCondition: string): string {
  const remaining = targetValue - currentValue

  if (unlockCondition.includes('planting')) {
    if (remaining === 1) return 'Add 1 more planting to unlock'
    if (remaining > 1) return `Add ${remaining} more plantings to unlock`
    return 'Add a planting to unlock'
  }

  if (unlockCondition.includes('harvest')) {
    return 'Record a harvest to unlock'
  }

  if (unlockCondition.includes('Visit')) {
    if (remaining === 1) return 'Visit 1 more time to unlock'
    if (remaining > 1) return `Visit ${remaining} more times to unlock`
    return 'Keep visiting to unlock'
  }

  return `${currentValue}/${targetValue} ${unlockCondition}`
}

// Always-available secondary links
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
  const { isUnlocked, unlock, getProgress, newlyUnlockedFeature, dismissCelebration } = useFeatureFlags(data)

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

  // Handle unlock CTA click
  const handleUnlockClick = (feature: UnlockableFeature) => {
    unlock(feature)
    setIsMoreOpen(false)
  }

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
        <nav className="flex items-center justify-between h-16" role="navigation">
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

            {/* Unlocked features promoted to primary nav */}
            {lockedFeatures.filter(f => isUnlocked(f.feature)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-zen text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-zen-moss-50 text-zen-moss-700'
                    : 'text-zen-ink-600 hover:text-zen-ink-800 hover:bg-zen-stone-50'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* More Dropdown - locked features + secondary links */}
            <DesktopMoreDropdown
              isMoreOpen={isMoreOpen}
              setIsMoreOpen={setIsMoreOpen}
              isActive={isActive}
              isUnlocked={isUnlocked}
              getProgress={getProgress}
              onUnlockClick={handleUnlockClick}
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

              {/* Unlocked features promoted to primary nav */}
              {lockedFeatures.filter(f => isUnlocked(f.feature)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-zen text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-zen-moss-50 text-zen-moss-700'
                      : 'text-zen-ink-600 hover:bg-zen-stone-50'
                  }`}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile More Section - locked features + secondary links */}
              <MobileMoreMenu
                isActive={isActive}
                isUnlocked={isUnlocked}
                getProgress={getProgress}
                onUnlockClick={handleUnlockClick}
                closeMobileMenu={closeMobileMenu}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unlock Celebration Modal */}
      <UnlockCelebration
        isOpen={newlyUnlockedFeature !== null}
        onClose={dismissCelebration}
        feature={
          newlyUnlockedFeature
            ? {
                name: FEATURE_INFO[newlyUnlockedFeature].name,
                description: FEATURE_INFO[newlyUnlockedFeature].description,
                tips: FEATURE_INFO[newlyUnlockedFeature].tips,
                icon: (() => {
                  const featureConfig = lockedFeatures.find(f => f.feature === newlyUnlockedFeature)
                  const IconComponent = featureConfig?.icon
                  if (!IconComponent) {
                    return <Sparkles className="w-8 h-8" />
                  }
                  return <IconComponent className="w-8 h-8" />
                })(),
              }
            : null
        }
      />
    </header>
  )
}
