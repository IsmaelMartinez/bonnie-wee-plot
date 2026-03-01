'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useAllotment } from '@/hooks/useAllotment'
import { useApiToken } from '@/hooks/useSessionStorage'
import { useLocation } from '@/hooks/useLocation'
import { useDataTransfer } from '@/hooks/useDataTransfer'
import Link from 'next/link'
import {
  Download, Upload, ArrowRight, Shield, MapPin, Leaf, Database, HelpCircle,
  Share2, QrCode, Trash2, AlertTriangle, CheckCircle, RefreshCw, BarChart2,
} from 'lucide-react'
import LocationStatus from '@/components/ai-advisor/LocationStatus'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { clearAnalytics } from '@/lib/analytics'
import AnalyticsViewer from '@/components/allotment/AnalyticsViewer'
import PageTour from '@/components/onboarding/PageTour'
import TourManager from '@/components/onboarding/TourManager'
import Tabs from '@/components/ui/Tabs'

export default function SettingsPage() {
  const { data, flushSave, reload } = useAllotment()
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

      <div className="zen-card p-6">
        <Tabs
          defaultTab="ai-location"
          tabs={[
            {
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
                      Configure your OpenAI API key to use Aitor, your AI gardening assistant.
                      Aitor can help with planting advice, pest identification, and even add plants to your garden.
                    </p>

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
                            placeholder="sk-..."
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
            },
            {
              id: 'data',
              label: 'Data',
              icon: <Database className="w-4 h-4" />,
              content: <DataTab data={data} flushSave={flushSave} reload={reload} />,
            },
            {
              id: 'help',
              label: 'Help',
              icon: <HelpCircle className="w-4 h-4" />,
              content: (
                <section>
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

/**
 * Data tab with unified Transfer and Storage sections.
 */
function DataTab({ data, flushSave, reload }: {
  data: ReturnType<typeof useAllotment>['data']
  flushSave: ReturnType<typeof useAllotment>['flushSave']
  reload: ReturnType<typeof useAllotment>['reload']
}) {
  const {
    handleExport, exportSuccess,
    handleImport, importError, fileInputRef, lastBackupKey, handleRestoreBackup,
    handleClear, showClearConfirm, setShowClearConfirm,
    stats, quota,
  } = useDataTransfer({ data, onDataImported: reload, flushSave })

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showClearAnalyticsConfirm, setShowClearAnalyticsConfirm] = useState(false)
  const [analyticsKey, setAnalyticsKey] = useState(0)

  const handleClearAnalytics = useCallback(() => {
    clearAnalytics()
    setAnalyticsKey(k => k + 1)
    setShowClearAnalyticsConfirm(false)
  }, [])

  return (
    <div className="space-y-8">
      {/* Transfer Data Section */}
      <section data-tour="data-management">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-zen-stone-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Transfer Data</h2>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Share or move your allotment data between devices.
        </p>

        {/* Send */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Send</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Share via Link */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Share2 className="w-4 h-4 text-zen-moss-600" />
                Share via Link
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Generate a QR code and share code for another device.
              </p>
              <div className="mt-1" data-tour="share-settings">
                <ShareDialog data={data} flushSave={flushSave} />
              </div>
            </div>

            {/* Export as File */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Download className="w-4 h-4 text-zen-moss-600" />
                Export as File
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Download a JSON backup of all your data.
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={!data}
                  className="flex items-center gap-2 px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <Download className="w-4 h-4" />
                  Export Backup
                </button>
                {exportSuccess && (
                  <span className="flex items-center gap-1 text-zen-moss-600 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Done!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Receive */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Receive</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Receive via Code */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <QrCode className="w-4 h-4 text-zen-water-600" />
                Receive via Code
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Scan a QR code or enter a share code.
              </p>
              <div className="mt-1">
                <Link
                  href="/receive"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm min-h-[44px]"
                >
                  <QrCode className="w-4 h-4" />
                  Receive Data
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Import from File */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Upload className="w-4 h-4 text-zen-water-600" />
                Import from File
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Restore from a JSON backup file.
              </p>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImport}
                  className="hidden"
                  id="settings-import-file"
                  aria-label="Select backup file to import"
                />
                <label
                  htmlFor="settings-import-file"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  Select Backup File
                </label>
              </div>
            </div>
          </div>

          {/* Import error/success messages */}
          {importError && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-zen-kitsune-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zen-kitsune-700">{importError.message}</p>
                    <p className="text-xs text-zen-kitsune-600 mt-1">Error Code: {importError.code}</p>
                  </div>
                </div>

                {importError.suggestions.length > 0 && (
                  <div className="mt-3 pl-6">
                    <p className="text-xs font-medium text-zen-kitsune-700 mb-1">Recovery Steps:</p>
                    <ul className="text-xs text-zen-kitsune-600 space-y-1">
                      {importError.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-zen-kitsune-400 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {lastBackupKey && importError.recoverable && (
                <button
                  onClick={handleRestoreBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-zen-bamboo-600 text-white rounded-lg hover:bg-zen-bamboo-700 transition w-full justify-center"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restore from Backup
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Storage Section */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-zen-stone-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Storage</h2>
        </div>

        {/* Storage Stats */}
        {stats && (
          <div className={`rounded-lg p-4 mb-4 ${quota.percentageUsed > 80 ? 'bg-zen-bamboo-50 border border-zen-bamboo-200' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-500">Allotment Data</p>
                <p className="text-lg font-semibold text-gray-900">{stats.dataSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total localStorage</p>
                <p className="text-lg font-semibold text-gray-900">{stats.used}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Quota Usage</span>
                <span>{quota.percentageUsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    quota.percentageUsed > 90 ? 'bg-zen-kitsune-500' :
                    quota.percentageUsed > 80 ? 'bg-zen-bamboo-500' :
                    'bg-zen-moss-500'
                  }`}
                  style={{ width: `${Math.min(quota.percentageUsed, 100)}%` }}
                />
              </div>
            </div>
            {quota.percentageUsed > 80 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Storage is {quota.percentageUsed.toFixed(0)}% full. Consider exporting your data and clearing old backups.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        <div className="mb-4">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            <BarChart2 className="w-4 h-4" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <p className="text-xs text-gray-500 mt-1">Local usage patterns only. No data sent externally.</p>

          {showAnalytics && (
            <AnalyticsViewer
              key={analyticsKey}
              onClearClick={() => setShowClearAnalyticsConfirm(true)}
            />
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-zen-kitsune-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-zen-kitsune-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-zen-kitsune-600 mb-3">
            Clear all data and start fresh. This cannot be undone.
          </p>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zen-kitsune-600 text-white rounded-lg hover:bg-zen-kitsune-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </section>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear All Data?"
        message="This will permanently delete all your allotment data including all seasons, plantings, and settings. This action cannot be undone. Consider exporting a backup first."
        confirmText="Delete Everything"
        cancelText="Keep Data"
        variant="danger"
      />

      {/* Clear Analytics Confirmation */}
      <ConfirmDialog
        isOpen={showClearAnalyticsConfirm}
        onClose={() => setShowClearAnalyticsConfirm(false)}
        onConfirm={handleClearAnalytics}
        title="Clear Analytics Data?"
        message="This will delete all analytics data. This cannot be undone."
        confirmText="Clear Analytics"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
