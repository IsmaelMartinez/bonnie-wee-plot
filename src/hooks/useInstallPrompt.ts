'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface InstallPromptState {
  canInstall: boolean
  isInstalled: boolean
  isIOS: boolean
  showPrompt: boolean
  visitCount: number
}

const STORAGE_KEY = 'install-prompt-state'
const MIN_VISITS_BEFORE_PROMPT = 2

function getStoredState(): { dismissed: boolean; visitCount: number; lastVisit: string | null } {
  if (typeof window === 'undefined') {
    return { dismissed: false, visitCount: 0, lastVisit: null }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return { dismissed: false, visitCount: 0, lastVisit: null }
}

function setStoredState(state: { dismissed: boolean; visitCount: number; lastVisit: string }) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing PWA install prompt
 *
 * Shows install prompt after meaningful engagement (second visit or more).
 * Handles iOS separately since it doesn't support beforeinstallprompt.
 *
 * @returns Install prompt state and control functions
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<InstallPromptState>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    showPrompt: false,
    visitCount: 0,
  })

  // Check if running as installed PWA
  const checkIfInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false

    // Check display-mode media query
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    // Check iOS standalone mode
    const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true

    return isStandalone || isIOSStandalone
  }, [])

  // Check if iOS
  const checkIfIOS = useCallback(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window)
  }, [])

  // Initialize and track visits
  useEffect(() => {
    const isIOS = checkIfIOS()
    const isInstalled = checkIfInstalled()
    const stored = getStoredState()

    // Track visit (once per session)
    const today = new Date().toDateString()
    const isNewVisit = stored.lastVisit !== today
    const newVisitCount = isNewVisit ? stored.visitCount + 1 : stored.visitCount

    if (isNewVisit) {
      setStoredState({
        ...stored,
        visitCount: newVisitCount,
        lastVisit: today,
      })
    }

    // Determine if we should show the prompt
    const shouldShowPrompt =
      !isInstalled &&
      !stored.dismissed &&
      newVisitCount >= MIN_VISITS_BEFORE_PROMPT

    setState(prev => ({
      ...prev,
      isIOS,
      isInstalled,
      visitCount: newVisitCount,
      showPrompt: shouldShowPrompt && (isIOS || prev.canInstall),
    }))
  }, [checkIfIOS, checkIfInstalled])

  // Listen for beforeinstallprompt event (not fired on iOS)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      const stored = getStoredState()
      const shouldShowPrompt =
        !stored.dismissed &&
        stored.visitCount >= MIN_VISITS_BEFORE_PROMPT

      setState(prev => ({
        ...prev,
        canInstall: true,
        showPrompt: shouldShowPrompt,
      }))
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        showPrompt: false,
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Trigger the native install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setState(prev => ({
          ...prev,
          canInstall: false,
          showPrompt: false,
        }))
      }

      return outcome === 'accepted'
    } catch {
      return false
    }
  }, [deferredPrompt])

  // Dismiss the prompt (won't show again)
  const dismissPrompt = useCallback(() => {
    const stored = getStoredState()
    setStoredState({
      ...stored,
      dismissed: true,
      lastVisit: new Date().toDateString(),
    })
    setState(prev => ({
      ...prev,
      showPrompt: false,
    }))
  }, [])

  // Hide prompt temporarily (will show again on next visit)
  const hidePrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPrompt: false,
    }))
  }, [])

  return {
    ...state,
    promptInstall,
    dismissPrompt,
    hidePrompt,
  }
}
