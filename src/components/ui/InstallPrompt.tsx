'use client'

import { X, Download, Share, Plus } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * PWA Install Prompt Component
 *
 * Shows a subtle banner encouraging users to install the app.
 * Automatically appears after the second visit (meaningful engagement).
 * For iOS, shows custom "Add to Home Screen" instructions since iOS
 * doesn't support the beforeinstallprompt event.
 */
export default function InstallPrompt() {
  const {
    showPrompt,
    isIOS,
    canInstall,
    promptInstall,
    dismissPrompt,
    hidePrompt,
  } = useInstallPrompt()

  if (!showPrompt) return null

  // iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-slide-up">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 bg-zen-moss-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-zen-moss-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                Install Community Allotment
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Add this app to your home screen for quick access while in your garden.
              </p>

              {/* iOS Instructions */}
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  To install on iOS:
                </p>
                <ol className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="shrink-0 w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      1
                    </span>
                    <span className="flex items-center gap-1">
                      Tap the Share button
                      <Share className="w-4 h-4 text-blue-500" />
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="shrink-0 w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      2
                    </span>
                    <span className="flex items-center gap-1">
                      Scroll down and tap &quot;Add to Home Screen&quot;
                      <Plus className="w-4 h-4 text-gray-600" />
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={hidePrompt}
                  className="flex-1 px-3 py-2.5 min-h-[44px] text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Maybe later
                </button>
                <button
                  onClick={dismissPrompt}
                  className="flex-1 px-3 py-2.5 min-h-[44px] text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Don&apos;t show again
                </button>
              </div>
            </div>

            <button
              onClick={hidePrompt}
              className="shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Standard install prompt (Android/Desktop)
  if (!canInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-slide-up">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-zen-moss-100 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-zen-moss-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">
              Install Community Allotment
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Install the app for quick access while in your garden. Works offline too!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={promptInstall}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-zen-moss-600 text-white text-sm font-medium rounded-lg hover:bg-zen-moss-700 transition"
              >
                Install
              </button>
              <button
                onClick={hidePrompt}
                className="px-4 py-2.5 min-h-[44px] text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            onClick={dismissPrompt}
            className="shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            aria-label="Don't show install prompt again"
            title="Don't show again"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
