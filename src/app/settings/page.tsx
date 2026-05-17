'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAllotment } from '@/hooks/useAllotment'
import { useApiToken } from '@/hooks/useSessionStorage'
import { useLocation } from '@/hooks/useLocation'
import { MapPin, Leaf, Database, HelpCircle, ChevronDown } from 'lucide-react'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import LocationStatus from '@/components/ai-advisor/LocationStatus'
import DataTab from '@/components/settings/DataTab'
import AiQuotaSection from '@/components/settings/AiQuotaSection'
import PageTour from '@/components/onboarding/PageTour'
import TourManager from '@/components/onboarding/TourManager'
import Tabs from '@/components/ui/Tabs'

export default function SettingsPage() {
  const { isSignedIn, signOut, userEmail } = useOptionalAuth()
  const { data, flushSave, reload, updateMeta, syncStatus } = useAllotment()
  const { token, saveToken, clearToken } = useApiToken()
  const { userLocation, locationError, detectUserLocation, isDetecting } = useLocation()
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

  const handleDeleteAccount = useCallback(async () => {
    const response = await fetch('/api/account', { method: 'DELETE' })
    if (!response.ok) throw new Error('Deletion failed')
    localStorage.removeItem('allotment-unified-data')
    await signOut()
  }, [signOut])

  // Handle paste - primary way to enter API key
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    setTempToken(pastedText.trim())
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-zen-ink-800">Settings</h1>
        <PageTour tourId="settings" />
      </div>

      <div className="zen-card p-6" data-tour="settings-tabs">
        {/* key remounts Tabs once Clerk auth resolves so `defaultTab` picks up
            the correct landing tab. Tabs only reads defaultTab on initial
            useState; without the remount, signed-in users would stay on Data. */}
        <Tabs
          key={isSignedIn ? 'signed-in' : 'signed-out'}
          defaultTab={isSignedIn ? 'ai-location' : 'data'}
          tabs={[
            ...(isSignedIn ? [{
              id: 'ai-location',
              label: 'AI & Location',
              icon: <Leaf className="w-4 h-4" />,
              content: (
                <div className="space-y-8">
                  {/* AI Assistant Section */}
                  <section data-tour="ai-settings">
                    <div className="flex items-center gap-2 mb-4">
                      <Leaf className="w-5 h-5 text-zen-moss-600" />
                      <h2 className="text-lg font-medium text-zen-ink-700">AI Assistant (Aitor)</h2>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Aitor can help with planting advice, pest identification, and even add plants to your garden.
                      Signed-in users get a free monthly quota; add your own OpenAI key below for unlimited use.
                    </p>

                    <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-md bg-zen-stone-50 border border-zen-stone-200">
                      <div className="text-sm text-zen-ink-700">
                        <p className="font-medium">Aitor chat</p>
                        <p className="text-xs text-zen-stone-500 mt-0.5">
                          {data?.meta?.aiAdvisorEnabled
                            ? 'Currently on. Floating chat launcher is visible on every page.'
                            : 'Currently off. Turn on to use Aitor.'}
                        </p>
                      </div>
                      <button
                        onClick={() => updateMeta({ aiAdvisorEnabled: !data?.meta?.aiAdvisorEnabled })}
                        className={`px-3 py-2 min-h-[44px] text-sm rounded-zen transition-colors shrink-0 ${
                          data?.meta?.aiAdvisorEnabled
                            ? 'bg-zen-stone-200 hover:bg-zen-stone-300 text-zen-ink-700'
                            : 'bg-zen-moss-600 hover:bg-zen-moss-700 text-white'
                        }`}
                      >
                        {data?.meta?.aiAdvisorEnabled ? 'Turn off' : 'Turn on'}
                      </button>
                    </div>

                    <div className="mb-4">
                      <AiQuotaSection hasOwnToken={!!token} />
                    </div>

                    <details
                      key={token ? 'has-token' : 'no-token'}
                      open={!!token}
                      className="group rounded-md border border-zen-stone-200 bg-white"
                    >
                      <summary className="flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden px-3 py-2 text-sm text-zen-ink-700 hover:bg-zen-stone-50 rounded-md">
                        <span>Use my own OpenAI API key (advanced)</span>
                        <ChevronDown
                          className="w-4 h-4 text-zen-stone-400 transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>

                      <div className="space-y-4 px-3 pb-3 pt-1">
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
                              placeholder="sk-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                              aria-describedby="token-help-text"
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

                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveToken}
                            disabled={!tempToken.trim()}
                            className="zen-btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                    </details>
                  </section>

                  {/* Location Section */}
                  <section className="pt-6 border-t border-zen-stone-200" data-tour="location-settings">
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
                </div>
              ),
            }] : []),
            {
              id: 'data',
              label: 'Data',
              icon: <Database className="w-4 h-4" />,
              content: (
                <DataTab
                  data={data}
                  flushSave={flushSave}
                  reload={reload}
                  updateMeta={updateMeta}
                  syncStatus={syncStatus}
                  isSignedIn={isSignedIn}
                  onDeleteAccount={isSignedIn ? handleDeleteAccount : undefined}
                  userEmail={userEmail}
                />
              ),
            },
            {
              id: 'help',
              label: 'Help',
              icon: <HelpCircle className="w-4 h-4" />,
              content: (
                <section data-tour="tour-management">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-zen-water-600" />
                    <h2 className="text-lg font-medium text-zen-ink-700">Guided Tours</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Interactive tours that help you learn each section of the app.
                  </p>
                  <TourManager />
                </section>
              ),
            },
          ]}
        />
      </div>
    </main>
  )
}
