'use client'

import { useState, useEffect } from 'react'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useAllotment } from '@/hooks/useAllotment'
import { useApiToken } from '@/hooks/useSessionStorage'
import { useLocation } from '@/hooks/useLocation'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import Link from 'next/link'
import { Download, ArrowRight, Shield, MapPin, Leaf, Lock, Database, HelpCircle } from 'lucide-react'
import LocationStatus from '@/components/ai-advisor/LocationStatus'
import DataManagement from '@/components/allotment/DataManagement'
import PageTour from '@/components/onboarding/PageTour'
import TourManager from '@/components/onboarding/TourManager'

export default function SettingsPage() {
  const { data, flushSave, reload } = useAllotment()
  const { token, saveToken, clearToken } = useApiToken()
  const { userLocation, locationError, detectUserLocation, isDetecting } = useLocation()
  const { isUnlocked } = useFeatureFlags(data)
  const [tempToken, setTempToken] = useState('')

  // Sync temp token with actual token
  useEffect(() => {
    setTempToken(token)
  }, [token])

  const handleSaveToken = () => {
    saveToken(tempToken)
  }

  const handleClearToken = () => {
    clearToken()
    setTempToken('')
  }

  // Handle paste - primary way to enter API key
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    setTempToken(pastedText.trim())
  }

  // Block direct typing - only allow paste, delete, and navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    const isModifierKey = e.ctrlKey || e.metaKey

    if (allowedKeys.includes(e.key) || isModifierKey) {
      return
    }

    e.preventDefault()
  }

  const aiUnlocked = isUnlocked('ai-advisor')

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-zen-ink-800">Settings</h1>
        <PageTour tourId="settings" autoStart autoStartDelay={1000} />
      </div>

      {/* AI Assistant Section */}
      <section className="mb-8 zen-card p-6" data-tour="ai-settings">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-zen-moss-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">AI Assistant (Aitor)</h2>
          {!aiUnlocked && (
            <span className="inline-flex items-center gap-1 text-xs text-zen-stone-500 bg-zen-stone-100 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>

        {!aiUnlocked ? (
          <p className="text-sm text-gray-600 mb-4">
            Aitor is your AI gardening companion. Add a planting or visit the app a few more times to unlock this feature.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Configure your OpenAI API key to use Aitor, your AI gardening assistant.
              Aitor can help with planting advice, pest identification, and even add plants to your garden.
            </p>

            {/* API Token Configuration */}
            <div className="space-y-4">
              <div>
                <label htmlFor="openai-token" className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    id="openai-token"
                    type="password"
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste your API key here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                    aria-describedby="token-help-text token-privacy-notice"
                    autoComplete="off"
                  />
                </div>

                <div id="token-help-text" className="mt-2 text-xs text-gray-500">
                  <p>
                    Your OpenAI API key from the OpenAI dashboard.{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zen-moss-600 hover:underline"
                    >
                      Get one here
                    </a>
                  </p>
                </div>
              </div>

              <div id="token-privacy-notice" className="bg-yellow-50 border border-yellow-200 rounded-md p-3" role="note">
                <div className="flex items-start">
                  <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="ml-2">
                    <p className="text-sm text-yellow-800">
                      <strong>Privacy Notice:</strong> Your token is stored only in your browser session and never saved permanently.
                      It&apos;s sent securely to OpenAI only when making requests.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveToken}
                  disabled={!tempToken.trim()}
                  className="zen-btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Token
                </button>
                {token && (
                  <button
                    onClick={handleClearToken}
                    className="zen-btn-secondary min-h-[44px]"
                  >
                    Clear Token
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Location Section */}
      <section className="mb-8 zen-card p-6" data-tour="location-settings">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-zen-water-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Location</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Your location helps Aitor provide personalized gardening advice based on your local climate and timezone.
        </p>
        <div className="flex items-center gap-4">
          <LocationStatus
            userLocation={userLocation}
            locationError={locationError}
            onRetry={detectUserLocation}
            isDetecting={isDetecting}
          />
          {!userLocation && !isDetecting && (
            <button
              onClick={detectUserLocation}
              className="px-4 py-2 bg-zen-water-100 text-zen-water-700 rounded-md hover:bg-zen-water-200 transition-colors min-h-[44px] text-sm"
            >
              Detect Location
            </button>
          )}
        </div>
      </section>

      {/* Data Management Section */}
      <section className="mb-8 zen-card p-6" data-tour="data-management">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-zen-stone-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Data Management</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Export your data for backup or import from a previous backup.
        </p>
        <DataManagement data={data} onDataImported={reload} flushSave={flushSave} />
      </section>

      {/* Share Section */}
      <section className="mb-8 zen-card p-6" data-tour="share-settings">
        <h2 className="text-lg font-medium text-zen-ink-700 mb-4">Share Allotment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Share your allotment data with another device. The share link expires after 5 minutes for security.
        </p>
        <ShareDialog data={data} flushSave={flushSave} />
      </section>

      {/* Guided Tours Section */}
      <section className="mb-8 zen-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-zen-water-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Guided Tours</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Interactive tours that help you learn each section of the app.
        </p>
        <TourManager />
      </section>

      {/* Receive Section */}
      <section className="mb-8 zen-card p-6">
        <h2 className="text-lg font-medium text-zen-ink-700 mb-4">Receive Allotment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Import allotment data shared from another device by scanning a QR code or entering a code.
        </p>
        <Link
          href="/receive"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          Receive Data
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  )
}
