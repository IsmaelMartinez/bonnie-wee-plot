'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Calendar, Map, Package, Leaf, BookOpen, Recycle, Lock, Sparkles, Settings } from 'lucide-react'
import { getCurrentSeason, getSeasonalTheme } from '@/lib/seasonal-theme'
import { useAllotment } from '@/hooks/useAllotment'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import UnlockCelebration, { FEATURE_INFO } from '@/components/ui/UnlockCelebration'
import type { UnlockableFeature } from '@/lib/feature-flags'

// Primary navigation - always visible (3 items for simplicity)
const primaryNavLinks = [
  { href: '/', label: 'Today' },
  { href: '/this-month', label: 'This Month', icon: Calendar },
  { href: '/seeds', label: 'Seeds', icon: Package },
]

// Features with progressive disclosure
interface LockedFeatureConfig {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  teaser: string // Longer description for locked state
  feature: UnlockableFeature
}

const lockedFeatures: LockedFeatureConfig[] = [
  {
    href: '/ai-advisor',
    label: 'Ask Aitor',
    icon: Leaf,
    description: 'AI garden advice',
    teaser: 'Get personalized advice from your AI garden assistant. Ask about planting, pests, and more.',
    feature: 'ai-advisor',
  },
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
function getProgressHint(currentValue: number, targetValue: number, unlockCondition: string): string {
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
const secondaryLinks = [
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Sync & preferences' },
  { href: '/about', label: 'About', icon: BookOpen, description: 'Learn more' },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  const theme = getSeasonalTheme(getCurrentSeason())

  // Handle unlock CTA click
  const handleUnlockClick = (feature: UnlockableFeature) => {
    unlock(feature)
    setIsMoreOpen(false)
  }

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
          {/* Logo and Allotment Name */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center text-zen-ink-800 hover:text-zen-ink-900 transition-colors"
              aria-label="Home"
            >
              <span className="text-2xl" aria-hidden="true">
                {theme.season === 'winter' && '❄️'}
                {theme.season === 'spring' && '🌸'}
                {theme.season === 'summer' && '🌿'}
                {theme.season === 'autumn' && '🍂'}
              </span>
            </Link>
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="font-display text-xl tracking-tight text-zen-ink-800 border-b-2 border-zen-moss-500 bg-transparent outline-none px-1 max-w-[200px]"
                autoFocus
                aria-label="Allotment name"
              />
            ) : (
              <button
                onClick={handleStartEditName}
                className="font-display text-xl tracking-tight text-zen-ink-800 hover:text-zen-moss-600 transition-colors cursor-pointer"
                title="Click to edit allotment name"
              >
                {data?.meta.name || 'My Allotment'}
              </button>
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

            {/* More Dropdown with Progressive Disclosure */}
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
                  {/* Locked/Unlocked Features */}
                  {lockedFeatures.map((item) => {
                    const IconComponent = item.icon
                    const unlocked = isUnlocked(item.feature)
                    const progress = getProgress(item.feature)

                    if (unlocked) {
                      // Unlocked - show as regular link
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            isActive(item.href)
                              ? 'bg-zen-moss-50'
                              : 'hover:bg-zen-stone-50'
                          }`}
                          onClick={() => setIsMoreOpen(false)}
                        >
                          <IconComponent
                            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              isActive(item.href) ? 'text-zen-moss-600' : 'text-zen-stone-400'
                            }`}
                          />
                          <div>
                            <div className={`text-sm font-medium ${
                              isActive(item.href) ? 'text-zen-moss-700' : 'text-zen-ink-700'
                            }`}>
                              {item.label}
                            </div>
                            <div className="text-xs text-zen-stone-500 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    }

                    // Locked - show with teaser, progress, and unlock CTA
                    const progressHint = getProgressHint(progress.currentValue, progress.targetValue, progress.unlockCondition)

                    return (
                      <div
                        key={item.href}
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
                            {/* Feature teaser */}
                            <div className="text-xs text-zen-stone-500 mt-0.5">
                              {item.teaser}
                            </div>
                            {/* Progress bar with hint */}
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
                            {/* Unlock CTA */}
                            <button
                              type="button"
                              onClick={() => handleUnlockClick(item.feature)}
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

                  {/* Divider */}
                  <div className="border-t border-zen-stone-100 my-1" />

                  {/* Always-available links */}
                  {secondaryLinks.map((link) => {
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

              {/* Mobile More Section with Progressive Disclosure */}
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
                    {/* Locked/Unlocked Features */}
                    {lockedFeatures.map((item) => {
                      const IconComponent = item.icon
                      const unlocked = isUnlocked(item.feature)
                      const progress = getProgress(item.feature)

                      if (unlocked) {
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 py-2 text-sm transition-colors ${
                              isActive(item.href)
                                ? 'text-zen-moss-700'
                                : 'text-zen-ink-600 hover:text-zen-ink-800'
                            }`}
                            onClick={closeMobileMenu}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      }

                      // Locked - show with teaser, progress hint, and unlock option
                      const progressHint = getProgressHint(progress.currentValue, progress.targetValue, progress.unlockCondition)

                      return (
                        <div key={item.href} className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <IconComponent className="w-4 h-4 text-zen-stone-300" />
                              <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-zen-stone-400" />
                            </div>
                            <span className="text-sm text-zen-stone-500">{item.label}</span>
                          </div>
                          <div className="mt-1 ml-6">
                            {/* Feature teaser */}
                            <p className="text-xs text-zen-stone-500 mb-2">{item.teaser}</p>
                            {/* Progress bar with hint */}
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
                                handleUnlockClick(item.feature)
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

                    {/* Divider */}
                    <div className="border-t border-zen-stone-100 my-1" />

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
