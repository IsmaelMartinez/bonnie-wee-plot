/**
 * StorageFlagReloadBanner (ADR 027 Step 3, PR-A foundation)
 *
 * Cross-tab guard for `USE_YJS_STORAGE` transitions. When the storage
 * engine flips between releases, two tabs in the same browser can end
 * up writing through different chains (one through the Yjs mirror, one
 * through the legacy chain), which would clobber each other in
 * localStorage. This banner detects the divergence and asks the user
 * to reload so all tabs land on the same value.
 *
 * Protocol:
 *   - On mount, post the current `USE_YJS_STORAGE` value on the
 *     `bwp-storage-flag` BroadcastChannel.
 *   - Each tab tracks its own captured value (the constant at the time
 *     of its load).
 *   - If a sibling broadcasts a value different from this tab's
 *     captured one, render the reload banner.
 *
 * The banner is intentionally not dismissible — once the storage engine
 * disagrees, the user has to reload before continuing safely. Using
 * `zen-*` Tailwind tokens for consistency with `StorageWarningBanner`
 * and the rest of the app's banner UI.
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { USE_YJS_STORAGE } from '@/config/release-visibility'

const CHANNEL_NAME = 'bwp-storage-flag'

interface StorageFlagMessage {
  flag: boolean
}

export default function StorageFlagReloadBanner() {
  const [needsReload, setNeedsReload] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(CHANNEL_NAME)
    const myFlag = USE_YJS_STORAGE

    const handleMessage = (event: MessageEvent<StorageFlagMessage>) => {
      const incoming = event.data?.flag
      if (typeof incoming !== 'boolean') return
      if (incoming !== myFlag) {
        setNeedsReload(true)
      }
    }

    channel.addEventListener('message', handleMessage)
    // Broadcast our value so any other tab can compare. New tabs that
    // open after us receive this when *they* mount and post; we receive
    // theirs. Both ends therefore see the disagreement.
    channel.postMessage({ flag: myFlag } satisfies StorageFlagMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [])

  if (!needsReload) return null

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-zen-kitsune-50 border-b border-zen-kitsune-200 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-zen-kitsune-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-zen-kitsune-900 text-sm mb-1">
              Storage engine changed
            </h3>
            <p className="text-sm text-zen-kitsune-800 mb-2">
              Another tab is using a different storage engine. Reload
              this tab to keep your data consistent across tabs.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-zen-kitsune-600 text-white hover:bg-zen-kitsune-700 transition"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
